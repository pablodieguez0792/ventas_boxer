from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import (
    Product,
    Sale,
    SaleItem,
    Quote,
    QuoteItem,
    Customer,
    ChatConversation,
    ChatMessage,
    ChatbotSection,
    ChatbotQuestion
)
import json
import os
from datetime import datetime, timedelta
import logging
from logger import get_logger
from knowledge_manager import KnowledgeManager
import openai
from fuzzywuzzy import fuzz
import re
import ipaddress
# from rsf_routes import router as rsf_router  # Removed to avoid circular import

try:
    # Optional OpenAI integration
    import openai  # type: ignore
except Exception:
    openai = None

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

# send_sale_to_caja endpoint moved to main.py

@router.post("/api/quotes")
def create_quote(quote_data: dict, db: Session = Depends(get_db)):
    """Create a new quote"""
    print(f"[DEBUG] Received quote data: {quote_data}")
    
    try:
        # Extract cart items and totals from frontend
        cart_items = quote_data.get('cartItems', [])
        if not cart_items:
            raise HTTPException(status_code=400, detail="No cart items provided")
        
        # Use totals calculated by frontend
        subtotal = float(quote_data.get('subtotal', 0))
        discount_amount = float(quote_data.get('discountAmount', 0))
        tax_amount = float(quote_data.get('taxAmount', 0))
        total = float(quote_data.get('total', 0))
        
        # Build vehicle info from quote data
        vehicle_info = f"Chasis: {quote_data.get('vehicleChasis', '')}, Motor: {quote_data.get('vehicleEngine', '')}, Patente: {quote_data.get('vehiclePlate', '')}"
        
        # Convert valid_until string to datetime if provided
        valid_until = None
        if quote_data.get('validUntil'):
            try:
                valid_until = datetime.strptime(quote_data.get('validUntil'), '%Y-%m-%d')
                print(f"[DEBUG] Converted validUntil '{quote_data.get('validUntil')}' to datetime: {valid_until}")
            except ValueError:
                print(f"[WARNING] Invalid date format for validUntil: {quote_data.get('validUntil')}")
        
        # Create quote
        quote = Quote(
            customer_id=None,  # Will be set if customer is selected
            customer_name=quote_data.get('clientName', 'Cliente no especificado'),
            customer_email=quote_data.get('clientEmail', ''),
            customer_phone=quote_data.get('clientPhone', ''),
            vehicle_info=vehicle_info.strip(),
            subtotal=subtotal,
            discount_amount=discount_amount,
            discount_percentage=0.0,
            tax_amount=tax_amount,
            total=total,
            valid_until=valid_until,
            notes=quote_data.get('notes', ''),
            status="active"
        )
        db.add(quote)
        db.flush()
        
        # Add quote items
        for item in cart_items:
            quantity = float(item.get('quantity', 1))
            price = float(item.get('price', 0))
            item_subtotal = quantity * price
            
            quote_item = QuoteItem(
                quote_id=quote.id,
                product_id=item.get('id'),
                quantity=quantity,
                unit_price=price,
                subtotal=item_subtotal
            )
            db.add(quote_item)
            print(f"[DEBUG] Added quote item: {item.get('name', 'Unknown')} x{quantity}")
        
        db.commit()
        return {"message": "Quote created successfully", "quote_id": quote.id}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/cleanup_conversations")
def cleanup_conversations(db: Session = Depends(get_db)):
    """Clean up old conversations."""
    try:
        cutoff = datetime.utcnow() - timedelta(days=15)
        old = db.query(ChatConversation).filter(ChatConversation.last_activity_at < cutoff).all()
        count = len(old)
        for c in old:
            db.delete(c)
        db.commit()
        return {"message": f"Cleaned up {count} old conversations"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/sales/{sale_id}/invoice")
def invoice_sale(sale_id: int, payment_data: dict, db: Session = Depends(get_db)):
    """Convert pending sale to invoice"""
    try:
        sale = db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        if sale.status != "pending_invoice":
            raise HTTPException(status_code=400, detail="Sale is not pending invoice")
        
        # Update sale status
        sale.status = "invoiced"
        sale.payment_method = payment_data.get('payment_method')
        sale.invoiced_at = datetime.utcnow()
        
        # TODO: Implement stock reduction logic here
        # for item in sale.items:
        #     product = item.product
        #     product.stock -= item.quantity
        
        db.commit()
        return {"message": "Sale invoiced successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/quotes/{quote_id}")
def delete_quote(quote_id: int, db: Session = Depends(get_db)):
    """Delete a quote"""
    try:
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        db.delete(quote)
        db.commit()
        return {"message": "Quote deleted successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/quotes/{quote_id}/convert")
def convert_quote_to_sale(quote_id: int, db: Session = Depends(get_db)):
    """Convert quote to sale"""
    try:
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Create sale from quote
        sale = Sale(
            customer_id=quote.customer_id,
            reference=f"Converted from Quote #{quote.id}",
            seller="Sistema",
            subtotal=quote.subtotal,
            discount_amount=quote.discount_amount,
            discount_percentage=quote.discount_percentage,
            total=quote.total,
            status="pending_invoice"
        )
        db.add(sale)
        db.flush()
        
        # Copy quote items to sale items
        for quote_item in quote.quote_items:
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=quote_item.product_id,
                quantity=quote_item.quantity,
                unit_price=quote_item.unit_price,
                subtotal=quote_item.subtotal
            )
            db.add(sale_item)
        
        # Update quote status
        quote.status = "converted"
        
        db.commit()
        return {"message": "Quote converted to sale successfully", "sale_id": sale.id}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Configuration endpoints
@router.get("/api/configurations")
def get_configurations(db: Session = Depends(get_db)):
    """Get all configurations"""
    from models import Configuration
    configs = db.query(Configuration).all()
    return {config.key: json.loads(config.value) for config in configs}

@router.post("/api/configurations")
def save_configuration(config_data: dict, db: Session = Depends(get_db)):
    """Save or update configuration"""
    from models import Configuration
    try:
        for key, value in config_data.items():
            # Check if configuration exists
            existing_config = db.query(Configuration).filter(Configuration.key == key).first()
            
            if existing_config:
                existing_config.value = json.dumps(value)
                existing_config.updated_at = datetime.utcnow()
            else:
                new_config = Configuration(
                    key=key,
                    value=json.dumps(value)
                )
                db.add(new_config)
        
        db.commit()
        return {"message": "Configurations saved successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- Chatbot & Conversations ----------------

def _anonymize_text(value: str) -> str:
    if not value:
        return value
    import re
    def mask_digits(match):
        s = match.group(0)
        if len(s) <= 3:
            return s
        return '*' * (len(s) - 3) + s[-3:]
    # Mask long digit sequences (e.g., CUIT)
    value = re.sub(r"\d{7,}", mask_digits, value)
    # Mask emails: replace user part with ***
    value = re.sub(r"([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+)", r"***@\2", value)
    # Coarse address masking: replace street numbers with ###
    value = re.sub(r"(\b(Calle|Av\.?|Avenida|Ruta|Pasaje)\b[^\n\r,]*?)\s(\d{1,5})", r"\1 ###", value, flags=re.IGNORECASE)
    return value


@router.post("/api/seed_chatbot")
def seed_chatbot(db: Session = Depends(get_db)):
    try:
        proveedores = []
        for i in range(5):
            prov = TestProveedor(
                nombre=f"Proveedor {i+1}",
                cuit=f"30{random.randint(10000000, 99999999)}",
                cant_articulos=0,
                ultima_factura_impaga=f"FAC-{random.randint(1000,9999)}",
                deuda_cc=round(random.uniform(100000, 900000), 2),
            )
            db.add(prov)
            db.flush()
            proveedores.append(prov)

        for i in range(40):
            prov = random.choice(proveedores)
            art = TestArticulo(
                codigo=f"ART-{1000+i}",
                descripcion=f"Artículo de prueba {i+1}",
                marca=random.choice(["Bosch", "NGK", "SKF", "ACDelco", "Valeo"]),
                stock=random.randint(0, 200),
                ventas_30d=random.randint(0, 150),
                proveedor_id=prov.id,
            )
            db.add(art)
            prov.cant_articulos += 1

        for i in range(30):
            cli = TestCliente(
                cuit=f"20{random.randint(10000000, 99999999)}",
                nombre=f"Cliente {i+1}",
                direccion=f"Calle {i+1} #{random.randint(100, 999)}",
                deuda_cc=round(random.uniform(0, 500000), 2),
            )
            db.add(cli)

        for i in range(10):
            usr = TestUsuario(
                cuit=f"27{random.randint(10000000, 99999999)}",
                nombre=f"Usuario {i+1}",
                direccion=f"Av. Principal {i+1}",
            )
            db.add(usr)

        db.commit()
        return {"message": "Datos de prueba creados"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/conversations")
def list_conversations(from_date: str | None = None, to_date: str | None = None, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """List conversations with optional date filtering."""
    query = db.query(ChatConversation)
    
    if from_date:
        try:
            from_dt = datetime.fromisoformat(from_date)
            query = query.filter(ChatConversation.started_at >= from_dt)
        except ValueError:
            pass
    
    if to_date:
        try:
            to_dt = datetime.fromisoformat(to_date)
            query = query.filter(ChatConversation.started_at <= to_dt)
        except ValueError:
            pass
    
    conversations = query.order_by(ChatConversation.last_activity_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for conv in conversations:
        msg_count = db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).count()
        result.append({
            "id": conv.id,
            "title": conv.title,
            "started_at": conv.started_at.isoformat(),
            "last_activity_at": conv.last_activity_at.isoformat(),
            "message_count": msg_count,
            "client_cuit": conv.client_cuit[:3] + "***" + conv.client_cuit[-2:] if conv.client_cuit else None
        })
    
    return result


@router.get("/api/conversations/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Get full conversation with messages."""
    conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.created_at).all()
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "started_at": conversation.started_at.isoformat(),
        "last_activity_at": conversation.last_activity_at.isoformat(),
        "client_cuit": conversation.client_cuit[:3] + "***" + conversation.client_cuit[-2:] if conversation.client_cuit else None,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }


@router.get("/api/conversations/last_for_ip")
def get_last_conversation_for_ip(request: Request, db: Session = Depends(get_db)):
    """Get the most recent conversation for the current IP."""
    client_ip = _get_client_ip(request)
    conversation = db.query(ChatConversation).filter(
        ChatConversation.ip_address == client_ip
    ).order_by(ChatConversation.last_activity_at.desc()).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="No conversation found for this IP")
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "last_activity_at": conversation.last_activity_at.isoformat()
    }


@router.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Delete a conversation and all its messages."""
    conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted successfully"}


def _get_client_ip(request: Request) -> str:
    # Respect proxies if present
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    client = request.client.host if request.client else None
    return client or "unknown"


def _extract_cuit(text: str) -> str | None:
    """Return a normalized CUIT (11 digits) if present in text, else None."""
    if not text:
        return None
    
    # Look for CUIT patterns with or without dashes
    # Pattern: XX-XXXXXXXX-X or XXXXXXXXXXX (11 digits total)
    cuit_pattern = r'(?:^|\s)(\d{2}[-]?\d{8}[-]?\d{1})(?:\s|$)'
    match = re.search(cuit_pattern, text)
    
    if match:
        cuit_candidate = match.group(1)
        # Remove all non-digits
        digits = re.sub(r"\D", "", cuit_candidate)
        # Verify it's exactly 11 digits
        if len(digits) == 11:
            return digits
    
    # Fallback: look for any 11-digit sequence
    digits = re.sub(r"\D", "", text)
    if len(digits) == 11:
        return digits
    
    return None


@router.post("/api/chat")
def chat(payload: dict, request: Request, db: Session = Depends(get_db)):
    """Legacy chat endpoint - redirects to new conversation endpoint."""
    return chatbot_conversation(payload, request, db)


# ---------------- New Conversation-based Chatbot ----------------

@router.post("/api/chatbot/conversation")
def chatbot_conversation(payload: dict, request: Request, db: Session = Depends(get_db)):
    """
    BOXER AI - Asistente inteligente de negocios para repuesteros.
    Expects: { "message": string, "conversation_id": optional int }
    Returns: { "reply": string, "conversation_id": int, "conversation_state": string, "business_data": optional dict }
    """
    try:
        if openai is None:
            raise HTTPException(status_code=503, detail="OpenAI SDK not available")

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")

        openai.api_key = api_key
        
        user_message = (payload or {}).get("message", "").strip()
        conversation_id = (payload or {}).get("conversation_id")
        client_ip = _get_client_ip(request)
        
        log_event({
            "event": "chatbot_message_received",
            "message_length": len(user_message),
            "conversation_id": conversation_id,
            "ip": _anonymize_text(client_ip)
        })

        # Get or create conversation
        if conversation_id:
            conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation
            conversation = ChatConversation(
                title="Nueva conversación",
                ip_address=client_ip
            )
            db.add(conversation)
            db.flush()
            
            # Add welcome message from assistant
            welcome_msg = ChatMessage(
                conversation_id=conversation.id,
                role="assistant",
                content="¡Hola! Bienvenido a POS Boxer. Para poder ayudarte mejor, ¿eres un cliente existente o es tu primera vez con nosotros?"
            )
            db.add(welcome_msg)

        # Save user message
        user_msg = ChatMessage(
            conversation_id=conversation.id,
            role="user",
            content=user_message
        )
        db.add(user_msg)
        db.flush()  # Ensure the message is saved before querying
        
        # Get conversation history including the new user message
        messages = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation.id
        ).order_by(ChatMessage.created_at).all()
        
        # Check for CUIT in current message and update conversation FIRST
        cuit = _extract_cuit(user_message)
        if cuit and not conversation.client_cuit:
            # Store CUIT without dashes (raw digits) for internal use
            conversation.client_cuit = cuit
            conversation.title = f"Cliente CUIT {cuit[:3]}***{cuit[-2:]}"
        
        # Determine conversation state and build appropriate prompt
        conversation_state = _determine_conversation_state(conversation, messages)
        
        # Get business data if client is identified (now or previously)
        business_data = None
        if conversation.client_cuit:
            business_data = _get_business_data(conversation.client_cuit, db)
        
        # Search for relevant knowledge based on user message
        relevant_knowledge = knowledge_manager.search_relevant_content(user_message)
        
        system_prompt, reply = _generate_contextual_reply(conversation, messages, user_message, conversation_state, business_data, relevant_knowledge)
        
        # Save assistant response
        assistant_msg = ChatMessage(
            conversation_id=conversation.id,
            role="assistant", 
            content=reply
        )
        db.add(assistant_msg)
        
        # Update conversation metadata
        conversation.last_activity_at = datetime.utcnow()
        
        db.commit()
        
        log_event({
            "event": "chatbot_reply_generated",
            "conversation_id": conversation.id,
            "state": conversation_state,
            "reply_length": len(reply)
        })
        
        return {
            "reply": reply,
            "conversation_id": conversation.id,
            "conversation_state": conversation_state,
            "system_prompt": system_prompt,
            "business_data": business_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _determine_conversation_state(conversation: ChatConversation, messages: list) -> str:
    """Determine the current state of the conversation based on messages."""
    if len(messages) <= 1:  # Just welcome message
        return "initial"
    
    # Get user messages only
    user_messages = [msg for msg in messages if msg.role == "user"]
    
    if not user_messages:
        return "initial"
    
    # Check if CUIT was provided in any message
    for msg in reversed(user_messages):
        if _extract_cuit(msg.content):
            return "cuit_provided"
    
    # Check if any user message indicates client type
    last_user_message = user_messages[-1].content.lower()
    
    # More comprehensive keywords for existing clients
    existing_keywords = [
        "soy usuario", "soy cliente", "tengo cuenta", "ya uso", "uso boxer", 
        "trabajo con boxer", "mi cuit", "mi negocio", "mis clientes",
        "mis datos", "acceder", "ingresar", "cliente existente", "usuario existente"
    ]
    
    # Keywords for new users  
    new_keywords = [
        "primera vez", "no tengo", "no soy", "no uso", "nunca use", "conocer boxer",
        "que es boxer", "como funciona", "empezar", "comenzar", "nuevo", "no conozco"
    ]
    
    # Simple greetings that need clarification
    simple_greetings = ["hola", "buenos dias", "buenas tardes", "buenas noches", "saludos", "hey"]
    
    # Check if it's just a simple greeting
    is_simple_greeting = any(greeting in last_user_message for greeting in simple_greetings) and len(last_user_message.split()) <= 3
    
    has_existing_indication = any(keyword in last_user_message for keyword in existing_keywords)
    has_new_indication = any(keyword in last_user_message for keyword in new_keywords)
    
    if has_existing_indication:
        return "existing_client"
    elif has_new_indication:
        return "new_client"
    elif is_simple_greeting or len(user_messages) == 1:
        return "clarify_client_type"
    else:
        return "clarify_client_type"


def _generate_contextual_reply(conversation: ChatConversation, messages: list, user_message: str, state: str, business_data: dict = None, relevant_knowledge: list = None) -> tuple[str, str]:
    """Generate appropriate reply based on conversation state."""
    if openai is None:
        return "", "OpenAI no disponible"
    
    # Build conversation history for OpenAI
    system_content = _get_system_prompt(state)
    if business_data:
        system_content += f"\n\nDATOS DEL NEGOCIO DEL REPUESTERO:\n{_format_business_data(business_data)}"
    
    # Add relevant knowledge if available
    if relevant_knowledge:
        knowledge_content = knowledge_manager.format_knowledge_for_prompt(relevant_knowledge)
        system_content += knowledge_content
    
    chat_messages = [
        {"role": "system", "content": system_content}
    ]
    
    # Add recent conversation history (last 10 messages)
    recent_messages = messages[-10:] if len(messages) > 10 else messages
    for msg in recent_messages:
        if msg.role in ["user", "assistant"]:
            chat_messages.append({"role": msg.role, "content": msg.content})
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=chat_messages,
            temperature=0.3,
            max_tokens=300,
        )
        reply = response["choices"][0]["message"]["content"].strip()
        
        # Only override reply for critical flow states, let OpenAI handle natural conversation
        if state == "cuit_provided":
            cuit = _extract_cuit(user_message)
            if cuit:
                # Try to get business owner name from test_usuarios table
                try:
                    from database import SessionLocal
                    db = SessionLocal()
                    # Format CUIT for database comparison (add dashes)
                    formatted_cuit = f"{cuit[:2]}-{cuit[2:10]}-{cuit[10]}" if len(cuit) == 11 else cuit
                    usuario = db.query(TestUsuario).filter(TestUsuario.cuit == formatted_cuit).first()
                    if usuario:
                        reply = f"¡Hola {usuario.nombre}! Te he identificado correctamente. ¿En qué puedo ayudarte con tu negocio hoy? Puedo consultar tus clientes, proveedores, artículos, o ayudarte con cualquier análisis que necesites."
                    else:
                        reply = f"No encontré tu CUIT {cuit[:3]}***{cuit[-2:]} en nuestro sistema. ¿Podrías verificar que esté correcto? Si eres nuevo, puedo explicarte cómo Boxer puede ayudarte a gestionar tu negocio de autopartes."
                    db.close()
                except Exception:
                    reply = f"¡Perfecto! Te he identificado con CUIT {cuit[:3]}***{cuit[-2:]}. ¿En qué puedo ayudarte con tu negocio hoy?"
        
        return chat_messages[0]["content"], reply
        
    except Exception as e:
        return "", f"Error al generar respuesta: {str(e)}"


def _get_business_data(cuit: str, db: Session) -> dict:
    """Get comprehensive business data for the identified repuestero."""
    try:
        # Format CUIT for database comparison (add dashes)
        formatted_cuit = f"{cuit[:2]}-{cuit[2:10]}-{cuit[10]}" if len(cuit) == 11 else cuit
        
        # Get user data from test_usuarios
        usuario = db.query(TestUsuario).filter(TestUsuario.cuit == formatted_cuit).first()
        if not usuario:
            return {"error": "Usuario no encontrado"}
        
        # Get all clients - in a real system, these would be filtered by business owner
        # For now, we'll get all test data as if they belong to this user
        clientes = db.query(TestCliente).all()
        
        # Get suppliers
        proveedores = db.query(TestProveedor).all()
        
        # Get articles
        articulos = db.query(TestArticulo).all()
        
        return {
            "owner": {
                "nombre": usuario.nombre,
                "cuit": cuit,
                "direccion": usuario.direccion
            },
            "clientes": {
                "total": len(clientes),
                "con_deuda": len([c for c in clientes if c.deuda_cc > 0]),
                "deuda_total": sum(c.deuda_cc for c in clientes),
                "top_deudores": sorted([c for c in clientes if c.deuda_cc > 0], key=lambda x: x.deuda_cc, reverse=True)[:3],
                "ventas_30d_total": sum(c.monto_vendido_30d or 0 for c in clientes),
                "promedio_ventas_cliente": sum(c.monto_vendido_30d or 0 for c in clientes) / len(clientes) if clientes else 0,
                "clientes_activos_30d": len([c for c in clientes if (c.cantidad_ventas or 0) > 0]),
                "top_compradores": sorted(clientes, key=lambda x: x.monto_vendido_30d or 0, reverse=True)[:3],
                "clientes_nuevos": len([c for c in clientes if c.fecha_ingreso and (datetime.utcnow() - c.fecha_ingreso).days <= 30])
            },
            "proveedores": {
                "total": len(proveedores),
                "con_deuda": len([p for p in proveedores if p.deuda_cc > 0]),
                "deuda_total": sum(p.deuda_cc for p in proveedores),
                "principales": sorted(proveedores, key=lambda x: x.cant_articulos, reverse=True)[:3],
                "compras_30d_total": sum(getattr(p, 'monto_comprado_30d', 0) or 0 for p in proveedores),
                "promedio_compras": sum(getattr(p, 'monto_comprado_30d', 0) or 0 for p in proveedores) / len(proveedores) if proveedores else 0,
                "proveedores_activos": len([p for p in proveedores if (getattr(p, 'cantidad_pedidos_30d', 0) or 0) > 0]),
                "top_compras": sorted(proveedores, key=lambda x: getattr(x, 'monto_comprado_30d', 0) or 0, reverse=True)[:3],
                "mejor_calificados": sorted([p for p in proveedores if getattr(p, 'calificacion', 0) > 0], key=lambda x: getattr(x, 'calificacion', 0), reverse=True)[:3],
                "entrega_rapida": sorted([p for p in proveedores if getattr(p, 'dias_promedio_entrega', 999) > 0], key=lambda x: getattr(x, 'dias_promedio_entrega', 999))[:3]
            },
            "articulos": {
                "total": len(articulos),
                "bajo_stock": len([a for a in articulos if a.stock < 10]),
                "sin_stock": len([a for a in articulos if a.stock == 0]),
                "mas_vendidos": sorted(articulos, key=lambda x: x.ventas_30d, reverse=True)[:5],
                "menos_vendidos": sorted([a for a in articulos if a.ventas_30d == 0], key=lambda x: a.stock, reverse=True)[:3]
            }
        }
    except Exception as e:
        return {"error": str(e)}


def _format_business_data(data: dict) -> str:
    """Format business data for AI context."""
    if "error" in data:
        return f"Error accediendo a datos: {data['error']}"
    
    # Format top debtors
    deudores_info = ""
    if data['clientes']['top_deudores']:
        deudores_info = "\nTOP DEUDORES:\n"
        for i, cliente in enumerate(data['clientes']['top_deudores'], 1):
            deudores_info += f"  {i}. {cliente.nombre}: ${cliente.deuda_cc:,.2f}\n"
    
    # Format top buyers
    compradores_info = ""
    if data['clientes']['top_compradores']:
        compradores_info = "\nTOP COMPRADORES (30 días):\n"
        for i, cliente in enumerate(data['clientes']['top_compradores'], 1):
            compradores_info += f"  {i}. {cliente.nombre}: ${cliente.monto_vendido_30d:,.2f} - {cliente.cantidad_ventas} ventas\n"
    
    # Format top suppliers by purchases
    top_compras_info = ""
    if data['proveedores']['top_compras']:
        top_compras_info = "\nTOP PROVEEDORES POR COMPRAS (30 días):\n"
        for i, prov in enumerate(data['proveedores']['top_compras'], 1):
            monto = getattr(prov, 'monto_comprado_30d', 0) or 0
            pedidos = getattr(prov, 'cantidad_pedidos_30d', 0) or 0
            top_compras_info += f"  {i}. {prov.nombre}: ${monto:,.2f} - {pedidos} pedidos\n"
    
    # Format best rated suppliers
    mejor_calificados_info = ""
    if data['proveedores']['mejor_calificados']:
        mejor_calificados_info = "\nPROVEEDORES MEJOR CALIFICADOS:\n"
        for i, prov in enumerate(data['proveedores']['mejor_calificados'], 1):
            calificacion = getattr(prov, 'calificacion', 0) or 0
            entrega = getattr(prov, 'dias_promedio_entrega', 0) or 0
            mejor_calificados_info += f"  {i}. {prov.nombre}: {calificacion:.1f}⭐ - Entrega: {entrega} días\n"
    
    # Format fastest delivery suppliers
    entrega_rapida_info = ""
    if data['proveedores']['entrega_rapida']:
        entrega_rapida_info = "\nPROVEEDORES MÁS RÁPIDOS:\n"
        for i, prov in enumerate(data['proveedores']['entrega_rapida'], 1):
            dias = getattr(prov, 'dias_promedio_entrega', 0) or 0
            calificacion = getattr(prov, 'calificacion', 0) or 0
            entrega_rapida_info += f"  {i}. {prov.nombre}: {dias} días - {calificacion:.1f}⭐\n"
    
    # Format bestsellers
    vendidos_info = ""
    if data['articulos']['mas_vendidos']:
        vendidos_info = "\nARTÍCULOS MÁS VENDIDOS (30 días):\n"
        for i, art in enumerate(data['articulos']['mas_vendidos'], 1):
            vendidos_info += f"  {i}. {art.descripcion} ({art.marca}): {art.ventas_30d} ventas, Stock: {art.stock}\n"
    
    formatted = f"""NEGOCIO DE {data['owner']['nombre']} (CUIT: {data['owner']['cuit']}):
Dirección: {data['owner']['direccion']}

CLIENTES:
- Total: {data['clientes']['total']} clientes
- Con deuda: {data['clientes']['con_deuda']} clientes
- Deuda total a cobrar: ${data['clientes']['deuda_total']:,.2f}
- Ventas últimos 30 días: ${data['clientes']['ventas_30d_total']:,.2f}
- Promedio de ventas por cliente: ${data['clientes']['promedio_ventas_cliente']:,.2f}
- Clientes activos (con ventas): {data['clientes']['clientes_activos_30d']}
- Clientes nuevos (último mes): {data['clientes']['clientes_nuevos']}{deudores_info}{compradores_info}
PROVEEDORES:
- Total: {data['proveedores']['total']} proveedores
- Con deuda pendiente: {data['proveedores']['con_deuda']} proveedores
- Deuda total a pagar: ${data['proveedores']['deuda_total']:,.2f}
- Compras últimos 30 días: ${data['proveedores']['compras_30d_total']:,.2f}
- Promedio de compras por proveedor: ${data['proveedores']['promedio_compras']:,.2f}
- Proveedores activos (con pedidos): {data['proveedores']['proveedores_activos']}{top_compras_info}{mejor_calificados_info}{entrega_rapida_info}
ARTÍCULOS:
- Total en catálogo: {data['articulos']['total']} artículos
- Con stock bajo (<10): {data['articulos']['bajo_stock']} artículos
- Sin stock: {data['articulos']['sin_stock']} artículos{vendidos_info}
Con esta información detallada puedes dar consejos específicos y personalizados sobre el negocio."""
    
    return formatted


def _get_system_prompt(state: str) -> str:
    """Get system prompt based on conversation state."""
    base_prompt = """Eres BOXER AI, el asistente inteligente de negocios para repuesteros argentinos. 

TU PERSONALIDAD:
- Eres cálido, empático y genuinamente interesado en ayudar al repuestero a crecer su negocio
- Hablas como un colega experimentado del rubro que entiende los desafíos diarios
- Usas un tono profesional pero cercano, como un amigo que sabe del tema
- Siempre buscas ser útil y práctico, no solo informativo

TU CONOCIMIENTO:
- Conoces profundamente el rubro de autopartes en Argentina
- Entiendes los desafíos de gestionar stock, proveedores, clientes y ventas
- Sabes sobre marcas, compatibilidades, estacionalidad del negocio
- Puedes ayudar con cálculos, métricas, organización y estrategias comerciales

TU FUNCIÓN:
- Una vez identificado el repuestero por CUIT, accedes a SUS datos específicos
- SIEMPRE usa los datos reales del negocio cuando están disponibles
- Cuando te pregunten por "mejores clientes", usa la lista de TOP COMPRADORES
- Cuando te pregunten por deudores, usa la lista de TOP DEUDORES
- Cuando te pregunten por proveedores, usa TOP COMPRAS, MEJOR CALIFICADOS o MÁS RÁPIDOS
- Proporciona números específicos, nombres reales y métricas exactas
- Ofreces insights basados en SUS datos reales, no información genérica

FLUJO DE IDENTIFICACIÓN:
- Si es repuestero existente: solicita CUIT para acceder a su cuenta
- Una vez identificado: "¡Hola [Nombre]! ¿En qué puedo ayudarte con tu negocio hoy?"
- Si es nuevo: explica qué es Boxer y cómo puede ayudarlo

CONTEXTO ACTUAL: """
    
    if state == "initial":
        return base_prompt + "Un repuestero acaba de iniciar conversación. Salúdalo calurosamente y pregúntale de manera natural si ya es usuario de Boxer o si es la primera vez que conoce el sistema. Sé amigable y directo."
    elif state == "clarify_client_type":
        return base_prompt + "El repuestero no ha especificado si es cliente existente o nuevo. Pregúntale de forma natural y amigable: '¿Ya eres usuario de Boxer o es la primera vez que nos conoces?' Mantén un tono conversacional y cercano."
    elif state == "existing_client":
        return base_prompt + "El repuestero indica que ya tiene cuenta. Pídele su CUIT para acceder a los datos de su negocio y poder ayudarlo específicamente."
    elif state == "new_client":
        return base_prompt + "Es un repuestero nuevo. Explícale qué es Boxer, cómo puede ayudarlo a gestionar su negocio de autopartes, y ofrécele asistencia para empezar."
    elif state == "awaiting_cuit":
        return base_prompt + """El repuestero está esperando el CUIT del repuestero. Si no lo proporciona, pídelo amablemente explicando que necesitas identificar su cuenta para acceder a sus datos comerciales."""
    elif state == "cuit_provided" or state == "client_identified":
        return base_prompt + """El repuestero está identificado y tienes acceso a sus datos comerciales. Puedes ayudarlo con:

• CONSULTAS ESPECÍFICAS: clientes, proveedores, stock, ventas
• ANÁLISIS Y MÉTRICAS: rendimiento, tendencias, oportunidades
• GESTIÓN: organización, planificación, control de deudas
• CONSEJOS DEL RUBRO: estacionalidad, marcas, compatibilidades
• CÁLCULOS: márgenes, precios, rentabilidad
• ESTRATEGIAS: crecimiento, optimización, resolución de problemas

Sé proactivo, analiza sus datos y ofrece insights valiosos. Habla como un consultor experto que conoce su negocio."""
    else:
        return base_prompt + "Conversación general con un repuestero. Ayúdalo con lo que necesite relacionado a su negocio de autopartes."


@router.get("/api/chatbot/conversations")
def list_chatbot_conversations(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """List recent conversations for the chatbot UI."""
    conversations = db.query(ChatConversation).order_by(
        ChatConversation.last_activity_at.desc()
    ).offset(offset).limit(limit).all()
    
    result = []
    for conv in conversations:
        # Get message count
        msg_count = db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).count()
        
        result.append({
            "id": conv.id,
            "title": conv.title,
            "started_at": conv.started_at.isoformat(),
            "last_activity_at": conv.last_activity_at.isoformat(),
            "message_count": msg_count,
            "client_cuit": conv.client_cuit[:3] + "***" + conv.client_cuit[-2:] if conv.client_cuit else None,
            "ip_address": _anonymize_text(conv.ip_address) if conv.ip_address else None
        })
    
    return result


@router.get("/api/chatbot/conversations/{conversation_id}")
def get_chatbot_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Get full conversation with messages."""
    conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.created_at).all()
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "started_at": conversation.started_at.isoformat(),
        "last_activity_at": conversation.last_activity_at.isoformat(),
        "client_cuit": conversation.client_cuit[:3] + "***" + conversation.client_cuit[-2:] if conversation.client_cuit else None,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }


@router.post("/api/chatbot/conversations/{conversation_id}/archive")
def archive_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Archive a conversation (mark as completed)."""
    conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Update title to indicate archived
    if not conversation.title.startswith("[ARCHIVADA]"):
        conversation.title = f"[ARCHIVADA] {conversation.title}"
    
    db.commit()
    
    return {"message": "Conversation archived successfully"}


# Keep the simple endpoint for basic testing
@router.post("/api/chatbot/simple")
def chatbot_simple(payload: dict):
    """
    Minimal endpoint to get a real OpenAI response while legacy chatbot is disabled.
    Expects: { "message": string, "messages": optional array of {role, content} }
    Returns: { "reply": string }
    """
    try:
        if openai is None:
            raise HTTPException(status_code=503, detail="OpenAI SDK not available")

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")

        openai.api_key = api_key

        # Build chat messages
        user_text = (payload or {}).get("message") or ""
        provided_messages = (payload or {}).get("messages") or []
        msgs = provided_messages if provided_messages else [
            {"role": "system", "content": "Sos un asistente útil del sistema POS Boxer. Responde de forma breve y clara en español."},
            {"role": "user", "content": user_text},
        ]

        # Call OpenAI ChatCompletion (compatible with openai==0.28.1)
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=msgs,
                temperature=0.2,
                max_tokens=256,
            )
            reply = response["choices"][0]["message"]["content"].strip()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")

        return {"reply": reply}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions for chatbot functionality
def _extract_cuit(text: str) -> str:
    """Extract CUIT from text message."""
    import re
    # Look for CUIT patterns: 11 digits, possibly with dashes
    patterns = [
        r'\b(\d{2}[-]?\d{8}[-]?\d{1})\b',  # XX-XXXXXXXX-X or XXXXXXXXXXX
        r'\b(\d{11})\b'  # 11 consecutive digits
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            cuit = re.sub(r'[-]', '', matches[0])  # Remove dashes
            if len(cuit) == 11 and cuit.isdigit():
                return cuit
    return None


def _get_client_ip(request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if hasattr(request, 'client') else "unknown"


def _anonymize_text(text: str) -> str:
    """Anonymize sensitive data in text."""
    if not text:
        return text
    
    import re
    # Anonymize CUIT (keep first 3 and last 2 digits)
    text = re.sub(r'\b(\d{2,3})(\d{5,6})(\d{2})\b', r'\1***\3', text)
    
    # Anonymize email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '***@***.***', text)
    
    # Anonymize phone numbers
    text = re.sub(r'\b\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b', '***-***-****', text)
    
    return text


# ============== CHATBOT SECTIONS & QUESTIONS API ==============

@router.get("/api/chatbot/sections")
def get_chatbot_sections(db: Session = Depends(get_db)):
    """Get all chatbot sections with their questions."""
    sections = db.query(ChatbotSection).order_by(ChatbotSection.name).all()
    result = []
    for section in sections:
        questions = db.query(ChatbotQuestion).filter(
            ChatbotQuestion.section_id == section.id,
            ChatbotQuestion.is_active == True
        ).order_by(ChatbotQuestion.order_index).all()
        
        result.append({
            "id": section.id,
            "name": section.name,
            "display_name": section.display_name,
            "description": section.description,
            "questions": [{
                "id": q.id,
                "question": q.question,
                "answer": q.answer,
                "observations": q.observations,
                "order_index": q.order_index
            } for q in questions]
        })
    return result


@router.post("/api/chatbot/sections/{section_name}/questions")
def create_question(section_name: str, question_data: dict, db: Session = Depends(get_db)):
    """Create a new question for a specific chatbot section."""
    section = db.query(ChatbotSection).filter(ChatbotSection.name == section_name).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Get the next order index
    max_order = db.query(ChatbotQuestion).filter(
        ChatbotQuestion.section_id == section.id
    ).count()
    
    question = ChatbotQuestion(
        section_id=section.id,
        question=question_data.get("question", ""),
        answer=question_data.get("answer", ""),
        observations=question_data.get("observations", ""),
        order_index=max_order + 1
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return {
        "id": question.id,
        "question": question.question,
        "answer": question.answer,
        "order_index": question.order_index
    }


@router.put("/api/chatbot/questions/{question_id}")
def update_question(question_id: int, question_data: dict, db: Session = Depends(get_db)):
    """Update an existing question."""
    question = db.query(ChatbotQuestion).filter(ChatbotQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if "question" in question_data:
        question.question = question_data["question"]
    if "answer" in question_data:
        question.answer = question_data["answer"]
    if "observations" in question_data:
        question.observations = question_data["observations"]
    
    db.commit()
    db.refresh(question)
    
    return {
        "id": question.id,
        "question": question.question,
        "answer": question.answer,
        "observations": question.observations,
        "order_index": question.order_index
    }


@router.delete("/api/chatbot/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    """Delete a question."""
    question = db.query(ChatbotQuestion).filter(ChatbotQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    
    return {"message": "Question deleted successfully"}


@router.post("/api/chatbot/sections/initialize")
def initialize_chatbot_sections(db: Session = Depends(get_db)):
    """Initialize default chatbot sections."""
    sections_data = [
        {"name": "ventas", "display_name": "Ventas", "description": "Gestión de ventas y facturación"},
        {"name": "cuentas", "display_name": "Cuentas", "description": "Gestión de cuentas corrientes y pagos"},
        {"name": "compras", "display_name": "Compras", "description": "Gestión de compras y proveedores"},
        {"name": "clientes", "display_name": "Clientes", "description": "Gestión de clientes y relaciones comerciales"},
        {"name": "proveedores", "display_name": "Proveedores", "description": "Gestión de proveedores y suministros"},
        {"name": "articulos", "display_name": "Artículos", "description": "Gestión de inventario y productos"},
        {"name": "mercadolibre", "display_name": "MercadoLibre", "description": "Integración con MercadoLibre"}
    ]
    
    created_sections = []
    for section_data in sections_data:
        existing = db.query(ChatbotSection).filter(ChatbotSection.name == section_data["name"]).first()
        if not existing:
            section = ChatbotSection(**section_data)
            db.add(section)
            created_sections.append(section_data["name"])
    
    db.commit()
    
    return {"message": f"Initialized {len(created_sections)} sections", "sections": created_sections}
