"""
Rutas API para integración con Promotive/SpecParts
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
import logging
import os
import re
from pydantic import BaseModel
from promotive_api_service import get_promotive_service, PromotiveAPIService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/promotive", tags=["promotive"])

# Variable global para mantener la instancia del servicio con credenciales.
# Si hay credenciales en el .env se crea al arrancar (se autentica sola al primer uso),
# así el front no necesita pedirlas ni guardarlas.
promotive_service = PromotiveAPIService() if (os.getenv('PROMOTIVE_CLIENT_ID') and os.getenv('PROMOTIVE_CLIENT_SECRET')) else None

class PromotiveLoginRequest(BaseModel):
    client_id: str = ""
    client_secret: str = ""

# Categorías de motor/tren motriz: seguras de generalizar entre vehículos que
# comparten la misma familia de motor, aunque sean modelos distintos (p. ej.
# un Golf VII y un Polo con el mismo EA211 usan la misma correa/bomba de agua).
_ENGINE_SAFE_KEYWORDS = [
    "MOTOR", "REFRIGERACI", "EMBRAGUE", "COMBUSTIBLE", "ENCENDIDO",
    "ESCAPE", "DISTRIBUCI", "LUBRICACI", "TRANSMISI",
]
# Explícitamente excluidas: dependen de la carrocería, no del motor.
_CHASSIS_KEYWORDS = ["SUSPENSI", "FRENO", "DIRECCI", "CARROCER"]


def _oem_key(code: Optional[str]) -> Optional[str]:
    """Primeros 9 caracteres alfanuméricos del código (ej. '06H 121 026 AF' -> '06H121026')."""
    k = re.sub(r"[^A-Za-z0-9]", "", code or "").upper()[:9]
    return k if len(k) == 9 and any(c.isdigit() for c in k) else None


def _is_engine_safe_category(category: Optional[str]) -> bool:
    if not category:
        return False
    cat = category.upper()
    if any(k in cat for k in _CHASSIS_KEYWORDS):
        return False
    return any(k in cat for k in _ENGINE_SAFE_KEYWORDS)


async def _fetch_all_parts_for_vehicle(
    service: PromotiveAPIService, vehicle_id, max_pages: int = 50
) -> List[Dict[str, Any]]:
    """Recorre todas las páginas de /part/list para un vehicle_id puntual."""
    all_parts: List[Dict[str, Any]] = []
    page = 1
    while True:
        parts_data = await service.get_compatible_parts(str(vehicle_id), page=page, limit=100)
        batch = parts_data.get("data", [])
        all_parts.extend(batch)
        total_pages = parts_data.get("paging", {}).get("pages", 1)
        if not batch or page >= total_pages or page >= max_pages:
            break
        page += 1
    return all_parts


async def _expand_parts_with_cross_refs(
    service: PromotiveAPIService, all_parts: List[Dict[str, Any]], max_parts_to_expand: int = 1000
) -> List[Dict[str, Any]]:
    """
    Expande cada parte "base" con sus marcas equivalentes (campo "cross" de
    /single-part/{id} — documentado por SpecParts). /part/list solo devuelve
    la parte de catálogo (casi siempre SKF); las marcas equivalentes (Bosch,
    Dayco, Gates, INA, códigos OEM del fabricante, etc.) sólo aparecen ahí.
    """
    expanded: List[Dict[str, Any]] = []
    for part in all_parts[:max_parts_to_expand]:
        expanded.append({**part, "is_cross_reference": False, "base_code": part.get("code")})
        part_id = part.get("id")
        if not part_id:
            continue
        try:
            cross_refs = await service.get_part_cross_references(part_id)
        except Exception as e:
            logger.warning(f"No se pudieron obtener cruces de la parte {part_id}: {e}")
            cross_refs = []
        for cross in cross_refs:
            expanded.append({
                "category": part.get("category"),
                "product": part.get("product"),
                "brand": cross.get("brand"),
                "code": cross.get("code"),
                "oem": cross.get("oem"),
                "is_cross_reference": True,
                "base_code": part.get("code"),
                "matched_by": part.get("matched_by"),
            })
    # Partes fuera del tope, sin expandir (se listan igual, sin cruces)
    for part in all_parts[max_parts_to_expand:]:
        expanded.append({**part, "is_cross_reference": False, "base_code": part.get("code")})
    return expanded

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
            client_id=request.client_id or None,
            client_secret=request.client_secret or None
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
            
    except HTTPException:
        raise
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
    except HTTPException:
        raise
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
        
    except HTTPException:
        raise
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
                # Antes se leía vehicle_data['vehicle_code'], una clave que la API
                # nunca devuelve: enrich_vehicle_data se llamaba siempre con None.
                enriched_data = await promotive_service.enrich_vehicle_data(vehicle_code)
            except Exception as e:
                logger.warning(f"No se pudieron enriquecer los datos: {e}")
        
        # 3. Obtener partes compatibles si se solicita
        # /part/list filtra por el "id" numérico del vehículo, no por su "code"
        # (son valores distintos). Usar "code" aquí devolvía 0 o partes de otro vehículo.
        parts_vehicle_id = vehicle_data.get("id") or vehicle_data.get("code")
        compatible_parts = None
        parts_source = None  # "exact" | "engine_family" | None
        parts_info = None
        parts_detail = None
        if include_parts and parts_vehicle_id:
            try:
                all_parts = await _fetch_all_parts_for_vehicle(promotive_service, parts_vehicle_id)

                for p in all_parts:
                    p["matched_by"] = "exact"
                exact_ids = {p.get("id") for p in all_parts}

                # Solo partes que el catálogo asocia exactamente a este vehículo
                # (no se completa con vehículos hermanos: una ficha de hermano
                # puede cubrir otros motores y traer repuestos incorrectos).
                compatible_parts = await _expand_parts_with_cross_refs(promotive_service, all_parts) if all_parts else []
                parts_source = "exact" if all_parts else None
                parts_detail = []
                for p in all_parts:
                    detail = await promotive_service.get_part_detail(p.get("id")) if p.get("id") else None
                    if detail:
                        parts_detail.append({"id": p.get("id"), **detail})
                parts_info = {"exact": len(all_parts)}
            except Exception as e:
                logger.warning(f"No se pudieron obtener partes compatibles: {e}")

        # Combinar toda la información
        complete_info = {
            "basic_info": vehicle_data,
            "technical_details": enriched_data,
            "compatible_parts": compatible_parts,
            "parts_info": parts_info,
            "parts_detail": parts_detail
        }
        
        return {
            "success": True,
            "message": "Información completa del vehículo obtenida",
            "data": complete_info
        }
        
    except HTTPException:
        raise
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
        
        paging = parts_data.get("paging", {})
        
        return {
            "success": True,
            "message": "Partes compatibles obtenidas exitosamente",
            "data": parts_data.get("data", []),
            "pagination": {
                "page": page,
                "limit": limit,
                "total": paging.get("total", 0),
                "pages": paging.get("pages", 0)
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en búsqueda de partes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
