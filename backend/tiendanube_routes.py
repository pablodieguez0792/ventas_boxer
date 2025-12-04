"""
Rutas de la API para Tienda Nube.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from tiendanube_service import tiendanube_service
from excel_handler import ExcelHandler
from tiendanube_accounts import TiendaNubeAccountManager
from io import BytesIO

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

# ============================================
# RUTAS PARA CARGA MASIVA CON EXCEL
# ============================================

@router.get('/excel/template')
def download_product_template():
    """Descargar plantilla Excel para carga masiva de productos"""
    try:
        excel_file = ExcelHandler.create_product_template()
        
        return StreamingResponse(
            excel_file,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=plantilla_productos_tiendanube.xlsx'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/excel/upload')
async def upload_products_excel(file: UploadFile = File(...)):
    """Cargar productos masivamente desde Excel"""
    try:
        # Leer archivo
        contents = await file.read()
        
        # Parsear productos
        products = ExcelHandler.parse_products_from_excel(BytesIO(contents))
        
        if not products:
            raise HTTPException(status_code=400, detail="No se encontraron productos válidos en el archivo")
        
        # Crear productos en Tienda Nube
        results = {
            'success': [],
            'errors': []
        }
        
        for idx, product_data in enumerate(products, 1):
            try:
                result = tiendanube_service.create_product(product_data)
                results['success'].append({
                    'row': idx,
                    'name': product_data['name']['es'],
                    'id': result.get('id')
                })
            except Exception as e:
                results['errors'].append({
                    'row': idx,
                    'name': product_data['name']['es'],
                    'error': str(e)
                })
        
        return {
            'success': True,
            'total': len(products),
            'created': len(results['success']),
            'failed': len(results['errors']),
            'results': results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/excel/export')
def export_products_to_excel():
    """Exportar todos los productos a Excel"""
    try:
        # Obtener todos los productos
        products = tiendanube_service.list_products({'per_page': 200})
        
        if not products:
            raise HTTPException(status_code=404, detail="No se encontraron productos")
        
        # Generar Excel
        excel_file = ExcelHandler.export_products_to_excel(products)
        
        from datetime import datetime
        filename = f'productos_tiendanube_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return StreamingResponse(
            excel_file,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename={filename}'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/excel/update')
async def update_products_from_excel(file: UploadFile = File(...)):
    """Actualizar productos masivamente desde Excel"""
    try:
        # Leer archivo
        contents = await file.read()
        
        # Parsear productos
        import pandas as pd
        df = pd.read_excel(BytesIO(contents), sheet_name='Productos')
        
        results = {
            'success': [],
            'errors': []
        }
        
        for index, row in df.iterrows():
            try:
                product_id = row.get('id')
                variant_id = row.get('variant_id')
                
                if pd.isna(product_id) or pd.isna(variant_id):
                    continue
                
                # Preparar datos de actualización
                variant_data = {}
                
                if not pd.isna(row.get('precio')):
                    variant_data['price'] = str(row.get('precio'))
                
                if not pd.isna(row.get('precio_promocional')):
                    variant_data['promotional_price'] = str(row.get('precio_promocional'))
                
                if not pd.isna(row.get('stock')):
                    variant_data['stock'] = int(row.get('stock'))
                
                if not pd.isna(row.get('peso_kg')):
                    variant_data['weight'] = str(row.get('peso_kg'))
                
                if not pd.isna(row.get('ancho_cm')):
                    variant_data['width'] = str(row.get('ancho_cm'))
                
                if not pd.isna(row.get('alto_cm')):
                    variant_data['height'] = str(row.get('alto_cm'))
                
                if not pd.isna(row.get('profundidad_cm')):
                    variant_data['depth'] = str(row.get('profundidad_cm'))
                
                # Actualizar variante
                if variant_data:
                    tiendanube_service.update_variant(int(product_id), int(variant_id), variant_data)
                    results['success'].append({
                        'row': index + 2,
                        'product_id': product_id,
                        'name': row.get('nombre', '')
                    })
            
            except Exception as e:
                results['errors'].append({
                    'row': index + 2,
                    'product_id': row.get('id', ''),
                    'name': row.get('nombre', ''),
                    'error': str(e)
                })
        
        return {
            'success': True,
            'updated': len(results['success']),
            'failed': len(results['errors']),
            'results': results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# RUTAS PARA GESTIÓN DE MÚLTIPLES CUENTAS
# ============================================

account_manager = TiendaNubeAccountManager()

class AccountData(BaseModel):
    name: str
    store_id: str
    access_token: str
    user_id: Optional[str] = None

@router.get('/accounts')
def get_all_accounts():
    """Obtener todas las cuentas guardadas"""
    try:
        accounts = account_manager.get_all_accounts()
        return {
            'success': True,
            'accounts': [{
                'id': acc.id,
                'name': acc.name,
                'store_id': acc.store_id,
                'is_active': acc.is_active,
                'created_at': acc.created_at.isoformat() if acc.created_at else None
            } for acc in accounts]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/accounts')
def add_account(account: AccountData):
    """Agregar una nueva cuenta"""
    try:
        new_account = account_manager.add_account(
            name=account.name,
            store_id=account.store_id,
            access_token=account.access_token,
            user_id=account.user_id
        )
        
        return {
            'success': True,
            'message': 'Cuenta agregada exitosamente',
            'account': {
                'id': new_account.id,
                'name': new_account.name,
                'store_id': new_account.store_id
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
        
        # Actualizar el servicio con la nueva cuenta activa
        tiendanube_service.store_id = account.store_id
        tiendanube_service.access_token = account.access_token
        
        return {
            'success': True,
            'message': f'Cuenta "{account.name}" activada',
            'account': {
                'id': account.id,
                'name': account.name,
                'store_id': account.store_id
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
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        
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
                'store_id': account.store_id,
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
                'store_id': account.store_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
