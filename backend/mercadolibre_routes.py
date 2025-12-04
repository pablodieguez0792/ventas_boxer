"""
Rutas de la API para MercadoLibre.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from mercadolibre_service import mercadolibre_service
from mercadolibre_config import MERCADOLIBRE_CONFIG

router = APIRouter(prefix='/api/mercadolibre', tags=['MercadoLibre'])

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
