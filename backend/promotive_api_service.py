"""
Servicio para integración con API de Promotive/SpecParts
Permite consultar vehículos por patente/VIN y obtener información técnica completa
"""

import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Caché en disco para /single-part/{id}: la API de SpecParts cobra por cupo
# mensual (requests.left en la respuesta), así que evitamos repetir la misma
# consulta de referencias cruzadas cada vez que alguien busca el mismo vehículo.
CROSS_CACHE_FILE = os.path.join(os.path.dirname(__file__), "promotive_cross_cache.json")
CROSS_CACHE_TTL_DAYS = 14

class PromotiveAPIService:
    def __init__(self, client_id: str = None, client_secret: str = None):
        self.client_id = client_id or os.getenv('PROMOTIVE_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('PROMOTIVE_CLIENT_SECRET')
        self.base_url = os.getenv('PROMOTIVE_BASE_URL', "https://external-api.specparts.ai")
        self.auth_url = os.getenv('PROMOTIVE_AUTH_URL', "https://auth.specparts.ai/oauth")
        self.access_token = None
        self.token_expires_at = None
        
    def _get_headers(self) -> Dict[str, str]:
        """Obtiene headers con token de autorización"""
        if not self.access_token:
            raise ValueError("No hay token de acceso disponible")
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def _is_token_expired(self) -> bool:
        """Verifica si el token ha expirado"""
        if not self.token_expires_at:
            return True
        return datetime.now() >= self.token_expires_at
    
    async def authenticate(self) -> bool:
        """
        Obtiene token OAuth de la API de SpecParts
        """
        try:
            payload = {
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
            
            response = requests.post(
                self.auth_url,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data.get("access_token")
            
            # Asumir que el token expira en 1 hora si no se especifica
            expires_in = data.get("expires_in", 3600)
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            logger.info("Autenticación exitosa con SpecParts API")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en autenticación SpecParts: {e}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado en autenticación: {e}")
            return False
    
    async def _ensure_authenticated(self) -> bool:
        """Asegura que tenemos un token válido"""
        if not self.access_token or self._is_token_expired():
            return await self.authenticate()
        return True
    
    async def identify_vehicle(self, plate: Optional[str] = None, vin: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Identifica un vehículo por patente o VIN
        
        Args:
            plate: Patente del vehículo
            vin: VIN del vehículo
            
        Returns:
            Dict con información del vehículo o None si no se encuentra
        """
        if not plate and not vin:
            raise ValueError("Debe proporcionar patente o VIN")
        
        if plate and vin:
            logger.warning("Se proporcionaron patente y VIN, usando patente")
            vin = None
        
        if not await self._ensure_authenticated():
            raise Exception("No se pudo autenticar con SpecParts API")
        
        try:
            params = {}
            if plate:
                params["plate"] = plate.strip().upper()
            else:
                params["vin"] = vin.strip().upper()
            
            response = requests.get(
                f"{self.base_url}/vehicle/identification",
                params=params,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 404:
                logger.info(f"Vehículo no encontrado para {'patente' if plate else 'VIN'}: {plate or vin}")
                return None
            
            if response.status_code in [401, 403]:
                # Intentar reautenticar una vez
                logger.warning("Token expirado, reautenticando...")
                if await self.authenticate():
                    response = requests.get(
                        f"{self.base_url}/vehicle/identification",
                        params=params,
                        headers=self._get_headers(),
                        timeout=30
                    )
                else:
                    raise Exception("Error de autenticación")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error consultando vehículo: {e}")
            raise Exception(f"Error en consulta: {str(e)}")
    
    async def enrich_vehicle_data(self, vehicle_code: str) -> Optional[Dict[str, Any]]:
        """
        Enriquece los datos del vehículo con información técnica adicional
        
        Args:
            vehicle_code: Código del vehículo obtenido de identify_vehicle
            
        Returns:
            Dict con información técnica completa
        """
        if not await self._ensure_authenticated():
            raise Exception("No se pudo autenticar con SpecParts API")
        
        try:
            # Columnas técnicas principales (reducidas para evitar error 500)
            columns = [
                "motor", "potencia", "familia", "distribucion", "turbo",
                "transmision", "pasos_caja", "traccion", "frenos_del",
                "frenos_tras", "direccion", "suspension_del", "suspension_tras",
                "dimensiones", "capacidades", "seguridad", "neumaticos", 
                "llantas", "pesos", "combustible", "cilindrada"
            ]
            
            params = {
                "lang": 1,  # Español
                "code": vehicle_code,
                "limit": 100
            }
            
            response = requests.get(
                f"{self.base_url}/vehicle/list",
                params=params,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code in [401, 403]:
                # Intentar reautenticar una vez
                if await self.authenticate():
                    response = requests.get(
                        f"{self.base_url}/vehicle/list",
                        params=params,
                        headers=self._get_headers(),
                        timeout=30
                    )
                else:
                    raise Exception("Error de autenticación")
            
            response.raise_for_status()
            data = response.json()
            
            # Retornar el primer resultado si existe
            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0]
            
            return None
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enriqueciendo datos del vehículo: {e}")
            raise Exception(f"Error en enriquecimiento: {str(e)}")
    
    async def get_compatible_parts(self, vehicle_id: str, category: Optional[str] = None, 
                                 product: Optional[str] = None, page: int = 1, limit: int = 100) -> Dict[str, Any]:
        """
        Obtiene partes compatibles para un vehículo
        
        Args:
            vehicle_id: ID del vehículo
            category: Categoría de partes (opcional)
            product: Producto específico (opcional)
            page: Página de resultados
            limit: Límite de resultados por página (máx 100)
            
        Returns:
            Dict con lista de partes compatibles
        """
        if not await self._ensure_authenticated():
            raise Exception("No se pudo autenticar con SpecParts API")
        
        try:
            params = {
                "lang": 1,  # Español
                # OJO: la API ignora silenciosamente "vehicle_id[]" y devuelve el
                # catalogo completo. El nombre correcto del filtro es "vehicle_id".
                "vehicle_id": vehicle_id,
                "page": page,
                "limit": min(limit, 100)
            }
            
            if category:
                params["category"] = category
            if product:
                params["product"] = product
            
            response = requests.get(
                f"{self.base_url}/part/list",
                params=params,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code in [401, 403]:
                # Intentar reautenticar una vez
                if await self.authenticate():
                    response = requests.get(
                        f"{self.base_url}/part/list",
                        params=params,
                        headers=self._get_headers(),
                        timeout=30
                    )
                else:
                    raise Exception("Error de autenticación")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error consultando partes: {e}")
            raise Exception(f"Error en consulta de partes: {str(e)}")

    async def get_vehicle_ids_by_engine_family(self, engine_family: str) -> List[int]:
        """
        Devuelve los vehicle_id de TODOS los vehículos (cualquier modelo) que
        comparten una familia de motor (p. ej. "EA211": usado por VW Golf,
        Polo, T-Cross, Virtus, Audi A1, Seat Ibiza, etc.).

        A diferencia de "code"/"id", el filtro "engine_family" en /vehicle/list
        sí funciona: agrupa por mercado y devuelve "vehicle_ids" (lista plana).
        Se usa como fallback cuando el vehicle_id exacto de la patente no tiene
        partes cargadas, para buscar piezas de motor en vehículos hermanos que
        usan el mismo motor.
        """
        if not engine_family:
            return []
        if not await self._ensure_authenticated():
            raise Exception("No se pudo autenticar con SpecParts API")

        try:
            response = requests.get(
                f"{self.base_url}/vehicle/list",
                params={"lang": 1, "engine_family": engine_family, "limit": 10},
                headers=self._get_headers(),
                timeout=30
            )
            if response.status_code in [401, 403]:
                if await self.authenticate():
                    response = requests.get(
                        f"{self.base_url}/vehicle/list",
                        params={"lang": 1, "engine_family": engine_family, "limit": 10},
                        headers=self._get_headers(),
                        timeout=30
                    )
                else:
                    raise Exception("Error de autenticación")
            response.raise_for_status()
            data = response.json().get("data", []) or []
            ids: List[int] = []
            for group in data:
                ids.extend(group.get("vehicle_ids") or [])
            return ids
        except requests.exceptions.RequestException as e:
            logger.warning(f"No se pudo obtener vehículos por familia de motor {engine_family}: {e}")
            return []

    @staticmethod
    def _load_cross_cache() -> Dict[str, Any]:
        try:
            if os.path.exists(CROSS_CACHE_FILE):
                with open(CROSS_CACHE_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"No se pudo leer el caché de cross-references: {e}")
        return {}

    @staticmethod
    def _save_cross_cache(cache: Dict[str, Any]) -> None:
        try:
            with open(CROSS_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"No se pudo guardar el caché de cross-references: {e}")

    async def get_part_detail(self, part_id: int) -> Optional[Dict[str, Any]]:
        """
        Ficha completa de una parte vía /single-part/{id} (atributos, fotos,
        cruces, vehículos compatibles, EAN, links, componentes, etc.).
        Cacheada en disco CROSS_CACHE_TTL_DAYS días porque consume cupo mensual.
        """
        cache = self._load_cross_cache()
        key = f"detail:{part_id}"
        cached = cache.get(key)
        if cached:
            fetched_at = datetime.fromisoformat(cached["fetched_at"])
            if datetime.now() - fetched_at < timedelta(days=CROSS_CACHE_TTL_DAYS):
                return cached["detail"]

        if not await self._ensure_authenticated():
            raise Exception("No se pudo autenticar con SpecParts API")

        try:
            def _get():
                return requests.get(
                    f"{self.base_url}/single-part/{part_id}",
                    params={"output": "v1"},
                    headers=self._get_headers(),
                    timeout=30
                )
            response = _get()
            if response.status_code in [401, 403]:
                if await self.authenticate():
                    response = _get()
                else:
                    raise Exception("Error de autenticación")

            if response.status_code == 404:
                detail = None
            else:
                response.raise_for_status()
                detail = response.json()
                if isinstance(detail, list):
                    detail = detail[0] if detail else None

            cache[key] = {"fetched_at": datetime.now().isoformat(), "detail": detail}
            self._save_cross_cache(cache)
            return detail

        except requests.exceptions.RequestException as e:
            logger.warning(f"No se pudo obtener el detalle de la parte {part_id}: {e}")
            return None

    async def get_part_cross_references(self, part_id: int) -> List[Dict[str, Any]]:
        """Referencias cruzadas (campo "cross") de /single-part/{id}."""
        detail = await self.get_part_detail(part_id)
        return (detail or {}).get("cross", []) or []
    def get_connection_status(self) -> Dict[str, Any]:
        """Obtiene el estado de la conexión"""
        return {
            "connected": self.access_token is not None,
            "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
            "token_valid": not self._is_token_expired() if self.access_token else False
        }

# Instancia global del servicio
promotive_service = None

def get_promotive_service() -> PromotiveAPIService:
    """Obtiene la instancia global del servicio"""
    global promotive_service
    if promotive_service is None:
        promotive_service = PromotiveAPIService()
    return promotive_service
