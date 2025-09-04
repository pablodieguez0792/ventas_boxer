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
                "vehicle_id[]": vehicle_id,
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
