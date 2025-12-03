"""
Servicio para interactuar con la API de Tienda Nube.
"""

import requests
import json
from datetime import datetime
from tiendanube_config import (
    API_URL_BASE, 
    TIENDANUBE_CONFIG, 
    load_token, 
    save_token, 
    get_headers,
    AUTH_URL,
    TOKEN_URL
)

class TiendaNubeService:
    """Servicio para gestionar la conexión con Tienda Nube"""
    
    def __init__(self):
        self.config = TIENDANUBE_CONFIG
        self.token_data = load_token()
        self.store_id = self.config.get('store_id')
        self.base_url = f"{API_URL_BASE}/{self.store_id}"
    
    def get_auth_url(self):
        """Genera la URL de autenticación para obtener el código"""
        params = {
            'client_id': self.config['client_id'],
            'redirect_uri': self.config['redirect_uri'],
            'response_type': 'code',
            'scope': ','.join(self.config['scopes'])
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{AUTH_URL}?{query_string}"
    
    def exchange_code_for_token(self, code):
        """Intercambia el código de autorización por un token de acceso"""
        try:
            data = {
                'client_id': self.config['client_id'],
                'client_secret': self.config['client_secret'],
                'grant_type': 'authorization_code',
                'code': code
            }
            
            response = requests.post(TOKEN_URL, json=data)
            response.raise_for_status()
            
            token_data = response.json()
            save_token(token_data)
            self.token_data = token_data
            
            return {
                'success': True,
                'message': 'Token obtenido exitosamente',
                'data': token_data
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al obtener token: {str(e)}'
            }
    
    def is_authenticated(self):
        """Verifica si hay un token válido"""
        if not self.token_data:
            self.token_data = load_token()
        
        return self.token_data is not None and 'access_token' in self.token_data
    
    def get_connection_status(self):
        """Obtiene el estado de la conexión"""
        if not self.is_authenticated():
            return {
                'connected': False,
                'message': 'No hay token de acceso',
                'auth_url': self.get_auth_url()
            }
        
        try:
            # Intentar obtener información de la tienda
            store_info = self.get_store_info()
            
            return {
                'connected': True,
                'message': 'Conectado exitosamente',
                'store_info': store_info,
                'token_obtained_at': self.token_data.get('obtained_at'),
                'scopes': self.token_data.get('scope', '').split(',')
            }
        except Exception as e:
            return {
                'connected': False,
                'message': f'Error de conexión: {str(e)}',
                'auth_url': self.get_auth_url()
            }
    
    def _make_request(self, method, endpoint, data=None, params=None):
        """Realiza una solicitud a la API de Tienda Nube"""
        if not self.is_authenticated():
            raise Exception("No hay token de acceso. Por favor autentícate primero.")
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = get_headers(self.token_data['access_token'])
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, params=params)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")
            
            response.raise_for_status()
            
            if not response.text:
                return {}
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Error en solicitud {method} {endpoint}: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                error_msg += f" - Response: {e.response.text}"
            raise Exception(error_msg)
    
    def get_store_info(self):
        """Obtiene información de la tienda"""
        return self._make_request('GET', 'store')
    
    def list_products(self, params=None):
        """Lista los productos de la tienda"""
        return self._make_request('GET', 'products', params=params)
    
    def get_product(self, product_id):
        """Obtiene un producto específico"""
        return self._make_request('GET', f'products/{product_id}')
    
    def create_product(self, product_data):
        """Crea un nuevo producto"""
        return self._make_request('POST', 'products', data=product_data)
    
    def update_product(self, product_id, product_data):
        """Actualiza un producto existente"""
        print(f"[DEBUG] Actualizando producto {product_id} con datos: {product_data}")
        result = self._make_request('PUT', f'products/{product_id}', data=product_data)
        print(f"[DEBUG] Resultado de actualización: {result}")
        return result
    
    def delete_product(self, product_id):
        """Elimina un producto"""
        return self._make_request('DELETE', f'products/{product_id}')
    
    def update_stock(self, product_id, variant_id, stock):
        """Actualiza el stock de una variante"""
        return self._make_request('PUT', f'products/{product_id}/variants/{variant_id}', 
                                 data={'stock': stock})
    
    def update_variant(self, product_id, variant_id, variant_data):
        """Actualiza una variante completa (precio, stock, promotional_price, etc.)"""
        print(f"[DEBUG] Actualizando variante {variant_id} del producto {product_id} con datos: {variant_data}")
        result = self._make_request('PUT', f'products/{product_id}/variants/{variant_id}', 
                                   data=variant_data)
        print(f"[DEBUG] Resultado de actualización de variante: {result}")
        return result
    
    def list_orders(self, params=None):
        """Lista las órdenes de la tienda"""
        return self._make_request('GET', 'orders', params=params)
    
    def get_order(self, order_id):
        """Obtiene una orden específica"""
        return self._make_request('GET', f'orders/{order_id}')
    
    def list_categories(self, params=None):
        """Lista las categorías de productos"""
        return self._make_request('GET', 'categories', params=params)
    
    def list_customers(self, params=None):
        """Lista los clientes de la tienda"""
        return self._make_request('GET', 'customers', params=params)
    
    def list_webhooks(self):
        """Lista los webhooks configurados"""
        return self._make_request('GET', 'webhooks')
    
    def create_webhook(self, webhook_data):
        """Crea un nuevo webhook"""
        return self._make_request('POST', 'webhooks', data=webhook_data)
    
    def delete_webhook(self, webhook_id):
        """Elimina un webhook"""
        return self._make_request('DELETE', f'webhooks/{webhook_id}')

# Instancia global del servicio
tiendanube_service = TiendaNubeService()
