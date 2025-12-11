"""
Rutas de la API para MercadoLibre.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from mercadolibre_service import mercadolibre_service
from mercadolibre_config import MERCADOLIBRE_CONFIG
from mercadolibre_accounts import MercadoLibreAccountManager

router = APIRouter(prefix='/api/mercadolibre', tags=['MercadoLibre'])
account_manager = MercadoLibreAccountManager()

@router.get('/status')
def get_status():
    """Obtiene el estado de la conexión con MercadoLibre"""
    try:
        status = mercadolibre_service.get_connection_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/verify-connection')
def verify_connection():
    """Verifica la conexión y renueva el token si es necesario"""
    try:
        result = mercadolibre_service.verify_and_refresh_connection()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/user')
def get_user_info():
    """Obtiene información del usuario de MercadoLibre"""
    try:
        user_info = mercadolibre_service.get_user_info()
        return {
            'success': True,
            'data': user_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/items')
def get_items(
    limit: Optional[int] = 50,
    offset: Optional[int] = 0,
    status: Optional[str] = 'active'
):
    """
    Obtiene las publicaciones del usuario
    Args:
        limit: Cantidad de items (max 50)
        offset: Offset para paginación
        status: Estado (active, paused, closed)
    """
    try:
        items = mercadolibre_service.get_items(limit=limit, offset=offset, status=status)
        return {
            'success': True,
            'data': items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/items-for-tiendanube')
def get_items_for_tiendanube(
    limit: Optional[int] = 50,
    offset: Optional[int] = 0,
    status: Optional[str] = 'active'
):
    """
    Obtiene las publicaciones de ML mapeadas al formato de Tienda Nube
    Args:
        limit: Cantidad de items (max 50)
        offset: Offset para paginación
        status: Estado (active, paused, closed)
    """
    try:
        mapped_data = mercadolibre_service.get_items_for_tiendanube(
            limit=limit, 
            offset=offset, 
            status=status
        )
        return {
            'success': True,
            'data': mapped_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/items/{item_id}')
def get_item(item_id: str):
    """Obtiene un item específico"""
    try:
        item = mercadolibre_service.get_item(item_id)
        return {
            'success': True,
            'data': item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/items/{item_id}/description')
def get_item_description(item_id: str):
    """Obtiene la descripción de un item"""
    try:
        description = mercadolibre_service.get_item_description(item_id)
        return {
            'success': True,
            'data': description
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/categories')
def get_categories():
    """Obtiene las categorías de MercadoLibre"""
    try:
        categories = mercadolibre_service.get_categories()
        return {
            'success': True,
            'data': categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/search')
def search_items(q: str, limit: Optional[int] = 50):
    """Busca items por query"""
    try:
        results = mercadolibre_service.search_items(query=q, limit=limit)
        return {
            'success': True,
            'data': results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/auth-url')
def get_auth_url():
    """Genera la URL de autorización para obtener un nuevo token"""
    try:
        client_id = MERCADOLIBRE_CONFIG['client_id']
        redirect_uri = MERCADOLIBRE_CONFIG['redirect_uri']
        
        auth_url = (
            f"https://auth.mercadolibre.com.ar/authorization?"
            f"response_type=code&"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}"
        )
        
        return {
            'success': True,
            'auth_url': auth_url,
            'instructions': [
                '1. Abre esta URL en tu navegador',
                '2. Autoriza la aplicación',
                '3. Copia el código de la URL de redirección',
                '4. Usa el endpoint /mercadolibre/exchange-code para obtener el token'
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== GESTIÓN DE CUENTAS ====================

@router.get('/accounts')
def get_accounts():
    """Obtener todas las cuentas de MercadoLibre"""
    try:
        accounts = account_manager.get_all_accounts()
        return {
            'success': True,
            'accounts': [
                {
                    'id': acc.id,
                    'name': acc.name,
                    'user_id': acc.user_id,
                    'is_active': acc.is_active,
                    'created_at': acc.created_at.isoformat() if acc.created_at else None
                }
                for acc in accounts
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/accounts')
def add_account(data: dict):
    """Agregar una nueva cuenta de MercadoLibre"""
    try:
        account = account_manager.add_account(
            name=data.get('name'),
            user_id=data.get('user_id'),
            access_token=data.get('access_token'),
            refresh_token=data.get('refresh_token'),
            expires_at=data.get('expires_at')
        )
        
        return {
            'success': True,
            'message': 'Cuenta agregada exitosamente',
            'account': {
                'id': account.id,
                'name': account.name,
                'user_id': account.user_id,
                'is_active': account.is_active
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/accounts/{account_id}/activate')
def activate_account(account_id: int):
    """Activar una cuenta específica"""
    try:
        account = account_manager.set_active_account(account_id)
        
        if not account:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        
        return {
            'success': True,
            'message': 'Cuenta activada',
            'account': {
                'id': account.id,
                'name': account.name,
                'user_id': account.user_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/accounts/{account_id}')
def delete_account(account_id: int):
    """Eliminar una cuenta"""
    try:
        success = account_manager.delete_account(account_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada o está activa")
        
        return {
            'success': True,
            'message': 'Cuenta eliminada exitosamente'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/accounts/active')
def get_active_account():
    """Obtener la cuenta activa actual"""
    try:
        account = account_manager.get_active_account()
        
        if not account:
            raise HTTPException(status_code=404, detail="No hay cuenta activa")
        
        return {
            'success': True,
            'account': {
                'id': account.id,
                'name': account.name,
                'user_id': account.user_id,
                'is_active': account.is_active,
                'created_at': account.created_at.isoformat() if account.created_at else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/accounts/{account_id}')
def update_account_name(account_id: int, data: dict):
    """Actualizar nombre de cuenta"""
    try:
        account = account_manager.update_account(account_id, name=data.get('name'))
        
        if not account:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        
        return {
            'success': True,
            'message': 'Cuenta actualizada',
            'account': {
                'id': account.id,
                'name': account.name,
                'user_id': account.user_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
