#!/usr/bin/env python3
"""
Migration script to create chatbot sections and questions tables
"""

from sqlalchemy import create_engine
from database import DATABASE_URL, Base
from models import ChatbotSection, ChatbotQuestion

def migrate():
    """Create the new tables and initialize default sections"""
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")
    
    # Initialize default sections
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
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
        print(f"Initialized {len(created_sections)} sections: {', '.join(created_sections)}")
        
    except Exception as e:
        print(f"Error initializing sections: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
