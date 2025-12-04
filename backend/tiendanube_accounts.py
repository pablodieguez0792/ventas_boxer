"""
Gestión de múltiples cuentas de Tienda Nube
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

Base = declarative_base()

class TiendaNubeAccount(Base):
    __tablename__ = 'tiendanube_accounts'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # Nombre descriptivo de la cuenta
    store_id = Column(String(50), nullable=False, unique=True)
    access_token = Column(String(500), nullable=False)
    user_id = Column(String(50))
    is_active = Column(Boolean, default=False)  # Cuenta activa actualmente
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Crear engine y sesión
engine = create_engine('sqlite:///tiendanube_accounts.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

class TiendaNubeAccountManager:
    """Gestor de cuentas de Tienda Nube"""
    
    def __init__(self):
        self.session = Session()
    
    def add_account(self, name, store_id, access_token, user_id=None):
        """Agregar una nueva cuenta"""
        account = TiendaNubeAccount(
            name=name,
            store_id=store_id,
            access_token=access_token,
            user_id=user_id
        )
        self.session.add(account)
        self.session.commit()
        return account
    
    def get_all_accounts(self):
        """Obtener todas las cuentas"""
        return self.session.query(TiendaNubeAccount).all()
    
    def get_active_account(self):
        """Obtener la cuenta activa"""
        return self.session.query(TiendaNubeAccount).filter_by(is_active=True).first()
    
    def set_active_account(self, account_id):
        """Establecer una cuenta como activa"""
        # Desactivar todas las cuentas
        self.session.query(TiendaNubeAccount).update({TiendaNubeAccount.is_active: False})
        
        # Activar la cuenta seleccionada
        account = self.session.query(TiendaNubeAccount).filter_by(id=account_id).first()
        if account:
            account.is_active = True
            self.session.commit()
            return account
        return None
    
    def update_account(self, account_id, **kwargs):
        """Actualizar una cuenta"""
        account = self.session.query(TiendaNubeAccount).filter_by(id=account_id).first()
        if account:
            for key, value in kwargs.items():
                if hasattr(account, key):
                    setattr(account, key, value)
            account.updated_at = datetime.utcnow()
            self.session.commit()
            return account
        return None
    
    def delete_account(self, account_id):
        """Eliminar una cuenta"""
        account = self.session.query(TiendaNubeAccount).filter_by(id=account_id).first()
        if account:
            self.session.delete(account)
            self.session.commit()
            return True
        return False
    
    def get_account_by_store_id(self, store_id):
        """Obtener cuenta por store_id"""
        return self.session.query(TiendaNubeAccount).filter_by(store_id=store_id).first()
