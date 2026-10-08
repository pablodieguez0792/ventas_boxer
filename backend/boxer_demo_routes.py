"""
Proxy routes para consumir la API de Boxer Demo
Base URL: https://demo.boxergestion.com
Token: se lee de BOXER_DEMO_TOKEN (.env)
"""
from fastapi import APIRouter, Query, HTTPException
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Simple in-memory cache para evitar llamadas repetidas al demo
_cache: dict = {}
CACHE_TTL = 300  # 5 minutos

import time

def _cache_get(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None

def _cache_set(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}

from pydantic import BaseModel

# ── Estado mutable (se actualiza al hacer login) ─────────────────────────────
_boxer_state = {
    "base_url": "https://demo.boxergestion.com",
    "token": os.getenv("BOXER_DEMO_TOKEN", ""),
    "username": "",
    "connected": True,  # token hardcodeado por defecto
}

TIMEOUT = 20


def _headers():
    return {
        "Authorization": f"Token {_boxer_state['token']}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


class BoxerLoginRequest(BaseModel):
    url: str = ""
    username: str
    password: str


@router.get("/api/boxer-demo/status")
def boxer_status():
    """Estado de conexión con Boxer."""
    return {
        "connected": _boxer_state["connected"],
        "base_url": _boxer_state["base_url"],
        "username": _boxer_state["username"],
        "has_token": bool(_boxer_state["token"]),
    }


@router.post("/api/boxer-demo/login")
def boxer_login(body: BoxerLoginRequest):
    """Login con credenciales propias de Boxer. Obtiene token DRF."""
    base = body.url.rstrip("/") if body.url else _boxer_state["base_url"]
    # Intentar endpoint estándar DRF
    for auth_path in ["/api-token-auth/", "/api/auth/token/", "/api/login/"]:
        try:
            r = requests.post(
                f"{base}{auth_path}",
                json={"username": body.username, "password": body.password},
                timeout=15,
            )
            if r.status_code == 200:
                data = r.json()
                token = data.get("token") or data.get("access_token") or data.get("key")
                if token:
                    _boxer_state["base_url"] = base
                    _boxer_state["token"] = token
                    _boxer_state["username"] = body.username
                    _boxer_state["connected"] = True
                    _cache.clear()  # limpiar caché con token viejo
                    return {"success": True, "message": f"Conectado a Boxer como {body.username}"}
        except Exception:
            continue
    raise HTTPException(status_code=401, detail="No se pudo autenticar con Boxer. Verificá la URL y credenciales.")


def _get(path: str, params: dict = None):
    """Helper: GET request al demo de Boxer con logging detallado."""
    url = f"{_boxer_state['base_url']}{path}"
    print(f"[BoxerDemo] GET {url} params={params}")
    try:
        resp = requests.get(url, headers=_headers(), params=params, timeout=TIMEOUT)
        print(f"[BoxerDemo] Status {resp.status_code} - {len(resp.content)} bytes")
        if resp.status_code >= 400:
            print(f"[BoxerDemo] Error body: {resp.text[:500]}")
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        print(f"[BoxerDemo] TIMEOUT para {url}")
        raise HTTPException(status_code=504, detail="Timeout al conectar con Boxer Demo")
    except requests.exceptions.ConnectionError as e:
        print(f"[BoxerDemo] CONNECTION ERROR: {e}")
        raise HTTPException(status_code=502, detail="No se pudo conectar con Boxer Demo")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error Boxer API {e.response.status_code}: {e.response.text[:300]}"
        )
    except Exception as e:
        print(f"[BoxerDemo] Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# DIAGNÓSTICO - ver respuesta cruda
# ─────────────────────────────────────────────
@router.get("/api/boxer-demo/debug")
def debug_boxer(path: str = Query(default="/api/proveedor/lista/")):
    """Devuelve la respuesta cruda de cualquier endpoint de Boxer Demo (para debugging)."""
    url = f"{BOXER_BASE}{path}"
    try:
        resp = requests.get(url, headers=HEADERS, params={"q": "", "page": 1, "blank": 1}, timeout=TIMEOUT)
        return {
            "status_code": resp.status_code,
            "url": url,
            "raw_keys": list(resp.json().keys()) if resp.ok else None,
            "raw_preview": resp.text[:2000],
        }
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────────
# PROVEEDORES
# ─────────────────────────────────────────────
@router.get("/api/boxer-demo/proveedores")
def get_proveedores(
    q: str = Query(default=""),
    page: int = Query(default=1),
):
    """Lista proveedores desde Boxer Demo con paginación."""
    cache_key = f"proveedores:{q}:{page}"
    cached = _cache_get(cache_key)
    if cached:
        print(f"[BoxerDemo] Cache hit: {cache_key}")
        return cached
    data = _get("/api/proveedor/lista/", params={"q": q, "page": page, "blank": 1})

    # Estructura real: {"data": {"proveedores": [...], "num_pages": N, "num_items": N}}
    inner = data.get("data") if isinstance(data, dict) else None
    if isinstance(inner, dict):
        raw_provs = inner.get("proveedores", [])
        num_pages_prov = inner.get("num_pages", 1)
    elif isinstance(data, list):
        raw_provs = data
        num_pages_prov = 1
    else:
        raw_provs = []
        num_pages_prov = 1

    print(f"[BoxerDemo] Proveedores raw: {len(raw_provs)}")

    proveedores = []
    for p in raw_provs:
        proveedores.append({
            "id": p.get("idProveedor"),
            "nombre": p.get("razonSocial") or p.get("alias") or "",
            "alias": p.get("alias") or "",
            "cuit": p.get("CUIT") or "",
            "telefono": p.get("telefonoContacto") or "",
            "email": p.get("correoElectronico") or "",
            "activo": p.get("activo", True),
        })

    result = {
        "total": len(proveedores),
        "page": page,
        "proveedores": proveedores,
    }
    _cache_set(cache_key, result)
    return result


# ─────────────────────────────────────────────
# ARTÍCULOS
# ─────────────────────────────────────────────
@router.get("/api/boxer-demo/articulos")
def get_articulos(
    q: str = Query(default=""),
    page: int = Query(default=1),
    proveedor_id: str = Query(default=""),
    stock: int = Query(default=0),
    sin_stock: int = Query(default=0),
    cargados: int = Query(default=0),
):
    """Lista / busca artículos desde Boxer Demo. Requiere q mínimo 2 caracteres.
    cargados=1 devuelve solo artículos propios (con stock propio); 0 el catálogo de proveedores."""
    if not q or len(q.strip()) < 2:
        return {"total": 0, "num_pages": 1, "page": page, "articulos": []}
    cache_key = f"articulos:{q.strip()}:{page}:{proveedor_id}:{cargados}"
    cached = _cache_get(cache_key)
    if cached:
        print(f"[BoxerDemo] Cache hit: {cache_key}")
        return cached
    params = {
        "q": q,
        "page": page,
        "cargados": cargados,
        "stock": stock,
        "sin_stock": sin_stock,
        "tiene_meli": 0,
        "con_sucursal": 1 if cargados else 0,
        "filter": 1,
        "solo_mismo_proveedor": 0,
        "offset_piezas": 0,
        "fraccionar_precio": 1,
    }
    if proveedor_id:
        params["proveedor"] = proveedor_id

    data = _get("/api/articulos/list/0/", params=params)

    # Normalizar wrapper
    raw_items = []
    num_pages = 1
    total = 0
    if isinstance(data, list):
        raw_items = data
        total = len(raw_items)
    elif isinstance(data, dict):
        inner = data.get("data", data)
        if isinstance(inner, dict):
            raw_items = inner.get("items", [])
            num_pages = inner.get("num_pages", 1)
            total = inner.get("count", len(raw_items))
        elif isinstance(inner, list):
            raw_items = inner
            total = len(raw_items)
        # else: defaults already set

    articulos = []
    for a in raw_items:
        precios = a.get("precios") or {}
        sucursal = a.get("repuesto_sucursal") or {}
        marca_raw = a.get("marca")
        if isinstance(marca_raw, dict):
            marca_str = marca_raw.get("nombre") or ""
        else:
            marca_str = str(marca_raw) if marca_raw else ""
        marca_str = a.get("marca_nombre") or marca_str

        # vat_type puede ser dict o string
        vat_raw = a.get("vat_type")
        if isinstance(vat_raw, dict):
            iva_pct = int(round(float(vat_raw.get("percent", 0.21)) * 100))
        elif isinstance(vat_raw, str):
            iva_pct = 0 if "exento" in vat_raw else 21
        else:
            iva_pct = 21

        articulos.append({
            "id": a.get("idRepuestoProveedor") or a.get("idArticulo") or a.get("id"),
            # codProveedor es el código real del artículo en el sistema del proveedor
            "articulo": a.get("codProveedor") or a.get("codInterno") or "",
            "original": a.get("codOriginal") or "—",
            "auxiliar": a.get("codAuxiliar") or a.get("codigo_auxiliar_2") or "—",
            "auxiliar2": a.get("codigo_auxiliar_2") or "—",
            "auxiliar3": a.get("codigo_auxiliar_3") or "—",
            "descripcion": a.get("descripcionProveedor") or a.get("descripcion") or a.get("nombre") or "",
            "marca": marca_str or "—",
            "rubro": (a.get("rubro") or {}).get("nombre") if isinstance(a.get("rubro"), dict) else (a.get("rubro") or "—"),
            "subrubro": (a.get("sub_rubro") or {}).get("nombre") if isinstance(a.get("sub_rubro"), dict) else (a.get("sub_rubro") or "—"),
            "proveedor": a.get("alias_proveedor") or a.get("proveedor") or "",
            "idProveedor": a.get("idProveedor"),
            "precioVenta": float(precios.get("venta") or a.get("precioVenta") or 0),
            "precioLista": float(precios.get("lista") or a.get("precioLista") or 0),
            "precioCosto": float(precios.get("costo") or a.get("precioCosto") or 0),
            # stockDisponible es el campo correcto (no "stock")
            "stock": float(sucursal.get("stockDisponible") or sucursal.get("stock") or a.get("stock") or 0),
            "iva": iva_pct,
            "activo": a.get("activo", True),
            "fecha_ultima_venta": a.get("fecha_ultima_venta"),
            "fecha_ultima_compra": a.get("fecha_ultima_compra"),
            "precio_actualizado_at": a.get("pricelist_provider_updated_at"),
            "tipo_descuento": a.get("tipo_descuento") or [],
            "lista_precios": a.get("lista_precios") or [],
            "observaciones": a.get("observaciones") or [],
            "identificador_proveedor": a.get("identificador_proveedor"),
            "numero_proveedor": a.get("numero_proveedor"),
            "meli_publicacion": a.get("meli_publicacion", False),
            "woo_vinculacion": a.get("woo_vinculacion", False),
        })

    print(f"[BoxerDemo] Artículos mapeados: {len(articulos)} (total={total}, pages={num_pages})")
    result = {
        "total": total,
        "num_pages": num_pages,
        "page": page,
        "articulos": articulos,
    }
    _cache_set(cache_key, result)
    return result
