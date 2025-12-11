"""
Script para migrar la cuenta actual de MercadoLibre a la base de datos
"""

from mercadolibre_accounts import MercadoLibreAccountManager
from mercadolibre_config import MERCADOLIBRE_CONFIG, load_token

def migrate_current_account():
    """Migrar la cuenta actual al sistema de múltiples cuentas"""
    
    manager = MercadoLibreAccountManager()
    
    # Obtener datos actuales
    user_id = str(MERCADOLIBRE_CONFIG['user_id'])
    token_data = load_token()
    
    if not token_data:
        print("[ERROR] No se encontro token de acceso")
        return False
    
    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')
    expires_at = token_data.get('expires_at')
    
    if not access_token:
        print("[ERROR] Token de acceso invalido")
        return False
    
    # Verificar si ya existe
    existing = manager.get_account_by_user_id(user_id)
    
    if existing:
        print(f"[INFO] La cuenta {user_id} ya existe en la base de datos")
        print(f"   Nombre: {existing.name}")
        print(f"   Activa: {existing.is_active}")
        
        # Actualizar token si es diferente
        if existing.access_token != access_token:
            manager.update_account(
                existing.id, 
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=expires_at
            )
            print("[OK] Token actualizado")
        
        # Activar si no está activa
        if not existing.is_active:
            manager.set_active_account(existing.id)
            print("[OK] Cuenta activada")
        
        return True
    
    # Crear nueva cuenta
    try:
        account = manager.add_account(
            name=f"MercadoLibre {user_id}",
            user_id=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at
        )
        
        # Activarla
        manager.set_active_account(account.id)
        
        print(f"[OK] Cuenta migrada exitosamente:")
        print(f"   ID: {account.id}")
        print(f"   User ID: {account.user_id}")
        print(f"   Nombre: {account.name}")
        print(f"   Activa: SI")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error al migrar cuenta: {str(e)}")
        return False

if __name__ == "__main__":
    print("[INICIO] Migrando cuenta actual de MercadoLibre...")
    print()
    migrate_current_account()
