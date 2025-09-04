"""
Rutas API para integración con Promotive/SpecParts
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
import logging
from pydantic import BaseModel
from promotive_api_service import get_promotive_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/promotive", tags=["promotive"])

# Variable global para mantener la instancia del servicio con credenciales
promotive_service = None

class PromotiveLoginRequest(BaseModel):
    client_id: str
    client_secret: str

@router.post("/login")
async def promotive_login(request: PromotiveLoginRequest):
    """
    Autentica con la API de Promotive/SpecParts
    """
    try:
        # Crear nueva instancia del servicio con las credenciales proporcionadas
        from promotive_api_service import PromotiveAPIService
        global promotive_service
        promotive_service = PromotiveAPIService(
            client_id=request.client_id,
            client_secret=request.client_secret
        )
        
        success = await promotive_service.authenticate()
        
        if success:
            return {
                "success": True,
                "message": "Autenticación exitosa con Promotive",
                "data": promotive_service.get_connection_status()
            }
        else:
            raise HTTPException(status_code=401, detail="Error de autenticación")
            
    except Exception as e:
        logger.error(f"Error en login Promotive: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def promotive_status():
    """
    Obtiene el estado de la conexión con Promotive
    """
    try:
        global promotive_service
        if promotive_service is None:
            return {
                "connected": False,
                "token_valid": False,
                "message": "No hay credenciales configuradas"
            }
        return promotive_service.get_connection_status()
    except Exception as e:
        logger.error(f"Error obteniendo status Promotive: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vehicle/identify")
async def identify_vehicle(
    plate: Optional[str] = Query(None, description="Patente del vehículo"),
    vin: Optional[str] = Query(None, description="VIN del vehículo")
):
    """
    Identifica un vehículo por patente o VIN
    """
    try:
        if not plate and not vin:
            raise HTTPException(status_code=400, detail="Debe proporcionar patente o VIN")
        
        global promotive_service
        if promotive_service is None:
            raise HTTPException(status_code=401, detail="No hay conexión activa. Debe autenticarse primero.")
        
        vehicle_data = await promotive_service.identify_vehicle(plate=plate, vin=vin)
        
        if vehicle_data is None:
            return {
                "success": False,
                "message": f"No se encontró vehículo para {'patente' if plate else 'VIN'}: {plate or vin}",
                "data": None
            }
        
        return {
            "success": True,
            "message": "Vehículo identificado exitosamente",
            "data": vehicle_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error identificando vehículo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vehicle/enrich/{vehicle_code}")
async def enrich_vehicle(vehicle_code: str):
    """
    Enriquece los datos de un vehículo con información técnica adicional
    """
    try:
        global promotive_service
        if promotive_service is None:
            raise HTTPException(status_code=401, detail="No hay conexión activa. Debe autenticarse primero.")
        
        enriched_data = await promotive_service.enrich_vehicle_data(vehicle_code)
        
        if enriched_data is None:
            return {
                "success": False,
                "message": f"No se encontraron datos adicionales para el vehículo: {vehicle_code}",
                "data": None
            }
        
        return {
            "success": True,
            "message": "Datos del vehículo enriquecidos exitosamente",
            "data": enriched_data
        }
        
    except Exception as e:
        logger.error(f"Error enriqueciendo vehículo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vehicle/complete")
async def get_complete_vehicle_info(
    plate: Optional[str] = Query(None, description="Patente del vehículo"),
    vin: Optional[str] = Query(None, description="VIN del vehículo"),
    include_parts: bool = Query(False, description="Incluir partes compatibles")
):
    """
    Obtiene información completa del vehículo (identificación + enriquecimiento + partes opcionales)
    """
    try:
        if not plate and not vin:
            raise HTTPException(status_code=400, detail="Debe proporcionar patente o VIN")
        
        global promotive_service
        if promotive_service is None:
            raise HTTPException(status_code=401, detail="No hay conexión activa. Debe autenticarse primero.")
        
        # 1. Identificar vehículo
        vehicle_data = await promotive_service.identify_vehicle(plate=plate, vin=vin)
        
        if vehicle_data is None:
            return {
                "success": False,
                "message": f"No se encontró vehículo para {'patente' if plate else 'VIN'}: {plate or vin}",
                "data": None
            }
        
        # 2. Enriquecer datos si tenemos código del vehículo
        enriched_data = None
        vehicle_code = vehicle_data.get("code") or vehicle_data.get("id")
        
        if vehicle_code:
            try:
                enriched_data = await promotive_service.enrich_vehicle_data(vehicle_data.get('vehicle_code'))
            except Exception as e:
                logger.warning(f"No se pudieron enriquecer los datos: {e}")
        
        # 3. Obtener partes compatibles si se solicita
        compatible_parts = None
        if include_parts and vehicle_code:
            try:
                parts_data = await promotive_service.get_compatible_parts(str(vehicle_code))
                compatible_parts = parts_data.get("data", [])
            except Exception as e:
                logger.warning(f"No se pudieron obtener partes compatibles: {e}")
        
        # Combinar toda la información
        complete_info = {
            "basic_info": vehicle_data,
            "technical_details": enriched_data,
            "compatible_parts": compatible_parts
        }
        
        return {
            "success": True,
            "message": "Información completa del vehículo obtenida",
            "data": complete_info
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error obteniendo información completa: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/parts")
async def get_compatible_parts(
    vehicle_id: str = Query(..., description="ID del vehículo"),
    category: Optional[str] = Query(None, description="Categoría de partes"),
    product: Optional[str] = Query(None, description="Producto específico"),
    page: int = Query(1, description="Página de resultados"),
    limit: int = Query(100, description="Límite de resultados por página")
):
    """
    Obtiene partes compatibles para un vehículo
    """
    try:
        global promotive_service
        if promotive_service is None:
            raise HTTPException(status_code=401, detail="No hay conexión activa. Debe autenticarse primero.")
        
        parts_data = await promotive_service.get_compatible_parts(
            vehicle_id=vehicle_id,
            category=category,
            product=product,
            page=page,
            limit=limit
        )
        
        return {
            "success": True,
            "message": "Partes compatibles obtenidas exitosamente",
            "data": parts_data.get("data", []),
            "pagination": {
                "page": page,
                "limit": limit,
                "total": parts_data.get("total", 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo partes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/parts")
async def search_parts(
    search: str = Query(..., description="Término de búsqueda"),
    page: int = Query(1, description="Página de resultados"),
    limit: int = Query(100, description="Límite de resultados por página")
):
    """
    Busca partes por término de búsqueda
    """
    try:
        global promotive_service
        if promotive_service is None:
            raise HTTPException(status_code=401, detail="No hay conexión activa. Debe autenticarse primero.")
        
        # Para búsqueda general, usamos el endpoint de partes sin vehicle_id
        params = {
            "lang": 1,
            "search": search,
            "page": page,
            "limit": min(limit, 100)
        }
        
        import requests
        response = requests.get(
            f"{promotive_service.base_url}/part/list",
            params=params,
            headers=promotive_service._get_headers(),
            timeout=30
        )
        
        if response.status_code in [401, 403]:
            # Intentar reautenticar
            if await promotive_service.authenticate():
                response = requests.get(
                    f"{promotive_service.base_url}/part/list",
                    params=params,
                    headers=promotive_service._get_headers(),
                    timeout=30
                )
            else:
                raise HTTPException(status_code=401, detail="Error de autenticación")
        
        response.raise_for_status()
        parts_data = response.json()
        
        return {
            "success": True,
            "message": f"Búsqueda de partes completada para: {search}",
            "data": parts_data.get("data", []),
            "pagination": {
                "page": page,
                "limit": limit,
                "total": parts_data.get("total", 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Error en búsqueda de partes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
