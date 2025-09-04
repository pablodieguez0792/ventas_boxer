"""
Servicio para integración con la API de Rural Santa Fe v3
"""
import requests
import csv
import io
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
from token_storage import TokenStorage

logger = logging.getLogger(__name__)

@dataclass
class RSFProduct:
    """Estructura de datos para productos de RSF"""
    marca_rsf: str
    articulo: str
    fabrica: str
    descripcion: str
    tipo_txt: str
    marca_original: str
    precio_lista: float
    precio_neto: float
    stock_final: int  # 1=Disponible, 2=Baja cantidad, 3=Sin stock
    modulo_venta: int
    rubro: str
    segmento: str
    enlace: str
    oem: str
    codigo_barra: str
    codigo_rsf: str
    codigo_barra_big: str

@dataclass
class RSFDiscount:
    """Estructura de datos para descuentos por marca"""
    marca_rsf: str
    marca_original: str
    descuento: float
    tipo: int  # 0=general, 1=específico

@dataclass
class RSFOrderProduct:
    """Producto para pedido RSF"""
    cantidad: int
    codigo_rsf: Optional[str] = None
    articulo: Optional[str] = None
    fabrica: Optional[str] = None
    marca_rsf: Optional[str] = None
    marca_original: Optional[str] = None

@dataclass
class RSFDocument:
    """Documento comercial RSF"""
    numero: str
    tipo: str
    tipo_descripcion: str
    codigo_arca: str
    subtotal: float
    total: float
    saldo: float
    estado: str
    total_percepciones: float
    iva: float
    fecha: str
    percepcion_detalles: List[Dict]
    producto_detalles: List[Dict]

class RSFAPIService:
    """Servicio para interactuar con la API de Rural Santa Fe v3"""
    
    def __init__(self):
        self.base_url = "https://plataformarsf.com:1043"
        self.access_token = None
        self.cuenta_rsf = None
        self.razon_social = None
        self.token_expires_at = None
        self.token_storage = TokenStorage()
        
        # Intentar cargar token guardado al inicializar
        self._load_saved_token()
    
    def _load_saved_token(self):
        """Carga token guardado desde archivo"""
        token_data = self.token_storage.load_token()
        if token_data and self.token_storage.is_token_valid(token_data):
            self.access_token = token_data.get('access_token')
            self.cuenta_rsf = token_data.get('cuenta_rsf')
            self.razon_social = token_data.get('razon_social')
            if token_data.get('token_expires_at'):
                self.token_expires_at = datetime.fromisoformat(token_data['token_expires_at'])
            logger.info("Token RSF cargado desde archivo")
        else:
            # Limpiar token inválido
            self.token_storage.clear_token()
    
    def _save_token(self):
        """Guarda token actual en archivo"""
        if self.access_token and self.token_expires_at:
            token_data = {
                'access_token': self.access_token,
                'cuenta_rsf': self.cuenta_rsf,
                'razon_social': self.razon_social,
                'token_expires_at': self.token_expires_at.isoformat()
            }
            self.token_storage.save_token(token_data)
        
    def _get_headers(self) -> Dict[str, str]:
        """Obtiene headers con autenticación"""
        if not self.access_token:
            raise ValueError("No hay token de acceso. Debe autenticarse primero.")
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def _is_token_expired(self) -> bool:
        """Verifica si el token ha expirado"""
        if not self.token_expires_at:
            return True
        return datetime.now() >= self.token_expires_at
    
    async def login(self, cuenta_rsf: str, password: str) -> bool:
        """
        Autenticación con la API RSF
        
        Args:
            cuenta_rsf: Número de cuenta RSF
            password: Contraseña de la cuenta
            
        Returns:
            True si la autenticación fue exitosa, False en caso contrario
        """
        try:
            url = f"{self.base_url}/api/login"
            payload = {
                "cuentaRSF": cuenta_rsf,
                "password": password
            }
            
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            self.access_token = data.get("accessToken")
            self.cuenta_rsf = cuenta_rsf
            self.razon_social = data.get("razonSocial")
            
            # Token expira en 12 horas
            self.token_expires_at = datetime.now() + timedelta(hours=12)
            
            # Guardar token en archivo
            self._save_token()
            
            logger.info(f"Autenticación exitosa para cuenta {cuenta_rsf}")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en autenticación RSF: {e}")
            return False
    
    async def get_products_list(self, add_header: bool = True) -> List[RSFProduct]:
        """
        Obtiene la lista completa de productos en formato CSV
        
        Args:
            add_header: Si incluir cabecera en el CSV
            
        Returns:
            Lista de productos RSF
        """
        if self._is_token_expired():
            raise ValueError("Token expirado. Debe autenticarse nuevamente.")
        
        try:
            url = f"{self.base_url}/api/productos/lista"
            params = {"addHeader": str(add_header).lower()}
            
            response = requests.get(
                url, 
                headers=self._get_headers(), 
                params=params,
                timeout=120,
                stream=True
            )
            response.raise_for_status()
            
            # Parsear CSV de forma más eficiente
            csv_content = response.text
            csv_reader = csv.DictReader(io.StringIO(csv_content), delimiter=';')
            
            products = []
            batch_size = 1000
            current_batch = []
            
            def safe_float(value, default=0.0):
                """Convierte string a float manejando comas como separador decimal"""
                if not value or value == '':
                    return default
                try:
                    # Reemplazar coma por punto para el formato decimal
                    cleaned_value = str(value).replace(',', '.')
                    return float(cleaned_value)
                except (ValueError, TypeError):
                    return default
            
            def safe_int(value, default=0):
                """Convierte string a int de forma segura"""
                if not value or value == '':
                    return default
                try:
                    return int(float(str(value).replace(',', '.')))
                except (ValueError, TypeError):
                    return default
            
            for row in csv_reader:
                try:
                    product = RSFProduct(
                        marca_rsf=row.get('MarcaRSF', ''),
                        articulo=row.get('Articulo', ''),
                        fabrica=row.get('Fabrica', ''),
                        descripcion=row.get('Descripcion', ''),
                        tipo_txt=row.get('TipoTxt', ''),
                        marca_original=row.get('MarcaOriginal', ''),
                        precio_lista=safe_float(row.get('PrecioLista')),
                        precio_neto=safe_float(row.get('PrecioNeto')),
                        stock_final=safe_int(row.get('StockFinal')),
                        modulo_venta=safe_int(row.get('ModuloVenta'), 1),
                        rubro=row.get('Rubro', ''),
                        segmento=row.get('Segmento', ''),
                        enlace=row.get('Enlace', ''),
                        oem=row.get('OEM', ''),
                        codigo_barra=row.get('CodigoBarra', ''),
                        codigo_rsf=row.get('CodigoRSF', ''),
                        codigo_barra_big=row.get('CodigoBarraBig', '')
                    )
                    current_batch.append(product)
                    
                    # Procesar en lotes para mejor rendimiento
                    if len(current_batch) >= batch_size:
                        products.extend(current_batch)
                        current_batch = []
                        
                except Exception as e:
                    logger.warning(f"Error procesando producto {row.get('CodigoRSF', 'desconocido')}: {e}")
                    continue
            
            # Agregar el último lote
            if current_batch:
                products.extend(current_batch)
            
            logger.info(f"Obtenidos {len(products)} productos de RSF")
            return products
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error obteniendo productos RSF: {e}")
            raise
    
    async def get_discounts_json(self) -> List[RSFDiscount]:
        """
        Obtiene descuentos por marca en formato JSON
        
        Returns:
            Lista de descuentos por marca
        """
        if self._is_token_expired():
            raise ValueError("Token expirado. Debe autenticarse nuevamente.")
        
        try:
            # Según la documentación RSF, los endpoints correctos son:
            endpoints_to_try = [
                f"{self.base_url}/api/descuentomarcas/json",  # Formato JSON
                f"{self.base_url}/api/descuentomarcas/lista"   # Formato CSV
            ]
            
            response = None
            for url in endpoints_to_try:
                try:
                    response = requests.get(url, headers=self._get_headers(), timeout=30)
                    response.raise_for_status()
                    logger.info(f"Descuentos obtenidos desde: {url}")
                    break
                except requests.exceptions.RequestException as e:
                    logger.warning(f"Endpoint {url} falló: {e}")
                    continue
            
            if not response:
                # Si no funcionan los endpoints específicos, devolver lista vacía con mensaje informativo
                logger.warning("No se pudieron obtener descuentos de RSF - endpoints no disponibles")
                return []
            
            # Verificar si la respuesta es JSON o CSV
            content_type = response.headers.get('content-type', '').lower()
            
            discounts = []
            
            if 'application/json' in content_type:
                # Respuesta JSON
                data = response.json()
                for item in data:
                    try:
                        discount = RSFDiscount(
                            marca_rsf=item.get('marcaRSF', ''),
                            marca_original=item.get('marcaOriginal', ''),
                            descuento=float(str(item.get('descuento', 0)).replace(',', '.')),
                            tipo=int(item.get('tipo', 0))
                        )
                        discounts.append(discount)
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Error procesando descuento JSON: {e}")
                        continue
            else:
                # Respuesta CSV
                csv_content = response.text
                csv_reader = csv.DictReader(io.StringIO(csv_content), delimiter=';')
                
                for row in csv_reader:
                    try:
                        discount = RSFDiscount(
                            marca_rsf=row.get('MarcaRSF', ''),
                            marca_original=row.get('MarcaOriginal', ''),
                            descuento=float(row.get('Descuento', '0').replace(',', '.')),
                            tipo=int(row.get('Tipo', 0))
                        )
                        discounts.append(discount)
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Error procesando descuento CSV: {e}")
                        continue
            
            logger.info(f"Obtenidos {len(discounts)} descuentos de RSF")
            return discounts
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error obteniendo descuentos RSF: {e}")
            raise
    
    async def send_order(self, 
                        products: List[RSFOrderProduct], 
                        test: bool = True,
                        comentario: Optional[str] = None,
                        email: Optional[str] = None) -> Dict:
        """
        Envía un pedido a RSF
        
        Args:
            products: Lista de productos a pedir
            test: Si es pedido de prueba
            comentario: Comentario opcional
            email: Email para notificaciones
            
        Returns:
            Respuesta del pedido
        """
        if self._is_token_expired():
            raise ValueError("Token expirado. Debe autenticarse nuevamente.")
        
        try:
            url = f"{self.base_url}/api/pedidos/ingresar"
            
            # Construir payload
            payload = {
                "test": test,
                "productos": []
            }
            
            if comentario:
                payload["comentario"] = comentario
            if email:
                payload["email"] = email
            
            # Agregar productos
            for product in products:
                product_data = {"cantidad": product.cantidad}
                
                if product.codigo_rsf:
                    product_data["codigoRSF"] = product.codigo_rsf
                elif product.articulo and product.marca_rsf:
                    product_data["articulo"] = product.articulo
                    product_data["marcaRSF"] = product.marca_rsf
                elif product.articulo and product.marca_original:
                    product_data["articulo"] = product.articulo
                    product_data["marcaOriginal"] = product.marca_original
                elif product.fabrica and product.marca_rsf:
                    product_data["fabrica"] = product.fabrica
                    product_data["marcaRSF"] = product.marca_rsf
                elif product.fabrica and product.marca_original:
                    product_data["fabrica"] = product.fabrica
                    product_data["marcaOriginal"] = product.marca_original
                else:
                    logger.warning(f"Producto sin identificación válida: {product}")
                    continue
                
                payload["productos"].append(product_data)
            
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Pedido enviado. Válido: {result.get('valido')}")
            
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enviando pedido RSF: {e}")
            raise
    
    async def get_documents_by_date(self, from_date: Optional[str] = None) -> List[RSFDocument]:
        """
        Obtiene documentos por fecha
        
        Args:
            from_date: Fecha desde (YYYY-MM-DD). Si no se especifica, últimos 30 días
            
        Returns:
            Lista de documentos
        """
        if self._is_token_expired():
            raise ValueError("Token expirado. Debe autenticarse nuevamente.")
        
        try:
            url = f"{self.base_url}/api/Documento/ByDate"
            params = {}
            
            if from_date:
                params["fromDateTime"] = from_date
            
            response = requests.get(url, headers=self._get_headers(), params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            def safe_float_conversion(value, default=0.0):
                """Convierte string a float manejando comas como separador decimal"""
                if not value or value == '':
                    return default
                try:
                    # Reemplazar coma por punto para el formato decimal
                    cleaned_value = str(value).replace(',', '.')
                    return float(cleaned_value)
                except (ValueError, TypeError):
                    logger.warning(f"No se pudo convertir '{value}' a float, usando {default}")
                    return default

            documents = []
            for doc_data in data:
                try:
                    document = RSFDocument(
                        numero=doc_data.get('numero', ''),
                        tipo=doc_data.get('tipo', ''),
                        tipo_descripcion=doc_data.get('tipoDescripcion', ''),
                        codigo_arca=doc_data.get('codigoArca', ''),
                        subtotal=safe_float_conversion(doc_data.get('subTotal', 0)),
                        total=safe_float_conversion(doc_data.get('total', 0)),
                        saldo=safe_float_conversion(doc_data.get('saldo', 0)),
                        estado=doc_data.get('estado', ''),
                        total_percepciones=safe_float_conversion(doc_data.get('totalPercepciones', 0)),
                        iva=safe_float_conversion(doc_data.get('iva', 0)),
                        fecha=doc_data.get('fecha', ''),
                        percepcion_detalles=doc_data.get('percepcionDetalles', []),
                        producto_detalles=doc_data.get('productoDetalles', [])
                    )
                    documents.append(document)
                except Exception as e:
                    logger.warning(f"Error procesando documento {doc_data.get('numero', 'desconocido')}: {e}")
                    continue
            
            logger.info(f"Obtenidos {len(documents)} documentos de RSF")
            return documents
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error obteniendo documentos RSF: {e}")
            raise
    
    async def get_document_by_number(self, numero_documento: str) -> Optional[RSFDocument]:
        """
        Obtiene un documento específico por número
        
        Args:
            numero_documento: Número del documento (ej: A-0003-01351897)
            
        Returns:
            Documento específico o None si no se encuentra
        """
        if self._is_token_expired():
            raise ValueError("Token expirado. Debe autenticarse nuevamente.")
        
        try:
            url = f"{self.base_url}/api/Documento/ByNumero"
            params = {"numeroDocumento": numero_documento}
            
            response = requests.get(url, headers=self._get_headers(), params=params, timeout=30)
            response.raise_for_status()
            
            doc_data = response.json()
            
            if not doc_data:
                return None
            
            def safe_float_conversion(value, default=0.0):
                """Convierte string a float manejando comas como separador decimal"""
                if not value or value == '':
                    return default
                try:
                    cleaned_value = str(value).replace(',', '.')
                    return float(cleaned_value)
                except (ValueError, TypeError):
                    logger.warning(f"No se pudo convertir '{value}' a float, usando {default}")
                    return default

            document = RSFDocument(
                numero=doc_data.get('numero', ''),
                tipo=doc_data.get('tipo', ''),
                tipo_descripcion=doc_data.get('tipoDescripcion', ''),
                codigo_arca=doc_data.get('codigoArca', ''),
                subtotal=safe_float_conversion(doc_data.get('subTotal', 0)),
                total=safe_float_conversion(doc_data.get('total', 0)),
                saldo=safe_float_conversion(doc_data.get('saldo', 0)),
                estado=doc_data.get('estado', ''),
                total_percepciones=safe_float_conversion(doc_data.get('totalPercepciones', 0)),
                iva=safe_float_conversion(doc_data.get('iva', 0)),
                fecha=doc_data.get('fecha', ''),
                percepcion_detalles=doc_data.get('percepcionDetalles', []),
                producto_detalles=doc_data.get('productoDetalles', [])
            )
            
            logger.info(f"Obtenido documento {numero_documento}")
            return document
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error obteniendo documento {numero_documento}: {e}")
            raise
    
    def get_stock_status_text(self, stock_final: int) -> str:
        """Convierte código de stock a texto descriptivo"""
        stock_map = {
            1: "Disponible",
            2: "Disponible - Baja cantidad",
            3: "Sin stock"
        }
        return stock_map.get(stock_final, "Estado desconocido")
    
    def get_connection_status(self) -> Dict[str, Union[str, bool, int]]:
        """Obtiene el estado actual de la conexión"""
        is_connected = bool(self.access_token and not self._is_token_expired())
        
        # Calcular tiempo restante en minutos
        minutes_remaining = 0
        if self.token_expires_at and is_connected:
            time_diff = self.token_expires_at - datetime.now()
            minutes_remaining = max(0, int(time_diff.total_seconds() / 60))
        
        return {
            "connected": is_connected,
            "cuenta_rsf": self.cuenta_rsf,
            "razon_social": self.razon_social,
            "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
            "minutes_remaining": minutes_remaining,
            "is_expired": self._is_token_expired()
        }
