"""
Script para crear las tablas de órdenes RSF en la base de datos
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from models import Base, RSFOrder, RSFOrderItem
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_rsf_orders_tables():
    """Crear las tablas de órdenes RSF"""
    try:
        # Conectar a la base de datos
        engine = create_engine('sqlite:///publicaciones.db')
        
        # Crear las tablas
        RSFOrder.__table__.create(engine, checkfirst=True)
        RSFOrderItem.__table__.create(engine, checkfirst=True)
        
        logger.info("✅ Tablas de órdenes RSF creadas exitosamente")
        
        # Verificar que las tablas se crearon
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'rsf_%'"))
            tables = result.fetchall()
            logger.info(f"📋 Tablas RSF encontradas: {[table[0] for table in tables]}")
            
    except Exception as e:
        logger.error(f"❌ Error creando tablas RSF: {e}")
        raise

if __name__ == "__main__":
    create_rsf_orders_tables()
