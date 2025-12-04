"""
Servicio para interactuar con la API de MercadoLibre.
"""

import requests
import json
import re
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from mercadolibre_config import (
    API_URL_BASE, 
    MERCADOLIBRE_CONFIG, 
    load_token, 
    save_token, 
    get_headers
)

class MercadoLibreService:
    """Servicio para gestionar la conexión con MercadoLibre"""
    
    def __init__(self):
        self.config = MERCADOLIBRE_CONFIG
        self.token_data = load_token()
        self.user_id = self.config.get('user_id')
        self.site_id = self.config.get('site_id')
        self.base_url = API_URL_BASE
    
    def is_authenticated(self):
        """Verifica si hay un token válido"""
        if not self.token_data:
            self.token_data = load_token()
        
        if not self.token_data or 'access_token' not in self.token_data:
            return False
        
        # Verificar si el token expiró
        expires_at = self.token_data.get('expires_at', 0)
        if datetime.now().timestamp() >= expires_at:
            print("[ML] Token expirado, intentando renovar...")
            return self.refresh_access_token()
        
        return True
    
    def refresh_access_token(self):
        """Renueva el token de acceso usando el refresh_token"""
        try:
            refresh_token = self.token_data.get('refresh_token')
            if not refresh_token:
                print("[ML] No hay refresh_token disponible")
                return False
            
            client_id = self.config.get('client_id')
            client_secret = self.config.get('client_secret')
            
            if not client_secret:
                print("[ML] Client secret no configurado. Usando token existente.")
                # Intentar usar el token actual aunque esté expirado
                return True
            
            print(f"[ML] Renovando token con refresh_token...")
            
            # Endpoint para renovar token
            token_url = "https://api.mercadolibre.com/oauth/token"
            
            data = {
                'grant_type': 'refresh_token',
                'client_id': client_id,
                'client_secret': client_secret,
                'refresh_token': refresh_token
            }
            
            response = requests.post(token_url, json=data)
            response.raise_for_status()
            
            new_token_data = response.json()
            
            # Guardar el nuevo token
            save_token(new_token_data)
            self.token_data = new_token_data
            
            print("[ML] Token renovado exitosamente")
            return True
            
        except Exception as e:
            print(f"[ML] Error al renovar token: {str(e)}")
            # Intentar continuar con el token actual
            return True
    
    def verify_and_refresh_connection(self):
        """Verifica la conexión y renueva el token si es necesario"""
        try:
            # Recargar token del archivo
            self.token_data = load_token()
            
            if not self.token_data:
                return {
                    'connected': False,
                    'message': 'No hay token de acceso',
                    'token_renewed': False
                }
            
            # Verificar si está expirado
            expires_at = self.token_data.get('expires_at', 0)
            is_expired = datetime.now().timestamp() >= expires_at
            
            token_renewed = False
            if is_expired:
                print("[ML] Token expirado, renovando...")
                token_renewed = self.refresh_access_token()
            
            # Intentar obtener info del usuario para verificar
            try:
                user_info = self.get_user_info()
                return {
                    'connected': True,
                    'message': 'Conexión verificada exitosamente',
                    'user_info': user_info,
                    'token_renewed': token_renewed,
                    'expires_at': datetime.fromtimestamp(self.token_data.get('expires_at', 0)).isoformat()
                }
            except Exception as e:
                return {
                    'connected': False,
                    'message': f'Error al verificar conexión: {str(e)}',
                    'token_renewed': token_renewed
                }
                
        except Exception as e:
            return {
                'connected': False,
                'message': f'Error: {str(e)}',
                'token_renewed': False
            }
    
    def get_connection_status(self):
        """Obtiene el estado de la conexión"""
        if not self.is_authenticated():
            return {
                'connected': False,
                'message': 'No hay token de acceso válido'
            }
        
        try:
            # Obtener información del usuario
            user_info = self.get_user_info()
            
            return {
                'connected': True,
                'message': 'Conectado exitosamente',
                'user_info': user_info,
                'expires_at': datetime.fromtimestamp(self.token_data.get('expires_at', 0)).isoformat()
            }
        except Exception as e:
            return {
                'connected': False,
                'message': f'Error de conexión: {str(e)}'
            }
    
    def _make_request(self, method, endpoint, data=None, params=None):
        """Realiza una solicitud a la API de MercadoLibre"""
        if not self.is_authenticated():
            raise Exception("No hay token de acceso válido.")
        
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
                try:
                    error_detail = e.response.json()
                    error_msg += f" - Response: {error_detail}"
                except:
                    error_msg += f" - Response: {e.response.text}"
            raise Exception(error_msg)
    
    def get_user_info(self):
        """Obtiene información del usuario"""
        return self._make_request('GET', f'users/{self.user_id}')
    
    def get_items(self, limit=50, offset=0, status='active'):
        """
        Obtiene las publicaciones del usuario (OPTIMIZADO con requests paralelos)
        Args:
            limit (int): Cantidad de items a obtener (max 50)
            offset (int): Offset para paginación
            status (str): Estado de las publicaciones (active, paused, closed)
        Returns:
            dict: Respuesta con las publicaciones
        """
        params = {
            'limit': min(limit, 50),
            'offset': offset,
            'status': status
        }
        
        print(f"[ML] Obteniendo lista de IDs (limit={limit}, offset={offset}, status={status})...")
        print(f"[ML] Params enviados a API: {params}")
        
        # Primero obtenemos la lista de IDs
        search_result = self._make_request('GET', f'users/{self.user_id}/items/search', params=params)
        
        print(f"[ML] Respuesta de search: {search_result}")
        print(f"[ML] Paging info: {search_result.get('paging', {})}")
        
        item_ids = search_result.get('results', [])
        
        print(f"[ML] IDs obtenidos: {len(item_ids)} - {item_ids[:5]}..." if len(item_ids) > 5 else f"[ML] IDs obtenidos: {len(item_ids)} - {item_ids}")
        
        if not item_ids:
            return {
                'paging': search_result.get('paging', {}),
                'items': []
            }
        
        print(f"[ML] Obteniendo detalles de {len(item_ids)} items uno por uno...")
        
        # Obtener items uno por uno (más lento pero más confiable)
        items_detailed = []
        
        def fetch_single_item(item_id):
            """Función para obtener un item individual"""
            try:
                item_data = self._make_request('GET', f'items/{item_id}')
                if item_data:
                    return item_data
                else:
                    print(f"[ML] WARN - Item {item_id}: respuesta vacía")
                    return None
            except Exception as e:
                print(f"[ML] Error obteniendo item {item_id}: {str(e)}")
                return None
        
        # Usar ThreadPoolExecutor para requests paralelos (máximo 10 threads)
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_id = {executor.submit(fetch_single_item, item_id): item_id for item_id in item_ids}
            
            for future in as_completed(future_to_id):
                try:
                    item_data = future.result()
                    if item_data is not None:
                        items_detailed.append(item_data)
                except Exception as e:
                    item_id = future_to_id[future]
                    print(f"[ML] Error procesando item {item_id}: {str(e)}")
        
        print(f"[ML] ✓ {len(items_detailed)} items obtenidos exitosamente")
        
        return {
            'paging': search_result.get('paging', {}),
            'items': items_detailed
        }
    
    def get_item(self, item_id):
        """Obtiene un item específico con todos sus detalles"""
        return self._make_request('GET', f'items/{item_id}')
    
    def get_item_description(self, item_id):
        """Obtiene la descripción de un item"""
        return self._make_request('GET', f'items/{item_id}/description')
    
    def get_categories(self):
        """Obtiene las categorías del sitio"""
        return self._make_request('GET', f'sites/{self.site_id}/categories')
    
    def search_items(self, query, limit=50):
        """
        Busca items por query
        Args:
            query (str): Término de búsqueda
            limit (int): Cantidad de resultados
        """
        params = {
            'q': query,
            'limit': limit,
            'seller_id': self.user_id
        }
        return self._make_request('GET', f'sites/{self.site_id}/search', params=params)
    
    def map_ml_to_tiendanube(self, ml_item, include_description=False):
        """
        Mapea un item de MercadoLibre al formato de Tienda Nube
        Args:
            ml_item (dict): Item de MercadoLibre
            include_description (bool): Si True, hace request adicional para descripción
        Returns:
            dict: Producto en formato Tienda Nube
        """
        # Validar que ml_item no sea None
        if ml_item is None:
            raise ValueError("ml_item no puede ser None")
        
        # Usar título como descripción por defecto (más rápido)
        description = ml_item.get('title', '')
        
        # Solo obtener descripción si se solicita explícitamente
        if include_description:
            try:
                desc_data = self.get_item_description(ml_item['id'])
                description = desc_data.get('plain_text', '') or desc_data.get('text', '') or description
            except:
                pass  # Usar título si falla
        
        # Mapear imágenes
        images = []
        if ml_item.get('pictures'):
            images = [
                {'src': pic.get('secure_url') or pic.get('url')} 
                for pic in ml_item['pictures'][:10]  # Máximo 10 imágenes
            ]
        
        # Obtener shipping y dimensiones de forma segura
        shipping = ml_item.get('shipping') or {}
        dimensions = shipping.get('dimensions') or {}
        
        item_id = ml_item.get('id')
        
        # Extraer dimensiones de shipping.dimensions
        weight = dimensions.get('weight')
        width = dimensions.get('width')
        height = dimensions.get('height')
        length = dimensions.get('length')
        
        # Si no hay dimensiones en shipping, buscar en attributes
        if not (weight or width or height or length):
            attributes = ml_item.get('attributes', [])
            for attr in attributes:
                attr_id = attr.get('id')
                attr_name = attr.get('name', '')
                attr_value_name = attr.get('value_name')
                attr_value_struct = attr.get('value_struct', {})
                
                # Intentar obtener el valor numérico
                try:
                    if attr_value_struct and 'number' in attr_value_struct:
                        attr_value = float(attr_value_struct['number'])
                        unit = attr_value_struct.get('unit', '')
                    elif attr_value_name:
                        # Extraer número del string (ej: "20 g" -> 20)
                        match = re.search(r'([\d.]+)', str(attr_value_name))
                        if match:
                            attr_value = float(match.group(1))
                            unit = attr_value_name.replace(match.group(1), '').strip()
                        else:
                            continue
                    else:
                        continue
                    
                    # Buscar peso (puede estar en g o kg)
                    if attr_id in ['WEIGHT', 'PACKAGE_WEIGHT'] or 'Peso' in attr_name:
                        if 'g' in unit.lower() and 'kg' not in unit.lower():
                            weight = attr_value / 1000  # Convertir g a kg
                            print(f"[ML] ✓ Peso encontrado: {attr_value}g = {weight}kg")
                        else:
                            weight = attr_value
                            print(f"[ML] ✓ Peso encontrado: {weight}kg")
                    
                    # Buscar ancho
                    elif attr_id in ['WIDTH', 'PACKAGE_WIDTH'] or 'Ancho' in attr_name:
                        width = attr_value
                        print(f"[ML] ✓ Ancho encontrado: {width}cm")
                    
                    # Buscar alto/altura
                    elif attr_id in ['HEIGHT', 'PACKAGE_HEIGHT'] or 'Altura' in attr_name or 'Alto' in attr_name:
                        height = attr_value
                        print(f"[ML] ✓ Alto encontrado: {height}cm")
                    
                    # Buscar largo/profundidad
                    elif attr_id in ['LENGTH', 'DEPTH', 'PACKAGE_LENGTH'] or 'Largo' in attr_name or 'Profundidad' in attr_name:
                        length = attr_value
                        print(f"[ML] ✓ Largo encontrado: {length}cm")
                        
                except Exception as e:
                    continue
        
        # Log de dimensiones finales
        if weight or width or height or length:
            print(f"[ML] ✓ Item {item_id}: peso={weight}kg, ancho={width}cm, alto={height}cm, largo={length}cm")
        else:
            print(f"[ML] ⚠ Item {item_id} NO tiene dimensiones")
        
        # Preparar variante con dimensiones
        variant = {
            'price': str(ml_item.get('price', 0)),
            'promotional_price': str(ml_item.get('original_price')) if ml_item.get('original_price') and ml_item.get('original_price') > ml_item.get('price', 0) else None,
            'stock': ml_item.get('available_quantity', 0),
            'sku': ml_item.get('seller_custom_field') or ml_item.get('id'),
        }
        
        # Agregar peso si existe (Tienda Nube lo requiere en kg)
        if weight:
            variant['weight'] = str(weight)
            print(f"[ML→TN] ✓ Agregando peso: {weight} kg")
        else:
            variant['weight'] = '0.5'  # Peso por defecto si no está disponible
            print(f"[ML→TN] ⚠ Sin peso, usando default: 0.5 kg")
        
        # Agregar dimensiones si existen (Tienda Nube las requiere en cm)
        if width:
            variant['width'] = str(width)
            print(f"[ML→TN] ✓ Agregando ancho: {width} cm")
        if height:
            variant['height'] = str(height)
            print(f"[ML→TN] ✓ Agregando alto: {height} cm")
        if length:
            variant['depth'] = str(length)  # Tienda Nube usa 'depth' en lugar de 'length'
            print(f"[ML→TN] ✓ Agregando profundidad: {length} cm")
        
        print(f"[ML→TN] Variante final para {item_id}: {variant}")
        
        # Preparar datos para Tienda Nube
        tiendanube_product = {
            'name': {'es': ml_item.get('title', 'Sin título')},
            'description': {'es': description},
            'published': ml_item.get('status') == 'active',
            'free_shipping': shipping.get('free_shipping', False),
            'variants': [variant],
            'images': images,
            # Metadata adicional
            'seo_title': {'es': ml_item.get('title', '')[:70]},  # Máximo 70 caracteres
            'seo_description': {'es': (description[:160] if description else ml_item.get('title', ''))},  # Máximo 160
        }
        
        return tiendanube_product
    
    def get_items_for_tiendanube(self, limit=50, offset=0, status='active', include_descriptions=False):
        """
        Obtiene items de ML ya mapeados al formato de Tienda Nube (OPTIMIZADO)
        Args:
            limit (int): Cantidad de items
            offset (int): Offset para paginación
            status (str): Estado de las publicaciones
            include_descriptions (bool): Si True, obtiene descripciones (más lento)
        Returns:
            dict: Items mapeados listos para Tienda Nube
        """
        print(f"[ML→TN] Iniciando mapeo de items (descriptions={include_descriptions})...")
        
        # Obtener items de ML (ya optimizado con threading)
        ml_data = self.get_items(limit=limit, offset=offset, status=status)
        
        # Mapear cada item en paralelo
        mapped_items = []
        
        def map_single_item(item):
            """Mapea un item individual"""
            try:
                if item is None:
                    print(f"[ML] ERROR - Item es None, saltando...")
                    return None
                
                item_id = item.get('id', 'UNKNOWN')
                print(f"[ML] DEBUG - Mapeando item {item_id}...")
                
                mapped = self.map_ml_to_tiendanube(item, include_description=include_descriptions)
                mapped['ml_id'] = item['id']  # Guardar referencia al ID de ML
                mapped['ml_permalink'] = item.get('permalink')
                
                print(f"[ML] DEBUG - Item {item_id} mapeado OK")
                return mapped
            except Exception as e:
                import traceback
                print(f"[ML] ERROR mapeando item {item.get('id') if item else 'None'}: {str(e)}")
                print(f"[ML] Traceback: {traceback.format_exc()}")
                return None
        
        # Mapear en paralelo (rápido porque no hace requests adicionales por defecto)
        items = ml_data.get('items', [])
        
        if include_descriptions:
            # Si se solicitan descripciones, usar threading
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(map_single_item, item) for item in items]
                for future in as_completed(futures):
                    result = future.result()
                    if result:
                        mapped_items.append(result)
        else:
            # Sin descripciones es muy rápido, no necesita threading
            for item in items:
                result = map_single_item(item)
                if result:
                    mapped_items.append(result)
        
        print(f"[ML→TN] ✓ {len(mapped_items)} items mapeados exitosamente")
        
        return {
            'paging': ml_data.get('paging', {}),
            'items': mapped_items,
            'original_items': ml_data.get('items', [])  # Mantener items originales para referencia
        }

# Instancia global del servicio
mercadolibre_service = MercadoLibreService()
