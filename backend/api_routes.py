from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import (
    Sale,
    SaleItem,
    Quote,
    QuoteItem,
    Customer,
    ChatConversation,
    ChatMessage,
    TestUsuario,
    TestCliente,
    TestProveedor,
    TestArticulo,
)
from schemas import SaleCreate, QuoteCreate
from datetime import datetime, timedelta
import json
import os
import random

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
    """Delete conversations older than 15 days (and their messages)."""
    try:
        cutoff = datetime.utcnow() - timedelta(days=15)
        old = db.query(ChatConversation).filter(ChatConversation.last_activity_at < cutoff).all()
        count = len(old)
        for c in old:
            db.delete(c)
        db.commit()
        return {"deleted": count}
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
    try:
        q = db.query(ChatConversation)
        if not from_date and not to_date:
            cutoff = datetime.utcnow() - timedelta(days=15)
            q = q.filter(ChatConversation.started_at >= cutoff)
        q = q.order_by(ChatConversation.last_activity_at.desc()).offset(offset).limit(limit)
        convs = q.all()
        return [
            {
                "id": c.id,
                "title": c.title,
                "started_at": c.started_at.isoformat(),
                "last_activity_at": c.last_activity_at.isoformat() if c.last_activity_at else None,
            } for c in convs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/conversations/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    try:
        c = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Conversation not found")
        msgs = db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).order_by(ChatMessage.created_at.asc()).all()
        return {
            "id": c.id,
            "title": c.title,
            "started_at": c.started_at.isoformat(),
            "last_activity_at": c.last_activity_at.isoformat() if c.last_activity_at else None,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat(),
                    "meta_json": m.meta_json,
                } for m in msgs
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/chat")
def chat(payload: dict, db: Session = Depends(get_db)):
    try:
        message = payload.get("message", "").strip()
        conversation_id = payload.get("conversationId")
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        if conversation_id:
            conv = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            conv = ChatConversation(title="Conversación")
            db.add(conv)
            db.flush()

        user_msg = ChatMessage(
            conversation_id=conv.id,
            role="user",
            content=_anonymize_text(message),
            meta_json=json.dumps({"anonymized": True})
        )
        db.add(user_msg)

        lower = message.lower()
        intent = "general"
        if any(k in lower for k in ["cliente", "deuda", "cuenta corriente"]):
            intent = "clientes"
        elif any(k in lower for k in ["articulo", "artículo", "stock", "ventas", "marca"]):
            intent = "articulos"
        elif any(k in lower for k in ["proveedor", "factura", "impaga", "deuda proveedor"]):
            intent = "proveedores"
        elif any(k in lower for k in ["usuario", "usuarios"]):
            intent = "usuarios"
        elif any(k in lower for k in ["top", "más vendidos", "mas vendidos", "metricas", "métricas"]):
            intent = "metricas"

        context_chunks = []
        suggestions = []
        if intent == "clientes":
            import re
            m = re.search(r"(\d{7,})", message)
            if m:
                cuit = m.group(1)
                cli = db.query(TestCliente).filter(TestCliente.cuit.like(f"%{cuit[-6:]}%")) .first()
                if cli:
                    context_chunks.append({"cliente": {"cuit": _anonymize_text(cli.cuit), "nombre": cli.nombre, "direccion": cli.direccion, "deuda_cc": cli.deuda_cc}})
                    suggestions.append({"label": "Ver deuda del cliente", "action": "mostrar_deuda_cliente"})
        elif intent == "articulos":
            arts = db.query(TestArticulo).order_by(TestArticulo.ventas_30d.desc()).limit(10).all()
            context_chunks.append({"top_articulos": [
                {"codigo": a.codigo, "descripcion": a.descripcion, "marca": a.marca, "stock": a.stock, "ventas_30d": a.ventas_30d}
                for a in arts
            ]})
            suggestions.append({"label": "Top 10 más vendidos", "action": "listar_top_vendidos"})
        elif intent == "proveedores":
            provs = db.query(TestProveedor).order_by(TestProveedor.deuda_cc.desc()).limit(5).all()
            context_chunks.append({"proveedores_deuda": [
                {"nombre": p.nombre, "cuit": _anonymize_text(p.cuit), "deuda_cc": p.deuda_cc, "ultima_factura_impaga": p.ultima_factura_impaga}
                for p in provs
            ]})
            suggestions.append({"label": "Proveedores con mayor deuda", "action": "listar_proveedores_deuda"})
        elif intent == "usuarios":
            usrs = db.query(TestUsuario).limit(5).all()
            context_chunks.append({"usuarios": [
                {"nombre": u.nombre, "cuit": _anonymize_text(u.cuit), "direccion": u.direccion}
                for u in usrs
            ]})
        elif intent == "metricas":
            top = db.query(TestArticulo).order_by(TestArticulo.ventas_30d.desc()).limit(5).all()
            stock = db.query(TestArticulo).order_by(TestArticulo.stock.desc()).limit(5).all()
            context_chunks.append({
                "metricas": {
                    "top_vendidos": [
                        {"codigo": a.codigo, "descripcion": a.descripcion, "ventas_30d": a.ventas_30d}
                        for a in top
                    ],
                    "mayor_stock": [
                        {"codigo": a.codigo, "descripcion": a.descripcion, "stock": a.stock}
                        for a in stock
                    ]
                }
            })
            suggestions.extend([
                {"label": "Ver top vendidos", "action": "listar_top_vendidos"},
                {"label": "Ver mayor stock", "action": "listar_mayor_stock"},
            ])

        system_prompt = (
            "Eres 'Asistente CRM', ayudas en Español. Responde brevemente con datos tabulares cuando corresponda. "
            "No ejecutes acciones, solo sugiere. Anonimiza CUIT y datos sensibles."
        )

        reply_text = None
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and openai is not None:
            try:
                openai.api_key = api_key
                context_json = json.dumps(context_chunks, ensure_ascii=False)
                completion = openai.ChatCompletion.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Pregunta: {message}\nContexto JSON: {context_json}"},
                    ],
                    temperature=0.2,
                )
                reply_text = completion.choices[0].message["content"].strip()
            except Exception:
                reply_text = (
                    "No pude contactar el servicio de IA. Te doy una respuesta basada en los datos locales. "
                    "Podés configurar OPENAI_API_KEY en el backend."
                )
        if not reply_text:
            reply_text = "Aquí tienes información relevante basada en los datos disponibles." + (
                " " + json.dumps(context_chunks, ensure_ascii=False) if context_chunks else " (no se encontraron datos relevantes)"
            )

        asst_msg = ChatMessage(
            conversation_id=conv.id,
            role="assistant",
            content=_anonymize_text(reply_text),
            meta_json=json.dumps({"suggestions": suggestions, "anonymized": True})
        )
        db.add(asst_msg)
        conv.last_activity_at = datetime.utcnow()
        db.commit()

        return {
            "conversationId": conv.id,
            "reply": asst_msg.content,
            "suggestions": suggestions,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
