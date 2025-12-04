"""
Script para migrar la cuenta actual de Tienda Nube a la base de datos
"""

from tiendanube_accounts import TiendaNubeAccountManager
from tiendanube_config import TIENDANUBE_CONFIG, load_token

def migrate_current_account():
    """Migrar la cuenta actual al sistema de múltiples cuentas"""
    
    manager = TiendaNubeAccountManager()
    
    # Obtener datos actuales
    store_id = TIENDANUBE_CONFIG['store_id']
    token_data = load_token()
    
    if not token_data:
        print("[ERROR] No se encontro token de acceso")
        return False
    
    access_token = token_data.get('access_token')
    user_id = token_data.get('user_id')
    
    if not access_token:
        print("[ERROR] Token de acceso invalido")
        return False
    
    # Verificar si ya existe
    existing = manager.get_account_by_store_id(store_id)
    
    if existing:
        print(f"[INFO] La cuenta {store_id} ya existe en la base de datos")
        print(f"   Nombre: {existing.name}")
        print(f"   Activa: {existing.is_active}")
        
        # Actualizar token si es diferente
        if existing.access_token != access_token:
            manager.update_account(existing.id, access_token=access_token)
            print("[OK] Token actualizado")
        
        # Activar si no está activa
        if not existing.is_active:
            manager.set_active_account(existing.id)
            print("[OK] Cuenta activada")
        
        return True
    
    # Crear nueva cuenta
    try:
        account = manager.add_account(
            name=f"Tienda {store_id}",
            store_id=store_id,
            access_token=access_token,
            user_id=user_id
        )
        
        # Activarla
        manager.set_active_account(account.id)
        
        print(f"[OK] Cuenta migrada exitosamente:")
        print(f"   ID: {account.id}")
        print(f"   Store ID: {account.store_id}")
        print(f"   Nombre: {account.name}")
        print(f"   Activa: SI")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error al migrar cuenta: {str(e)}")
        return False

if __name__ == "__main__":
    print("[INICIO] Migrando cuenta actual de Tienda Nube...")
    print()
    migrate_current_account()
