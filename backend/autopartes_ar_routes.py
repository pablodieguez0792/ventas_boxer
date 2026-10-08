"""
Autopartes AR — proxy routes hacia http://147.79.81.127:3080
Token: JWT HS256, renovable vía POST /api/auth/login {username, password}
"""
import os
import time
import requests
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/autopartes-ar", tags=["Autopartes AR"])

BASE_URL = "http://147.79.81.127:3080"

# ── Estado en memoria ───────────────────────────────────────────────────────
_state = {
    "token": os.getenv(
        "AUTOPARTES_AR_TOKEN",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        ".eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc3ODI1ODY2NCwiaWF0IjoxNzc4MTcyMjY0fQ"
        ".fpZ6X7SMWyk1yZXPbkrspNJwZz0y9d0VyCy38fiddj8"
    ),
    "username": os.getenv("AUTOPARTES_AR_USERNAME", "admin"),
    "password": os.getenv("AUTOPARTES_AR_PASSWORD", "autopartes2026"),
    "token_exp": 0,  # se renueva automáticamente en el primer uso
}

TIMEOUT = 40


# ── Helpers ─────────────────────────────────────────────────────────────────

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_state['token']}",
        "Accept": "application/json",
    }


def _token_is_valid() -> bool:
    """True si el token no expiró con 60s de margen."""
    return _state["token_exp"] > time.time() + 60


def _jwt_exp(token: str) -> float:
    """Extrae el campo 'exp' del payload JWT sin verificar firma (base64 manual)."""
    import base64, json as _json
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return time.time() + 86400
        padding = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload = _json.loads(base64.urlsafe_b64decode(padding))
        return float(payload.get("exp", time.time() + 86400))
    except Exception:
        return time.time() + 86400


def _refresh_token() -> bool:
    """Llama al login con las credenciales almacenadas. Retorna True si OK."""
    if not _state["password"]:
        return False
    try:
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": _state["username"], "password": _state["password"]},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            data = r.json()
            new_token = data.get("access_token") or data.get("token")
            if new_token:
                _state["token_exp"] = _jwt_exp(new_token)
                _state["token"] = new_token
                return True
    except Exception as e:
        print(f"[AutopartesAR] refresh error: {e}")
    return False


def _get(path: str, params: dict = None):
    """GET con auto-refresh si el token expiró."""
    if not _token_is_valid():
        _refresh_token()
    r = requests.get(f"{BASE_URL}{path}", headers=_headers(), params=params, timeout=TIMEOUT)
    if r.status_code == 401:
        if _refresh_token():
            r = requests.get(f"{BASE_URL}{path}", headers=_headers(), params=params, timeout=TIMEOUT)
    return r


# ── Modelos ──────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/status")
def status():
    valid = _token_is_valid()
    return {
        "connected": bool(_state["token"]),
        "token_valid": valid,
        "token_exp": _state["token_exp"],
        "has_credentials": bool(_state["password"]),
        "base_url": BASE_URL,
    }


@router.post("/login")
def login(body: LoginRequest):
    _state["username"] = body.username
    _state["password"] = body.password
    ok = _refresh_token()
    if ok:
        return {"success": True, "message": "Conectado a Autopartes AR"}
    raise HTTPException(status_code=401, detail="Credenciales inválidas para Autopartes AR")


@router.get("/search")
def search(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        r = _get("/api/autopartes/search/", params={"q": q, "limit": limit, "offset": offset})
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="No se puede conectar a Autopartes AR (147.79.81.127:3080)")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout al conectar con Autopartes AR")

    if r.status_code == 401:
        raise HTTPException(status_code=401, detail="Token expirado. Reconectá desde Conexiones → Autopartes AR.")
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=f"Autopartes AR error: {r.text[:200]}")

    data = r.json()
    items = data.get("items") or data.get("results") or []

    mapped = []
    for a in items:
        fabricante = a.get("fabricante") or {}
        categoria = a.get("categoria") or {}
        precios = a.get("precios") or []
        proveedores_raw = a.get("proveedores") or []
        oem = a.get("oem_numbers") or []
        completitud = a.get("completitud_desglose") or {}

        precio_lista = None
        precio_descuento = None
        proveedor_nombre = None
        moneda = "ARS"
        if precios:
            p = precios[0]
            precio_lista = p.get("precio_lista")
            precio_descuento = p.get("precio_descuento")
            moneda = p.get("moneda", "ARS")
            prov_p = p.get("proveedor") or {}
            proveedor_nombre = prov_p.get("nombre")

        proveedores = [
            {
                "nombre": (pv.get("proveedor") or {}).get("nombre"),
                "codigo": pv.get("codigo_proveedor"),
                "url": pv.get("articulo_url"),
            }
            for pv in proveedores_raw
        ]

        mapped.append({
            "id": a.get("id"),
            "codigo_fabricante": a.get("codigo_fabricante"),
            "oem_numbers": oem,
            "nombre": a.get("nombre"),
            "image_url": a.get("image_url"),
            "es_original": a.get("es_original", False),
            "tipo_pieza": a.get("tipo_pieza"),
            "fabricante": fabricante.get("nombre"),
            "fabricante_es_oem": fabricante.get("es_oem", False),
            "categoria": categoria.get("nombre"),
            "proveedores": proveedores,
            "precio_lista": precio_lista,
            "precio_descuento": precio_descuento,
            "moneda": moneda,
            "stock_resumen": a.get("stock_resumen"),
            "completitud_score": a.get("completitud_score", 0),
            "completitud": completitud,
            "vehicle_detected": data.get("vehicle_detected"),
        })

    return {
        "total": data.get("total", len(mapped)),
        "items": mapped,
        "vehicle_detected": data.get("vehicle_detected"),
        "search_terms_used": data.get("search_terms_used"),
    }


@router.get("/detail/{article_id}")
def detail(article_id: str):
    """Obtiene el detalle completo de un artículo por su UUID interno."""
    try:
        r = _get(f"/api/autopartes/id/{article_id}")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="No se puede conectar a Autopartes AR")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout al conectar con Autopartes AR")

    if r.status_code == 401:
        raise HTTPException(status_code=401, detail="Token expirado.")
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Artículo {article_id} no encontrado")
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=f"Autopartes AR error: {r.text[:200]}")

    a = r.json()
    if not isinstance(a, dict):
        raise HTTPException(status_code=502, detail=f"Respuesta inesperada de Autopartes AR (tipo {type(a).__name__})")
    fabricante = a.get("fabricante") or {}
    categoria = a.get("categoria") or {}
    precios = a.get("precios") or []
    proveedores_raw = a.get("proveedores") or []
    oem = a.get("oem_numbers") or []
    completitud = a.get("completitud_desglose") or {}
    # Compatibilidades de vehículos (nombre real del campo)
    compatibilidades = a.get("compatibilidades") or []
    # Equivalencias / cross-refs de otras marcas
    equivalencias = a.get("equivalencias") or []
    # Imágenes: array de {url_original, tipo, orden}
    imagenes_raw = a.get("imagenes") or []
    imagenes = [
        {"url": img.get("url_original") or img.get("path_local"), "tipo": img.get("tipo"), "orden": img.get("orden")}
        for img in imagenes_raw
        if img.get("url_original") or img.get("path_local")
    ]
    # Atributos: dict {clave: valor} + dimensiones en root
    atributos_dict = a.get("atributos") or {}
    dimensiones = {
        k: a.get(k)
        for k in ["peso_kg", "largo_mm", "ancho_mm", "alto_mm", "diametro_mm"]
        if a.get(k) is not None
    }
    # Unificar atributos + dimensiones como lista de {nombre, valor}
    especificaciones = (
        [{"nombre": k, "valor": str(v)} for k, v in atributos_dict.items() if v is not None]
        + [{"nombre": k.replace("_", " "), "valor": str(v)} for k, v in dimensiones.items()]
    )
    # Aplicaciones de vehículo desde compatibilidades
    aplicaciones = [
        {
            "marca": c.get("marca_vehiculo"),
            "modelo": c.get("modelo_vehiculo"),
            "version": c.get("version_vehiculo"),
            "anio_desde": c.get("anio_desde"),
            "anio_hasta": c.get("anio_hasta"),
            "motor": c.get("motor_codigo"),
        }
        for c in compatibilidades
    ]

    precio_lista = None
    precio_descuento = None
    moneda = "ARS"
    if precios:
        p = precios[0]
        precio_lista = p.get("precio_lista")
        precio_descuento = p.get("precio_descuento")
        moneda = p.get("moneda", "ARS")

    proveedores = [
        {
            "nombre": (pv.get("proveedor") or {}).get("nombre"),
            "codigo": pv.get("codigo_proveedor"),
            "url": pv.get("articulo_url"),
        }
        for pv in proveedores_raw
    ]

    image_url = imagenes[0]["url"] if imagenes else None

    return {
        "id": a.get("id"),
        "codigo_fabricante": a.get("codigo_fabricante"),
        "oem_numbers": oem,
        "nombre": a.get("nombre"),
        "descripcion": a.get("descripcion"),
        "image_url": image_url,
        "imagenes": imagenes,
        "es_original": a.get("es_original", False),
        "tipo_pieza": a.get("tipo_pieza"),
        "fabricante": fabricante.get("nombre"),
        "fabricante_logo": fabricante.get("image_url"),
        "fabricante_es_oem": fabricante.get("es_oem", False),
        "categoria": (categoria.get("nombre") if isinstance(categoria, dict) else None),
        "proveedores": proveedores,
        "equivalencias": [
            {"codigo": eq.get("codigo_fabricante"), "nombre": eq.get("nombre"), "fabricante": (eq.get("fabricante") or {}).get("nombre")}
            for eq in equivalencias
        ],
        "precio_lista": precio_lista,
        "precio_descuento": precio_descuento,
        "moneda": moneda,
        "completitud_score": a.get("completitud_score", 0),
        "completitud": completitud,
        "aplicaciones": aplicaciones,
        "especificaciones": especificaciones,
    }
