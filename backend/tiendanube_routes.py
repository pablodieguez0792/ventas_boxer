"""
Rutas de la API para Tienda Nube.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from tiendanube_service import tiendanube_service

router = APIRouter(prefix='/api/tiendanube', tags=['tiendanube'])

# Modelos Pydantic
class CallbackData(BaseModel):
    code: str

class ProductData(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: Optional[int] = 0
    categories: Optional[list] = []
    images: Optional[list] = []

class StockUpdate(BaseModel):
    stock: int

class WebhookData(BaseModel):
    url: str
    event: str

@router.get('/status')
def get_status():
    """Obtiene el estado de la conexión con Tienda Nube"""
    try:
        status = tiendanube_service.get_connection_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/auth-url')
def get_auth_url():
    """Obtiene la URL de autenticación"""
    try:
        auth_url = tiendanube_service.get_auth_url()
        return {
            'success': True,
            'auth_url': auth_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/callback')
def handle_callback(data: CallbackData):
    """Maneja el callback de autenticación"""
    try:
        if not data.code:
            raise HTTPException(status_code=400, detail='Código de autorización no proporcionado')
        
        result = tiendanube_service.exchange_code_for_token(data.code)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/store')
def get_store_info():
    """Obtiene información de la tienda"""
    try:
        store_info = tiendanube_service.get_store_info()
        return {
            'success': True,
            'data': store_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/products')
def list_products(page: Optional[int] = None, per_page: Optional[int] = None, q: Optional[str] = None):
    """Lista los productos de la tienda"""
    try:
        params = {}
        if page:
            params['page'] = page
        if per_page:
            params['per_page'] = per_page
        if q:
            params['q'] = q
        
        products = tiendanube_service.list_products(params if params else None)
        return {
            'success': True,
            'data': products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/products/{product_id}')
def get_product(product_id: int):
    """Obtiene un producto específico"""
    try:
        product = tiendanube_service.get_product(product_id)
        return {
            'success': True,
            'data': product
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/products')
def create_product(product_data: Dict[str, Any]):
    """Crea un nuevo producto"""
    try:
        product = tiendanube_service.create_product(product_data)
        return {
            'success': True,
            'data': product
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/products/{product_id}')
def update_product(product_id: int, product_data: Dict[str, Any]):
    """Actualiza un producto existente"""
    try:
        product = tiendanube_service.update_product(product_id, product_data)
        return {
            'success': True,
            'data': product
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/products/{product_id}')
def delete_product(product_id: int):
    """Elimina un producto"""
    try:
        tiendanube_service.delete_product(product_id)
        return {
            'success': True,
            'message': 'Producto eliminado exitosamente'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/products/{product_id}/variants/{variant_id}/stock')
def update_stock(product_id: int, variant_id: int, data: StockUpdate):
    """Actualiza el stock de una variante"""
    try:
        variant = tiendanube_service.update_stock(product_id, variant_id, data.stock)
        return {
            'success': True,
            'data': variant
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/products/{product_id}/variants/{variant_id}')
def update_variant(product_id: int, variant_id: int, variant_data: Dict[str, Any]):
    """Actualiza una variante completa (precio, stock, etc.)"""
    try:
        variant = tiendanube_service.update_variant(product_id, variant_id, variant_data)
        return {
            'success': True,
            'data': variant
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/orders')
def list_orders(page: Optional[int] = None, per_page: Optional[int] = None, status: Optional[str] = None):
    """Lista las órdenes de la tienda"""
    try:
        params = {}
        if page:
            params['page'] = page
        if per_page:
            params['per_page'] = per_page
        if status:
            params['status'] = status
        
        orders = tiendanube_service.list_orders(params if params else None)
        return {
            'success': True,
            'data': orders
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/orders/{order_id}')
def get_order(order_id: int):
    """Obtiene una orden específica"""
    try:
        order = tiendanube_service.get_order(order_id)
        return {
            'success': True,
            'data': order
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/categories')
def list_categories(page: Optional[int] = None, per_page: Optional[int] = None):
    """Lista las categorías de productos"""
    try:
        params = {}
        if page:
            params['page'] = page
        if per_page:
            params['per_page'] = per_page
        
        categories = tiendanube_service.list_categories(params if params else None)
        return {
            'success': True,
            'data': categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/customers')
def list_customers(page: Optional[int] = None, per_page: Optional[int] = None):
    """Lista los clientes de la tienda"""
    try:
        params = {}
        if page:
            params['page'] = page
        if per_page:
            params['per_page'] = per_page
        
        customers = tiendanube_service.list_customers(params if params else None)
        return {
            'success': True,
            'data': customers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/webhooks')
def list_webhooks():
    """Lista los webhooks configurados"""
    try:
        webhooks = tiendanube_service.list_webhooks()
        return {
            'success': True,
            'data': webhooks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/webhooks')
def create_webhook(webhook_data: Dict[str, Any]):
    """Crea un nuevo webhook"""
    try:
        webhook = tiendanube_service.create_webhook(webhook_data)
        return {
            'success': True,
            'data': webhook
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/webhooks/{webhook_id}')
def delete_webhook(webhook_id: int):
    """Elimina un webhook"""
    try:
        tiendanube_service.delete_webhook(webhook_id)
        return {
            'success': True,
            'message': 'Webhook eliminado exitosamente'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
