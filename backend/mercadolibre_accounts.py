"""
Sistema de gestión de múltiples cuentas de MercadoLibre
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class MercadoLibreAccount(Base):
    """Modelo para cuentas de MercadoLibre"""
    __tablename__ = 'mercadolibre_accounts'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)  # Nombre descriptivo
    user_id = Column(String(50), nullable=False, unique=True)  # User ID de ML
    access_token = Column(String(500), nullable=False)
    refresh_token = Column(String(500))
    expires_at = Column(Integer)  # Timestamp de expiración
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class MercadoLibreAccountManager:
    """Gestor de cuentas de MercadoLibre"""
    
    def __init__(self, db_path='mercadolibre_accounts.db'):
        """Inicializar el gestor con la base de datos"""
        self.db_path = os.path.join(os.path.dirname(__file__), db_path)
        self.engine = create_engine(f'sqlite:///{self.db_path}')
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def add_account(self, name, user_id, access_token, refresh_token=None, expires_at=None):
        """Agregar una nueva cuenta"""
        try:
            # Verificar si ya existe
            existing = self.session.query(MercadoLibreAccount).filter_by(user_id=user_id).first()
            if existing:
                # Actualizar token
                existing.access_token = access_token
                existing.refresh_token = refresh_token
                existing.expires_at = expires_at
                existing.updated_at = datetime.now()
                self.session.commit()
                return existing
            
            # Crear nueva cuenta
            account = MercadoLibreAccount(
                name=name,
                user_id=user_id,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=expires_at
            )
            self.session.add(account)
            self.session.commit()
            return account
        except Exception as e:
            self.session.rollback()
            raise e
    
    def get_all_accounts(self):
        """Obtener todas las cuentas"""
        return self.session.query(MercadoLibreAccount).all()
    
    def get_active_account(self):
        """Obtener la cuenta activa"""
        return self.session.query(MercadoLibreAccount).filter_by(is_active=True).first()
    
    def get_account_by_id(self, account_id):
        """Obtener cuenta por ID"""
        return self.session.query(MercadoLibreAccount).filter_by(id=account_id).first()
    
    def get_account_by_user_id(self, user_id):
        """Obtener cuenta por User ID de ML"""
        return self.session.query(MercadoLibreAccount).filter_by(user_id=str(user_id)).first()
    
    def set_active_account(self, account_id):
        """Establecer una cuenta como activa"""
        try:
            # Desactivar todas
            self.session.query(MercadoLibreAccount).update({'is_active': False})
            
            # Activar la seleccionada
            account = self.get_account_by_id(account_id)
            if account:
                account.is_active = True
                self.session.commit()
                return account
            return None
        except Exception as e:
            self.session.rollback()
            raise e
    
    def update_account(self, account_id, **kwargs):
        """Actualizar una cuenta"""
        try:
            account = self.get_account_by_id(account_id)
            if account:
                for key, value in kwargs.items():
                    if hasattr(account, key):
                        setattr(account, key, value)
                account.updated_at = datetime.now()
                self.session.commit()
                return account
            return None
        except Exception as e:
            self.session.rollback()
            raise e
    
    def delete_account(self, account_id):
        """Eliminar una cuenta"""
        try:
            account = self.get_account_by_id(account_id)
            if account and not account.is_active:
                self.session.delete(account)
                self.session.commit()
                return True
            return False
        except Exception as e:
            self.session.rollback()
            raise e
    
    def __del__(self):
        """Cerrar sesión al destruir el objeto"""
        if hasattr(self, 'session'):
            self.session.close()
