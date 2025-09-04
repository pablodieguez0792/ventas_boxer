from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import uvicorn
from datetime import datetime
from database import SessionLocal, engine, Base
from models import Base as ModelsBase
from models import Product, Sale, Customer, SaleItem, Quote, Return, ReturnItem, ExchangeItem
from schemas import ProductResponse, ProductSearch, SaleCreate, CustomerCreate
from fuzzywuzzy import fuzz, process
from api_routes import router as api_router
import os
from dotenv import load_dotenv
from datetime import timedelta
from models import ChatConversation
from models import TestProveedor, TestCliente, TestArticulo, TestUsuario

# Load environment variables from .env if present
load_dotenv()

# Create database tables (ensure both Base definitions are covered)
Base.metadata.create_all(bind=engine)
try:
    ModelsBase.metadata.create_all(bind=engine)
except Exception:
    # In case models.Base differs; ignore silently in production
    pass

app = FastAPI(title="POS Autopartes API", version="1.0.0")

@app.on_event("startup")
def cleanup_old_conversations_on_startup():
    """Delete chat conversations older than 15 days at startup."""
    try:
        db = SessionLocal()
        cutoff = datetime.utcnow() - timedelta(days=15)
        old = db.query(ChatConversation).filter(ChatConversation.last_activity_at < cutoff).all()
        for c in old:
            db.delete(c)
        db.commit()
    except Exception:
        # Do not fail app startup for cleanup errors
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass

@app.on_event("startup")
def seed_chatbot_mock_if_empty():
    """Populate mock tables for the chatbot if they are empty."""
    try:
        db = SessionLocal()
        needs_seed = False
        counts = {}
        for model, key in [
            (TestProveedor, "proveedores"),
            (TestCliente, "clientes"),
            (TestArticulo, "articulos"),
            (TestUsuario, "usuarios"),
        ]:
            c = db.query(model).count()
            counts[key] = c
            if c == 0:
                needs_seed = True

        if not needs_seed:
            print(f"[CHATBOT] Seed skipped. Existing counts: {counts}")
            return

        print("[CHATBOT] Seeding mock data for chatbot...")

        # Simple sample data
        for i in range(1, 6):
            db.add(TestProveedor(nombre=f"Proveedor {i}", cuit=f"30-1234567{i}-9", email=f"prov{i}@mail.com"))

        for i in range(1, 11):
            db.add(TestCliente(nombre=f"Cliente {i}", cuit=f"20-9876543{i}-1", email=f"cli{i}@mail.com", deuda=i*1000))

        for i in range(1, 16):
            db.add(TestArticulo(nombre=f"Articulo {i}", codigo=f"A{i:03}", marca="Generic", ventas=i*3, stock=100-i))

        for i in range(1, 4):
            db.add(TestUsuario(nombre=f"Usuario {i}", email=f"user{i}@crm.local"))

        db.commit()
        print("[CHATBOT] Mock data seeded successfully.")
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        print(f"[CHATBOT] Seed error: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://127.0.0.1:52231", # Browser preview
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for product images
if not os.path.exists("static/images"):
    os.makedirs("static/images")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API routes
app.include_router(api_router)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "POS Autopartes API is running"}

@app.post("/api/test-simple")
def test_simple(data: dict):
    """Simple test endpoint without database"""
    print(f"[DEBUG] Received data: {data}")
    return {
        "status": "success",
        "message": "Simple test endpoint working",
        "received_data": data
    }

@app.get("/api/products/search")
def search_products(q: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Fuzzy search for products by name, code, brand, or vehicle application
    """
    if not q or len(q.strip()) < 2:
        return []
    
    # Get all products
    products = db.query(Product).all()
    
    # Create searchable strings for each product
    product_strings = []
    for product in products:
        search_string = f"{product.name} {product.brand} {product.internal_code} {product.original_code} {product.supplier_code} {product.vehicle_application or ''}"
        product_strings.append((search_string, product))
    
    # Perform fuzzy search
    search_terms = [item[0] for item in product_strings]
    matches = process.extract(q, search_terms, limit=limit, scorer=fuzz.partial_ratio)
    
    # Filter matches with score > 60
    filtered_matches = [match for match in matches if match[1] > 60]
    
    # Get corresponding products
    result_products = []
    for match in filtered_matches:
        for search_string, product in product_strings:
            if search_string == match[0]:
                result_products.append({
                    "id": product.id,
                    "name": product.name,
                    "brand": product.brand,
                    "internal_code": product.internal_code,
                    "original_code": product.original_code,
                    "supplier_code": product.supplier_code,
                    "price": float(product.price),
                    "stock": product.stock,
                    "location": product.location,
                    "image_url": f"/static/images/{product.image_filename}" if product.image_filename else None,
                    "vehicle_application": product.vehicle_application,
                    "description": product.description,
                    "match_score": match[1]
                })
                break
    
    return sorted(result_products, key=lambda x: x["match_score"], reverse=True)

@app.get("/api/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get detailed product information"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "internal_code": product.internal_code,
        "original_code": product.original_code,
        "supplier_code": product.supplier_code,
        "price": float(product.price),
        "stock": product.stock,
        "location": product.location,
        "image_url": f"/static/images/{product.image_filename}" if product.image_filename else None,
        "vehicle_application": product.vehicle_application,
        "description": product.description,
        "notes": product.notes
    }

@app.get("/api/customers/search")
def search_customers(q: str, db: Session = Depends(get_db)):
    """Search customers by name or document"""
    customers = db.query(Customer).filter(
        (Customer.name.contains(q)) | 
        (Customer.document.contains(q))
    ).limit(10).all()
    
    return [{"id": c.id, "name": c.name, "document": c.document, "email": c.email} for c in customers]

@app.post("/api/customers")
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create new customer"""
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/api/sales/pending")
def get_pending_sales(db: Session = Depends(get_db)):
    """Get sales sent to Caja (pending invoicing)"""
    sales = db.query(Sale).filter(Sale.status == "pending_invoice").all()
    result = []
    for sale in sales:
        result.append({
            "id": sale.id,
            "reference": sale.reference,
            "seller": sale.seller,
            "total": float(sale.total),
            "created_at": sale.created_at.isoformat(),
            "customer_name": sale.customer.name if sale.customer else "Cliente Genérico"
        })
    return result

@app.post("/api/test-db")
def test_database(db: Session = Depends(get_db)):
    """Test database connectivity and basic operations"""
    try:
        # Test basic query
        products = db.query(Product).limit(1).all()
        customers = db.query(Customer).limit(1).all()
        
        return {
            "status": "success",
            "message": "Database connection working",
            "products_count": len(products),
            "customers_count": len(customers)
        }
    except Exception as e:
        print(f"[ERROR] Database test failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/sales/send-to-caja")
def send_sale_to_caja(sale_data: dict, db: Session = Depends(get_db)):
    """Send sale to caja (pending invoice)"""
    print(f"[DEBUG] Received sale data: {sale_data}")
    
    try:
        # Extract cart items and totals
        cart_items = sale_data.get('cartItems', [])
        if not cart_items:
            raise HTTPException(status_code=400, detail="No cart items provided")
        
        # Get totals from frontend (already calculated)
        subtotal = float(sale_data.get('subtotal', 0))
        discount_amount = float(sale_data.get('discountAmount', 0))
        tax_amount = float(sale_data.get('taxAmount', 0))
        total = float(sale_data.get('total', 0))
        
        # Create sale record
        sale = Sale(
            customer_id=None,  # Will be set if customer is selected
            reference=f"CAJA-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            seller=sale_data.get('clientName', 'Cliente no especificado'),  # Cliente
            actual_seller="ADMIN",  # Vendedor real por defecto
            subtotal=subtotal,
            discount_amount=discount_amount,
            discount_percentage=0.0,
            tax_amount=tax_amount,
            total=total,
            status="pending_invoice",
            comments=sale_data.get('note', '')
        )
        
        print(f"[DEBUG] Creating sale with total: {total}")
        db.add(sale)
        db.flush()  # Get the sale ID
        
        # Create sale items
        for item in cart_items:
            quantity = float(item.get('quantity', 1))
            price = float(item.get('price', 0))
            item_subtotal = quantity * price
            
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=item.get('id'),
                quantity=quantity,
                unit_price=price,
                subtotal=item_subtotal
            )
            db.add(sale_item)
            print(f"[DEBUG] Added item: {item.get('name', 'Unknown')} x{quantity}")
        
        db.commit()
        print(f"[DEBUG] Sale saved successfully with ID: {sale.id}")
        
        return {
            "message": "Sale sent to caja successfully",
            "sale_id": sale.id,
            "reference": sale.reference,
            "total": total
        }
        
    except Exception as e:
        print(f"[ERROR] Error saving sale: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        
        try:
            db.rollback()
        except Exception as rollback_error:
            print(f"[ERROR] Rollback failed: {str(rollback_error)}")
            
        raise HTTPException(status_code=500, detail=f"Error saving sale: {str(e)}")

@app.get("/api/quotes")
def get_quotes(db: Session = Depends(get_db)):
    """Get all saved quotes"""
    try:
        quotes = db.query(Quote).order_by(Quote.created_at.desc()).all()
        
        return [{
            "id": quote.id,
            "customer_name": quote.customer_name,
            "customer_email": quote.customer_email,
            "customer_phone": quote.customer_phone,
            "vehicle_info": quote.vehicle_info,
            "total": quote.total,
            "status": quote.status,
            "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
            "notes": quote.notes,
            "created_at": quote.created_at.isoformat()
        } for quote in quotes]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/returns")
def create_return(return_data: dict, db: Session = Depends(get_db)):
    """Create a new return/exchange"""
    try:
        # Create return record
        new_return = Return(
            original_sale_id=return_data.get("original_sale_id"),
            customer_id=return_data.get("customer_id"),
            customer_name=return_data.get("customer_name", "Cliente no especificado"),
            return_type=return_data.get("return_type", "refund"),
            notes=return_data.get("notes", ""),
            processed_by=return_data.get("processed_by", "ADMIN")
        )
        
        db.add(new_return)
        db.flush()  # Get the ID
        
        total_refund = 0
        total_exchange = 0
        
        # Add return items (products being returned)
        for item in return_data.get("return_items", []):
            return_item = ReturnItem(
                return_id=new_return.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                subtotal=item["subtotal"],
                reason=item.get("reason", "")
            )
            db.add(return_item)
            total_refund += item["subtotal"]
            
            # Update product stock (return to inventory)
            product = db.query(Product).filter(Product.id == item["product_id"]).first()
            if product:
                product.stock += item["quantity"]
        
        # Add exchange items (new products being given)
        for item in return_data.get("exchange_items", []):
            exchange_item = ExchangeItem(
                return_id=new_return.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                subtotal=item["subtotal"]
            )
            db.add(exchange_item)
            total_exchange += item["subtotal"]
            
            # Update product stock (remove from inventory)
            product = db.query(Product).filter(Product.id == item["product_id"]).first()
            if product:
                product.stock -= item["quantity"]
        
        # Calculate totals and difference
        new_return.total_refund = total_refund
        new_return.total_exchange = total_exchange
        new_return.difference = total_exchange - total_refund  # + customer pays, - customer receives
        new_return.subtotal = total_refund
        
        db.commit()
        
        return {
            "id": new_return.id,
            "message": "Devolución creada exitosamente",
            "total_refund": total_refund,
            "total_exchange": total_exchange,
            "difference": new_return.difference
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating return: {str(e)}")

@app.get("/returns")
def get_returns(db: Session = Depends(get_db)):
    """Get all returns/exchanges"""
    try:
        returns = db.query(Return).order_by(Return.created_at.desc()).all()
        
        result = []
        for ret in returns:
            return_items = []
            for item in ret.return_items:
                return_items.append({
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else "Producto eliminado",
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "subtotal": item.subtotal,
                    "reason": item.reason
                })
            
            exchange_items = []
            for item in ret.exchange_items:
                exchange_items.append({
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else "Producto eliminado",
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "subtotal": item.subtotal
                })
            
            result.append({
                "id": ret.id,
                "original_sale_id": ret.original_sale_id,
                "customer_name": ret.customer_name,
                "return_type": ret.return_type,
                "total_refund": ret.total_refund,
                "total_exchange": ret.total_exchange,
                "difference": ret.difference,
                "status": ret.status,
                "notes": ret.notes,
                "processed_by": ret.processed_by,
                "created_at": ret.created_at.isoformat(),
                "return_items": return_items,
                "exchange_items": exchange_items
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales/{sale_id}/items")
def get_sale_items(sale_id: int, db: Session = Depends(get_db)):
    """Get items from a specific sale for returns"""
    try:
        sale = db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        items = []
        for item in sale.sale_items:
            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Producto eliminado",
                "product_code": item.product.internal_code if item.product else "",
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal
            })
        
        return {
            "sale_id": sale.id,
            "customer_name": sale.seller,
            "total": sale.total,
            "items": items
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
