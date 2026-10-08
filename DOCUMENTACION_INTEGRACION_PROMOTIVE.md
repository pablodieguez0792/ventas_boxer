# Integración Boxer - Promotive / SpecParts: cómo ingresamos y consultamos

Documento para el desarrollador de Promotive. Describe el flujo completo que usa hoy el sistema Boxer (backend FastAPI + frontend React) contra la API externa de SpecParts, con el código real.

## 1. Resumen

Boxer permite consultar un vehículo por **VIN (chasis)** o **patente** y mostrar los repuestos que SpecParts asocia a ese vehículo, con la ficha completa de cada parte. El flujo es:

1. Autenticación OAuth (client_id / client_secret) y token Bearer.
2. Identificación del vehículo: `GET /vehicle/identification` (por `vin` o `plate`).
3. Datos técnicos: `GET /vehicle/list` (por `code` del vehículo).
4. Partes del vehículo: `GET /part/list` (filtro `vehicle_id` = `id` devuelto en el paso 2).
5. Ficha completa de cada parte: `GET /single-part/{id}?output=v1`.
6. Se arma la respuesta y el frontend la muestra (tabla de partes + ficha completa).

Hosts utilizados:
- Auth: `https://auth.specparts.ai/oauth`
- API: `https://external-api.specparts.ai`

Las credenciales se guardan en el `.env` del backend (`PROMOTIVE_CLIENT_ID`, `PROMOTIVE_CLIENT_SECRET`, `PROMOTIVE_BASE_URL`, `PROMOTIVE_AUTH_URL`) o se ingresan desde la pantalla "Conexiones > Promotive". Nunca se envían al navegador.

## 2. Arquitectura

```
Navegador (React, /api/promotive/*)
   |  proxy dev (puerto 3001 -> 8000)
   v
Backend FastAPI (backend/promotive_routes.py)
   |  PromotiveAPIService (backend/promotive_api_service.py)
   v
auth.specparts.ai  /  external-api.specparts.ai
```

Archivos involucrados:
- `backend/promotive_api_service.py`: cliente HTTP de SpecParts (token, llamadas, caché en disco).
- `backend/promotive_routes.py`: endpoints propios de Boxer (`/api/promotive/...`).
- `backend/promotive_cross_cache.json`: caché en disco de fichas `single-part` (14 días).
- `frontend/src/pages/conexiones/PromotiveAPI.js`: pantalla de consulta.

## 3. Proceso paso a paso

### 3.1 Login / token

El usuario (o el backend) hace `POST https://auth.specparts.ai/oauth` con `client_id` y `client_secret` en JSON. Se guarda `access_token` en memoria. Si una llamada devuelve 401/403 se reautentica una vez y se reintenta.

```python
async def authenticate(self) -> bool:
    payload = {"client_id": self.client_id, "client_secret": self.client_secret}
    response = requests.post(self.auth_url, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    self.access_token = data.get("access_token")
    expires_in = data.get("expires_in", 3600)
    self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
    return True
```

Headers de las siguientes llamadas:

```python
{"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
```

Nota para Promotive: la respuesta documentada trae `ttl` (timestamp) y no `expires_in`; hoy asumimos 1 hora de validez y reautenticamos ante 401/403.

### 3.2 Identificación del vehículo (VIN o patente)

`GET /vehicle/identification?vin=<VIN>` o `?plate=<PATENTE>` (se envía en mayúsculas, solo uno de los dos).

```python
params = {"plate": plate.strip().upper()} if plate else {"vin": vin.strip().upper()}
response = requests.get(f"{self.base_url}/vehicle/identification",
                        params=params, headers=self._get_headers(), timeout=30)
if response.status_code == 404:
    return None  # vehículo no encontrado
response.raise_for_status()
return response.json()
```

Ejemplo real de respuesta (VIN WVWMG61K7CW244150):

```json
{
  "id": 2949, "code": "2958", "brand": "VOLKSWAGEN", "master_model": "GOLF",
  "model": "GOLF VI", "version": "2.0 TSI", "engine_code": "EA888 CCZA",
  "engine_family": "EA888", "sold_from_year": 2011, "sold_until_year": 2014
}
```

Importante: `id` (2949) y `code` (2958) son valores distintos. Usamos:
- `id` como filtro `vehicle_id` en `/part/list`.
- `code` como `code` en `/vehicle/list` y para comparar con el `code` de los vehículos que trae `single-part`.

### 3.3 Datos técnicos del vehículo

```python
params = {"lang": 1, "code": vehicle_code, "limit": 100}
response = requests.get(f"{self.base_url}/vehicle/list", params=params,
                        headers=self._get_headers(), timeout=30)
data = response.json()
return data["data"][0] if data.get("data") else None
```

### 3.4 Partes del vehículo

`GET /part/list` con `vehicle_id` = `id` del paso 3.2 (el nombre correcto del filtro es `vehicle_id`; con `vehicle_id[]` la API lo ignora y devuelve el catálogo completo). Se recorren todas las páginas.

```python
params = {"lang": 1, "vehicle_id": vehicle_id, "page": page, "limit": min(limit, 100)}
response = requests.get(f"{self.base_url}/part/list", params=params,
                        headers=self._get_headers(), timeout=30)
```

```python
async def _fetch_all_parts_for_vehicle(service, vehicle_id, max_pages=50):
    all_parts, page = [], 1
    while True:
        data = await service.get_compatible_parts(str(vehicle_id), page=page, limit=100)
        batch = data.get("data", [])
        all_parts.extend(batch)
        total_pages = data.get("paging", {}).get("pages", 1)
        if not batch or page >= total_pages or page >= max_pages:
            break
        page += 1
    return all_parts
```

Para el VIN de ejemplo devuelve 3 partes: `SKF VKPC 81242` (bomba de agua, id 39269), `SKF VKDS 6196 A` (rótula, id 71012) y `SKF VKC 2195` (crapodina de embrague, id 71540).

### 3.5 Ficha completa de cada parte (single-part)

`GET /single-part/{id}?output=v1`, donde `{id}` es el `id` de cada parte de `/part/list`. Devuelve: marca, código, categoría, producto, descripción, observación, EAN, medidas de embalaje, fotos, atributos, componentes, links, referencias cruzadas (`cross`), vehículos compatibles (`vehicles`) y el contador `requests` (`total`, `left`).

Como cada llamada consume cupo mensual, se cachea en disco 14 días:

```python
async def get_part_detail(self, part_id):
    cache = self._load_cross_cache()
    key = f"detail:{part_id}"
    cached = cache.get(key)
    if cached and datetime.now() - datetime.fromisoformat(cached["fetched_at"]) < timedelta(days=14):
        return cached["detail"]
    response = requests.get(f"{self.base_url}/single-part/{part_id}",
                            params={"output": "v1"}, headers=self._get_headers(), timeout=30)
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
```

### 3.6 Endpoint de Boxer que une todo

`GET /api/promotive/vehicle/complete?vin=...&include_parts=true` (o `plate=`):

1. Identifica el vehículo (3.2).
2. Obtiene datos técnicos (3.3).
3. Trae las partes exactas del vehículo (3.4).
4. Por cada parte pide la ficha (3.5) y arma:
   - `compatible_parts`: filas planas para la tabla (parte base + una fila por referencia cruzada, con `is_cross_reference`, `oem`, `base_code`).
   - `parts_detail`: ficha completa de cada parte.
   - `parts_info`: recuento (`exact`).

```python
all_parts = await _fetch_all_parts_for_vehicle(promotive_service, parts_vehicle_id)
for p in all_parts:
    p["matched_by"] = "exact"
compatible_parts = await _expand_parts_with_cross_refs(promotive_service, all_parts)
parts_detail = []
for p in all_parts:
    detail = await promotive_service.get_part_detail(p["id"])
    if detail:
        parts_detail.append({"id": p["id"], **detail})
```

Expansión de referencias cruzadas (cada marca equivalente / OEM del campo `cross` pasa a ser una fila):

```python
for cross in cross_refs:
    expanded.append({
        "category": part.get("category"), "product": part.get("product"),
        "brand": cross.get("brand"), "code": cross.get("code"), "oem": cross.get("oem"),
        "is_cross_reference": True, "base_code": part.get("code"),
        "matched_by": part.get("matched_by"),
    })
```

### 3.7 Frontend

`PromotiveAPI.js` llama a `/api/promotive/vehicle/complete` y muestra:
- Datos del vehículo identificado y datos técnicos.
- "Ficha completa de las partes": fotos, atributos, cruces, EAN, links, componentes y si el vehículo consultado figura entre los compatibles.
- Tabla de partes con botón "Buscar en Boxer" por código, que consulta nuestro stock (`/api/products/check-code?code=...&brand=...`).

## 4. Endpoints de SpecParts que usamos y consumo

| Endpoint | Uso |
|---|---|
| `POST auth.specparts.ai/oauth` | Token |
| `GET /vehicle/identification` | VIN / patente a vehículo (cupo mensual: 1.000) |
| `GET /vehicle/list` | Datos técnicos por `code` |
| `GET /part/list` | Partes por `vehicle_id` |
| `GET /single-part/{id}?output=v1` | Ficha completa de la parte (cupo aparte, caché 14 días) |

No usamos `part-vehicle/list` ni `part/list-test`.

## 4 bis. Caso real: chasis WVWMG61K7CW244150 (problemas detectados)

### Vehículo identificado (`/vehicle/identification?vin=WVWMG61K7CW244150`)

VOLKSWAGEN GOLF VI 2.0 TSI, motor EA888 CCZA, familia EA888, 2011-2014. `id` 2949, `code` 2958.

### Problema 1: solo 3 artículos para el vehículo

`GET /part/list?vehicle_id=2949` devuelve `total: 3` (todos SKF):

| id | Marca | Código | Categoría | Producto |
|---|---|---|---|---|
| 39269 | SKF | VKPC 81242 | Sistema de refrigeración | Bomba de agua |
| 71012 | SKF | VKDS 6196 A | Sistema de suspensión | Rótula de suspensión |
| 71540 | SKF | VKC 2195 | Sistema de embrague | Crapodina mecánica de embrague |

Para un Golf VI 2.0 TSI el catálogo debería asociar muchos más repuestos (filtros, correa/cadena, bujías, frenos, etc.). Además, `GET /part/list?vehicle_id=2958` (usando el `code` en lugar del `id`) devuelve `total: 0`. La ficha `single-part/39269` sí lista este vehículo entre sus compatibles (`code: 2958`, GOLF VI, 2.0 TSI, EA888 CCZA), por lo que la relación existe pero el catálogo está muy incompleto para este vehículo.

### Problema 2: referencias cruzadas con códigos que no corresponden

`single-part/39269` (SKF VKPC 81242, bomba de agua) trae en `cross` (32 códigos), entre otros:

- `06H 121 026 AF / AG / BA / CF / CQ / DD` (marcas Audi, Seat, Volkswagen y OEM): corresponden a la bomba de agua del 2.0 TFSI/TSI EA888. Correctos para este vehículo.
- `06B 121 011 M` y `06B 121 011 MX` (Audi, Seat, Volkswagen y OEM): corresponden a una bomba de otro motor (anterior). **No son correctos para este modelo** según nuestra validación comercial, pero SpecParts los entrega como equivalentes sin ninguna marca de aplicabilidad.
- Equivalentes aftermarket: `DOLZ A221`, `VMG BA549`, `VMG BA736`.

Los códigos OEM no traen información adicional: `single-part/1341163` (VOLKSWAGEN 06B 121 011 M) devuelve `vehicles: []` y `cross: []`, por lo que no podemos validar por API a qué vehículos aplica cada cruce. Además `part-vehicle/list` devuelve `{}` con los parámetros que probamos.

### Problema 3: partes de otros modelos/motores (TDI, 1.8T) al usar la familia de motor

Como el catálogo trae pocas partes, probamos completar con vehículos de la misma familia de motor:

1. `GET /vehicle/list?lang=1&engine_family=EA888` devuelve 35 `vehicle_ids` (2603, 2836, 2892, 2900, 2901, 2949, ...).
2. Para cada uno consultamos `GET /part/list?vehicle_id=<id>`.

Resultado: los vehículos 2836, 2892 y 2900 (dentro de la "familia EA888") devuelven bombas de agua de **otros motores**:

| Vehículo (id) | Bomba SKF | Códigos OEM de los cruces | Motor al que corresponden |
|---|---|---|---|
| 2836 | VKPC 81626 / 81626 A | 038 121 011 G/JX, 038 121 119, 03L 121 011 B/BX, 045 121 011 H/HX, 06A 121 119 | 1.9 TDI/SDI, 2.0 TDI, 1.8T, 1.4 |
| 2892 | VKPC 81205 | 06F 121 011 / 06F 121 011 X | 2.0 FSI/TFSI (generación EA113) |
| 2900 | VKPC 81269 | 03L 121 011 J / JX | 2.0 TDI |

Es decir, una ficha de vehículo del filtro `engine_family=EA888` agrupa varias versiones y motores, por lo que `part/list` devuelve repuestos TDI y 1.8T para un TSI. Por eso **descartamos el uso de la familia de motor** y hoy mostramos únicamente las 3 partes exactas del `vehicle_id`.

### Qué necesitamos que nos confirmen

- Si la cobertura de 3 partes para el vehículo 2949 es la esperada o si falta cargar datos.
- Cómo validar qué cruces OEM aplican a cada vehículo (para descartar `06B 121 011 M/MX`).
- Cómo obtener un identificador de motor más fino que `engine_family`, para no mezclar EA888 con TDI y 1.8T.

## 5. Dataset de mapeo (marca + código a ref_id)

Tenemos descargado `specparts_part_dataset.csv` (1,38 millones de filas, columnas `brand, code, ref_id`). Todavía no está integrado al sistema. Plan: importarlo a una tabla SQLite local, asignar a cada artículo de Boxer su `ref_id`, consultar `single-part/{ref_id}` una vez por artículo y guardar los códigos de vehículo compatibles. Así, al consultar un VIN, se devuelven nuestros artículos que tienen el `code` de ese vehículo.

## 6. Consultas para el desarrollador de Promotive

1. **Aplicaciones pieza-vehículo (`part-vehicle/list`):** probamos `part_id` e `id` (con y sin `lang` y `limit`) y devuelve `{}` vacío. ¿Cuáles son los parámetros correctos? Lo necesitamos para saber si una pieza o un código OEM aplica a un vehículo.
2. **Códigos OEM sin vehículos:** al consultar `single-part` con el `ref_id` de un código OEM (por ejemplo `VOLKSWAGEN 06B 121 011 M`, ref_id 1341163) devuelve `vehicles: []` y `cross: []`. Para el Golf VI 2.0 TSI EA888 (code 2958) la bomba SKF `VKPC 81242` lista entre sus cruces `06B 121 011 M/MX` y `06H 121 026 ...`, pero nos indican que el `06B` no es correcto para ese modelo. ¿Hay forma de saber qué cruces OEM aplican a qué vehículo?
3. **Pocas partes por vehículo:** para ese VIN (`vehicle_id` 2949) `part/list` devuelve solo 3 partes, todas de SKF. ¿Es cobertura esperada del catálogo?
4. **Familia de motor:** `vehicle/list?engine_family=EA888` devuelve fichas de vehículo que agrupan varios motores (se mezclan EA888 con 1.8T y TDI), por lo que no sirve para inferir partes por motor. ¿Hay un identificador más fino?
5. **Token:** la respuesta trae `ttl` y no `expires_in`. ¿`ttl` es un timestamp Unix de expiración?
6. **Cupo:** ¿se descuentan los reintentos con 401/403? ¿Y las consultas de VIN repetidas? Hoy cacheamos `single-part` pero no `vehicle/identification`.

## 7. Seguridad

- `client_id` y `client_secret` viven en el `.env` del backend (no se versiona) y en memoria del proceso.
- El navegador solo ve los resultados; el token Bearer nunca sale del backend.
