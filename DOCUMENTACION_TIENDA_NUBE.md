# DOCUMENTACIÓN TÉCNICA - INTEGRACIÓN TIENDA NUBE
## Sistema Ventas Boxer

---

## ÍNDICE

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Autenticación OAuth 2.0](#autenticación-oauth-20)
4. [Estructura del Backend](#estructura-del-backend)
5. [Estructura del Frontend](#estructura-del-frontend)
6. [API Endpoints Disponibles](#api-endpoints-disponibles)
7. [Funcionalidad: Agregar Producto](#funcionalidad-agregar-producto)
8. [Funcionalidad: Sincronizar Stock](#funcionalidad-sincronizar-stock)
9. [Flujos de Datos](#flujos-de-datos)
10. [Manejo de Errores](#manejo-de-errores)
11. [Consideraciones Técnicas](#consideraciones-técnicas)

---

## INTRODUCCIÓN

### Objetivo
Esta integración permite conectar el sistema Ventas Boxer con la plataforma de e-commerce Tienda Nube, facilitando la gestión de productos, precios, stock y órdenes de manera centralizada.

### Tecnologías Utilizadas
- **Backend**: Python 3.12, FastAPI
- **Frontend**: React 18, Material-UI
- **API**: Tienda Nube REST API v1
- **Autenticación**: OAuth 2.0
- **Formato de datos**: JSON
- **Protocolo**: HTTPS

### Credenciales de la Aplicación
```json
{
  "client_id": "17976",
  "client_secret": "<CLIENT_SECRET>",
  "store_id": "6256320",
  "redirect_uri": "http://localhost:5000/callback"
}
```

---

## ARQUITECTURA DEL SISTEMA

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Configuración│  │   Agregar    │  │ Sincronizar  │      │
│  │              │  │   Producto   │  │    Stock     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTP/JSON
┌───────────────────────────┼──────────────────────────────────┐
│                      BACKEND (FastAPI)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              tiendanube_routes.py                     │   │
│  │  - GET /api/tiendanube/status                        │   │
│  │  - GET /api/tiendanube/products                      │   │
│  │  - POST /api/tiendanube/products                     │   │
│  │  - PUT /api/tiendanube/products/{id}/variants/{id}   │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │           tiendanube_service.py                       │   │
│  │  - Gestión de tokens                                 │   │
│  │  - Llamadas a API de Tienda Nube                     │   │
│  │  - Manejo de errores                                 │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │           tiendanube_config.py                        │   │
│  │  - Configuración de credenciales                     │   │
│  │  - URLs de API                                       │   │
│  │  - Gestión de archivos de token                     │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS/JSON
┌───────────────────────────▼──────────────────────────────────┐
│                  TIENDA NUBE API v1                          │
│              https://api.tiendanube.com/v1                   │
└──────────────────────────────────────────────────────────────┘
```

### Archivos del Sistema

#### Backend
```
backend/
├── tiendanube_config.py      # Configuración y credenciales
├── tiendanube_service.py     # Lógica de negocio y API calls
├── tiendanube_routes.py      # Endpoints FastAPI
├── tiendanube_token.json     # Token de acceso (generado)
└── main.py                   # Registro de routers
```

#### Frontend
```
frontend/src/pages/conexiones/
└── TiendaNubeAPI.js          # Componente React principal
```

---

## AUTENTICACIÓN OAUTH 2.0

### Flujo de Autenticación

```
1. Usuario solicita autenticación
   ↓
2. Sistema genera URL de autorización
   URL: https://www.tiendanube.com/apps/authorize
   Parámetros:
   - client_id: 17976
   - redirect_uri: http://localhost:5000/callback
   - response_type: code
   - scope: read_products,write_products,...
   ↓
3. Usuario autoriza en Tienda Nube
   ↓
4. Tienda Nube redirige con código
   Callback: http://localhost:5000/callback?code=XXXXX
   ↓
5. Sistema intercambia código por token
   POST https://www.tiendanube.com/apps/authorize/token
   Body: {
     "client_id": "17976",
     "client_secret": "ab343a...",
     "grant_type": "authorization_code",
     "code": "XXXXX"
   }
   ↓
6. Tienda Nube responde con token
   Response: {
     "access_token": "<ACCESS_TOKEN>",
     "token_type": "bearer",
     "scope": "read_products,write_products,...",
     "user_id": 6256320
   }
   ↓
7. Sistema guarda token en tiendanube_token.json
```

### Código de Autenticación

**Backend - tiendanube_service.py:**
```python
def get_auth_url(self):
    """Genera la URL de autenticación"""
    params = {
        'client_id': self.config['client_id'],
        'redirect_uri': self.config['redirect_uri'],
        'response_type': 'code',
        'scope': ','.join(self.config['scopes'])
    }
    query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
    return f"{AUTH_URL}?{query_string}"

def exchange_code_for_token(self, code):
    """Intercambia el código por un token"""
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
    return token_data
```

### Scopes (Permisos)

| Scope | Descripción |
|-------|-------------|
| `read_products` | Leer productos |
| `write_products` | Crear/modificar productos |
| `read_orders` | Leer órdenes |
| `write_orders` | Crear/modificar órdenes |
| `read_customers` | Leer clientes |
| `write_customers` | Crear/modificar clientes |
| `read_content` | Leer contenido |
| `write_content` | Crear/modificar contenido |

### Almacenamiento del Token

**Archivo: tiendanube_token.json**
```json
{
    "access_token": "<ACCESS_TOKEN>",
    "token_type": "bearer",
    "scope": "read_content,write_content,read_products,write_products,...",
    "user_id": 6256320,
    "obtained_at": "2025-05-20T19:44:38.260760"
}
```

---

## ESTRUCTURA DEL BACKEND

### 1. tiendanube_config.py

**Propósito**: Centralizar configuración, credenciales y utilidades.

**Constantes:**
```python
API_URL_BASE = "https://api.tiendanube.com/v1"
AUTH_URL = "https://www.tiendanube.com/apps/authorize"
TOKEN_URL = "https://www.tiendanube.com/apps/authorize/token"
TOKEN_FILE = "tiendanube_token.json"

TIENDANUBE_CONFIG = {
    "client_id": "17976",
    "client_secret": "<CLIENT_SECRET>",
    "store_id": "6256320",
    "redirect_uri": "http://localhost:5000/callback",
    "scopes": [...]
}
```

**Funciones:**

```python
def load_token():
    """
    Carga el token desde tiendanube_token.json
    Returns: dict | None
    """
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            return json.load(f)
    return None

def save_token(token_data):
    """
    Guarda el token con timestamp
    Args:
        token_data (dict): Datos del token
    Returns: bool
    """
    token_data['obtained_at'] = datetime.now().isoformat()
    with open(TOKEN_FILE, 'w') as f:
        json.dump(token_data, f, indent=4)
    return True

def get_headers(access_token):
    """
    Genera headers para requests a Tienda Nube
    Args:
        access_token (str): Token de acceso
    Returns: dict
    """
    return {
        'Authentication': f"bearer {access_token}",
        'Content-Type': 'application/json',
        'User-Agent': 'VentasBoxer/1.0 (soporte@ventasboxer.com)'
    }
```

### 2. tiendanube_service.py

**Propósito**: Capa de servicio que encapsula toda la lógica de comunicación con la API.

**Clase Principal:**
```python
class TiendaNubeService:
    def __init__(self):
        self.config = TIENDANUBE_CONFIG
        self.token_data = load_token()
        self.store_id = self.config.get('store_id')
        self.base_url = f"{API_URL_BASE}/{self.store_id}"
```

**Métodos Principales:**

#### Autenticación
```python
def is_authenticated(self):
    """Verifica si hay token válido"""
    return self.token_data and 'access_token' in self.token_data

def get_connection_status(self):
    """
    Obtiene estado de conexión
    Returns: {
        'connected': bool,
        'message': str,
        'store_info': dict,
        'scopes': list
    }
    """
```

#### Request Genérico
```python
def _make_request(self, method, endpoint, data=None, params=None):
    """
    Realiza solicitud HTTP a Tienda Nube
    Args:
        method (str): GET, POST, PUT, DELETE
        endpoint (str): Ruta del endpoint
        data (dict): Datos para POST/PUT
        params (dict): Query parameters
    Returns: dict
    Raises: Exception
    """
    url = f"{self.base_url}/{endpoint.lstrip('/')}"
    headers = get_headers(self.token_data['access_token'])
    
    if method == 'GET':
        response = requests.get(url, headers=headers, params=params)
    elif method == 'POST':
        response = requests.post(url, headers=headers, json=data)
    elif method == 'PUT':
        response = requests.put(url, headers=headers, json=data)
    elif method == 'DELETE':
        response = requests.delete(url, headers=headers)
    
    response.raise_for_status()
    return response.json()
```

#### Productos
```python
def list_products(self, params=None):
    """
    Lista productos
    Args:
        params (dict): {
            'page': int,
            'per_page': int (max 100),
            'q': str (búsqueda)
        }
    Returns: list[dict]
    """
    return self._make_request('GET', 'products', params=params)

def get_product(self, product_id):
    """Obtiene un producto específico"""
    return self._make_request('GET', f'products/{product_id}')

def create_product(self, product_data):
    """
    Crea un producto
    Args:
        product_data (dict): {
            'name': {'es': str},
            'description': {'es': str},
            'published': bool,
            'variants': [{
                'stock': int,
                'price': str,
                'sku': str
            }]
        }
    Returns: dict
    """
    return self._make_request('POST', 'products', data=product_data)

def update_product(self, product_id, product_data):
    """Actualiza un producto"""
    return self._make_request('PUT', f'products/{product_id}', data=product_data)

def update_variant(self, product_id, variant_id, variant_data):
    """
    Actualiza una variante (precio, stock, etc.)
    Args:
        variant_data (dict): {
            'price': str,
            'promotional_price': str | null,
            'stock': int
        }
    Returns: dict
    """
    return self._make_request(
        'PUT', 
        f'products/{product_id}/variants/{variant_id}', 
        data=variant_data
    )
```

### 3. tiendanube_routes.py

**Propósito**: Definir endpoints FastAPI que exponen la funcionalidad al frontend.

**Router:**
```python
router = APIRouter(prefix='/api/tiendanube', tags=['tiendanube'])
```

**Modelos Pydantic:**
```python
class CallbackData(BaseModel):
    code: str

class ProductData(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: Optional[int] = 0

class StockUpdate(BaseModel):
    stock: int
```

**Endpoints:**

```python
@router.get('/status')
def get_status():
    """Estado de conexión"""
    status = tiendanube_service.get_connection_status()
    return status

@router.get('/auth-url')
def get_auth_url():
    """URL de autenticación OAuth"""
    auth_url = tiendanube_service.get_auth_url()
    return {'success': True, 'auth_url': auth_url}

@router.post('/callback')
def handle_callback(data: CallbackData):
    """Callback OAuth - intercambio de código por token"""
    result = tiendanube_service.exchange_code_for_token(data.code)
    return result

@router.get('/store')
def get_store_info():
    """Información de la tienda"""
    store_info = tiendanube_service.get_store_info()
    return {'success': True, 'data': store_info}

@router.get('/products')
def list_products(
    page: Optional[int] = None, 
    per_page: Optional[int] = None, 
    q: Optional[str] = None
):
    """Lista productos con paginación"""
    params = {}
    if page: params['page'] = page
    if per_page: params['per_page'] = per_page
    if q: params['q'] = q
    
    products = tiendanube_service.list_products(params)
    return {'success': True, 'data': products}

@router.post('/products')
def create_product(product_data: Dict[str, Any]):
    """Crea un producto"""
    product = tiendanube_service.create_product(product_data)
    return {'success': True, 'data': product}

@router.put('/products/{product_id}/variants/{variant_id}')
def update_variant(
    product_id: int, 
    variant_id: int, 
    variant_data: Dict[str, Any]
):
    """Actualiza variante (precio, stock, promotional_price)"""
    variant = tiendanube_service.update_variant(
        product_id, 
        variant_id, 
        variant_data
    )
    return {'success': True, 'data': variant}
```

---

## ESTRUCTURA DEL FRONTEND

### Componente Principal: TiendaNubeAPI.js

**Ubicación**: `frontend/src/pages/conexiones/TiendaNubeAPI.js`

**Estados del Componente:**

```javascript
// Estado general
const [tabValue, setTabValue] = useState(0);
const [loading, setLoading] = useState(false);
const [connectionStatus, setConnectionStatus] = useState(null);
const [storeInfo, setStoreInfo] = useState(null);

// Estados para agregar producto
const [newProduct, setNewProduct] = useState({
  name: '',
  description: '',
  price: '',
  stock: '',
  sku: '',
  categories: [],
});
const [uploadingProduct, setUploadingProduct] = useState(false);
const [productResult, setProductResult] = useState(null);

// Estados para sincronización
const [loadingProducts, setLoadingProducts] = useState(false);
const [tiendaNubeProducts, setTiendaNubeProducts] = useState([]);
const [editedProducts, setEditedProducts] = useState({});
const [updatingProducts, setUpdatingProducts] = useState(false);
const [updateResults, setUpdateResults] = useState(null);
```

**Estructura de Pestañas:**

```javascript
<Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
  <Tab label="Configuración" icon={<Settings />} />
  <Tab label="Endpoints" icon={<Api />} />
  <Tab label="Agregar Producto" icon={<Inventory />} />
  <Tab label="Sincronizar Stock" icon={<CloudSync />} />
</Tabs>
```

### Pestaña 1: Configuración

**Funcionalidad**: Muestra estado de conexión e información de la tienda.

**useEffect para cargar datos:**
```javascript
useEffect(() => {
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/tiendanube/status');
      const data = await response.json();
      setConnectionStatus(data);
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch('/api/tiendanube/store');
      const data = await response.json();
      if (data.success) {
        setStoreInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  };

  fetchStatus();
  if (tabValue === 0) {
    fetchStoreInfo();
  }
}, [tabValue]);
```

**Renderizado de información:**
```javascript
{connectionStatus && (
  <Card>
    <CardContent>
      <Typography variant="h6">Estado de Conexión</Typography>
      <Chip 
        label={connectionStatus.connected ? 'Conectado' : 'Desconectado'}
        color={connectionStatus.connected ? 'success' : 'error'}
      />
      {connectionStatus.scopes && (
        <Box>
          <Typography>Permisos:</Typography>
          {connectionStatus.scopes.map((scope, index) => (
            <Chip key={index} label={scope} size="small" />
          ))}
        </Box>
      )}
    </CardContent>
  </Card>
)}

{storeInfo && (
  <Card>
    <CardContent>
      <Typography variant="h6">Información de la Tienda</Typography>
      <Typography>Nombre: {storeInfo.name?.es || 'N/A'}</Typography>
      <Typography>URL: {storeInfo.url || 'N/A'}</Typography>
      <Typography>Email: {storeInfo.email || 'N/A'}</Typography>
      <Typography>País: {storeInfo.country?.es || 'N/A'}</Typography>
    </CardContent>
  </Card>
)}
```

### Pestaña 2: Endpoints

**Funcionalidad**: Documentación de endpoints disponibles.

**Estructura de datos:**
```javascript
const endpoints = [
  {
    category: 'Autenticación',
    items: [
      {
        method: 'GET',
        path: '/api/tiendanube/status',
        description: 'Obtiene el estado de la conexión',
        iconName: 'CheckCircle',
      },
      {
        method: 'GET',
        path: '/api/tiendanube/auth-url',
        description: 'Obtiene URL de autenticación OAuth',
        iconName: 'LinkIcon',
      }
    ]
  },
  {
    category: 'Productos',
    items: [
      {
        method: 'GET',
        path: '/api/tiendanube/products',
        description: 'Lista todos los productos',
        params: 'page, per_page, q',
        iconName: 'Inventory',
      },
      {
        method: 'POST',
        path: '/api/tiendanube/products',
        description: 'Crea un nuevo producto',
        iconName: 'Inventory',
      }
    ]
  }
];
```

---

## API ENDPOINTS DISPONIBLES

### Tabla Completa de Endpoints

| Método | Endpoint | Descripción | Parámetros | Response |
|--------|----------|-------------|------------|----------|
| **AUTENTICACIÓN** |
| GET | `/api/tiendanube/status` | Estado de conexión | - | `{connected: bool, message: str, store_info: dict}` |
| GET | `/api/tiendanube/auth-url` | URL OAuth | - | `{success: bool, auth_url: str}` |
| POST | `/api/tiendanube/callback` | Callback OAuth | `{code: str}` | `{success: bool, data: dict}` |
| **TIENDA** |
| GET | `/api/tiendanube/store` | Info de tienda | - | `{success: bool, data: dict}` |
| **PRODUCTOS** |
| GET | `/api/tiendanube/products` | Listar productos | `page, per_page, q` | `{success: bool, data: list}` |
| GET | `/api/tiendanube/products/{id}` | Obtener producto | - | `{success: bool, data: dict}` |
| POST | `/api/tiendanube/products` | Crear producto | `{name, description, price, variants}` | `{success: bool, data: dict}` |
| PUT | `/api/tiendanube/products/{id}` | Actualizar producto | `{name, description, ...}` | `{success: bool, data: dict}` |
| DELETE | `/api/tiendanube/products/{id}` | Eliminar producto | - | `{success: bool, message: str}` |
| **VARIANTES** |
| PUT | `/api/tiendanube/products/{pid}/variants/{vid}` | Actualizar variante | `{price, promotional_price, stock}` | `{success: bool, data: dict}` |
| **ÓRDENES** |
| GET | `/api/tiendanube/orders` | Listar órdenes | `page, per_page, status` | `{success: bool, data: list}` |
| GET | `/api/tiendanube/orders/{id}` | Obtener orden | - | `{success: bool, data: dict}` |
| **CATEGORÍAS** |
| GET | `/api/tiendanube/categories` | Listar categorías | `page, per_page` | `{success: bool, data: list}` |
| **CLIENTES** |
| GET | `/api/tiendanube/customers` | Listar clientes | `page, per_page` | `{success: bool, data: list}` |
| **WEBHOOKS** |
| GET | `/api/tiendanube/webhooks` | Listar webhooks | - | `{success: bool, data: list}` |
| POST | `/api/tiendanube/webhooks` | Crear webhook | `{url, event}` | `{success: bool, data: dict}` |
| DELETE | `/api/tiendanube/webhooks/{id}` | Eliminar webhook | - | `{success: bool, message: str}` |

---

## FUNCIONALIDAD: AGREGAR PRODUCTO

### Flujo Completo

```
1. Usuario completa formulario
   ↓
2. Validación frontend (nombre y precio obligatorios)
   ↓
3. Construcción del objeto producto
   ↓
4. POST a /api/tiendanube/products
   ↓
5. Backend valida y envía a Tienda Nube
   ↓
6. Tienda Nube crea producto y devuelve datos
   ↓
7. Frontend muestra resultado y limpia formulario
```

### Código Frontend

**Formulario:**
```javascript
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Nombre del Producto *"
      value={newProduct.name}
      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
      placeholder="Ej: Filtro de Aceite"
    />
  </Grid>
  
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="SKU / Código"
      value={newProduct.sku}
      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
    />
  </Grid>
  
  <Grid item xs={12}>
    <TextField
      fullWidth
      multiline
      rows={3}
      label="Descripción"
      value={newProduct.description}
      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
    />
  </Grid>
  
  <Grid item xs={12} md={4}>
    <TextField
      fullWidth
      type="number"
      label="Precio *"
      value={newProduct.price}
      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
      InputProps={{
        startAdornment: <Typography>$</Typography>
      }}
    />
  </Grid>
  
  <Grid item xs={12} md={4}>
    <TextField
      fullWidth
      type="number"
      label="Stock Inicial"
      value={newProduct.stock}
      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
    />
  </Grid>
  
  <Grid item xs={12} md={4}>
    <Button
      fullWidth
      variant="contained"
      onClick={handleCreateProduct}
      disabled={uploadingProduct || !newProduct.name || !newProduct.price}
      startIcon={uploadingProduct ? <CircularProgress size={20} /> : <CloudSync />}
    >
      {uploadingProduct ? 'Creando...' : 'Crear Producto'}
    </Button>
  </Grid>
</Grid>
```

**Función de creación:**
```javascript
const handleCreateProduct = async () => {
  // Validación
  if (!newProduct.name || !newProduct.price) {
    alert('Por favor completa al menos el nombre y precio del producto');
    return;
  }

  setUploadingProduct(true);
  setProductResult(null);

  try {
    // Construcción del objeto según API de Tienda Nube
    const productData = {
      name: { es: newProduct.name },
      description: { es: newProduct.description },
      price: parseFloat(newProduct.price),
      variants: [{
        stock: parseInt(newProduct.stock) || 0,
        sku: newProduct.sku || null,
      }],
      published: true,
    };

    // Envío a backend
    const response = await fetch('/api/tiendanube/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    const data = await response.json();

    if (data.success) {
      setProductResult({ success: true, product: data.data });
      
      // Limpiar formulario
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock: '',
        sku: '',
        categories: [],
      });
      
      alert('Producto creado exitosamente en Tienda Nube!');
    } else {
      setProductResult({ success: false, error: data.message });
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error creating product:', error);
    setProductResult({ success: false, error: error.message });
    alert('Error al crear producto');
  } finally {
    setUploadingProduct(false);
  }
};
```

### Estructura de Datos

**Request a Backend:**
```json
{
  "name": {"es": "Filtro de Aceite"},
  "description": {"es": "Filtro de aceite para motor"},
  "price": 1500.00,
  "variants": [{
    "stock": 25,
    "sku": "FLT-001"
  }],
  "published": true
}
```

**Response de Tienda Nube:**
```json
{
  "id": 271789137,
  "name": {"es": "Filtro de Aceite"},
  "description": {"es": "Filtro de aceite para motor"},
  "published": true,
  "created_at": "2025-05-20T22:51:57+0000",
  "updated_at": "2025-05-20T22:51:57+0000",
  "variants": [{
    "id": 1214011741,
    "product_id": 271789137,
    "price": "1500.00",
    "stock": 25,
    "sku": "FLT-001"
  }]
}
```

### Validaciones

1. **Frontend:**
   - Nombre obligatorio
   - Precio obligatorio
   - Precio debe ser número positivo
   - Stock debe ser entero no negativo

2. **Backend:**
   - Token válido
   - Estructura de datos correcta
   - Manejo de errores de API

---

## FUNCIONALIDAD: SINCRONIZAR STOCK

### Concepto

Esta funcionalidad permite actualizar masivamente precios (regular y promocional) y stock de productos existentes en Tienda Nube.

### Flujo Completo

```
1. Usuario hace clic en "Cargar Productos desde Tienda Nube"
   ↓
2. GET /api/tiendanube/products?per_page=100
   ↓
3. Backend obtiene productos de Tienda Nube
   ↓
4. Frontend procesa y muestra en tabla editable
   ↓
5. Usuario edita precios/stock en la tabla
   ↓
6. Sistema rastrea cambios en estado editedProducts
   ↓
7. Usuario hace clic en "Actualizar X Productos"
   ↓
8. Para cada producto editado:
   - PUT /api/tiendanube/products/{id}/variants/{vid}
   - Actualiza price, promotional_price, stock
   ↓
9. Recargar productos para ver cambios
   ↓
10. Mostrar reporte de resultados
```

### Código Frontend

**Carga de productos:**
```javascript
const handleLoadProducts = async () => {
  setLoadingProducts(true);
  setUpdateResults(null);

  try {
    const response = await fetch('/api/tiendanube/products?per_page=100');
    const data = await response.json();

    if (data.success) {
      // Procesamiento de productos
      const products = data.data.map(p => {
        const variant = p.variants?.[0] || {};
        
        // Función para parsear precios (vienen como strings)
        const parsePrice = (price) => {
          if (price === null || price === undefined || price === '') return 0;
          return parseFloat(price) || 0;
        };
        
        return {
          id: p.id,
          name: p.name?.es || p.name || 'Sin nombre',
          sku: variant.sku || '',
          // Los precios están en las variantes como strings
          price: parsePrice(variant.price) || parsePrice(p.price),
          promotional_price: parsePrice(variant.promotional_price) || parsePrice(p.promotional_price),
          stock: parseInt(variant.stock) || 0,
          variantId: variant.id,
        };
      });
      
      setTiendaNubeProducts(products);
      setEditedProducts({});
      alert(`${products.length} productos cargados desde Tienda Nube`);
    } else {
      alert('Error al cargar productos: ' + data.message);
    }
  } catch (error) {
    console.error('Error loading products:', error);
    alert('Error al cargar productos');
  } finally {
    setLoadingProducts(false);
  }
};
```

**Rastreo de ediciones:**
```javascript
const handleEditProduct = (productId, field, value) => {
  setEditedProducts(prev => ({
    ...prev,
    [productId]: {
      ...prev[productId],
      [field]: value,
    },
  }));
};
```

**Tabla editable:**
```javascript
<TableContainer component={Paper} sx={{ maxHeight: 600 }}>
  <Table stickyHeader size="small">
    <TableHead>
      <TableRow>
        <TableCell>Nombre</TableCell>
        <TableCell>SKU</TableCell>
        <TableCell>Precio Regular</TableCell>
        <TableCell>Precio Promocional</TableCell>
        <TableCell>Stock</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {tiendaNubeProducts.map((product) => (
        <TableRow 
          key={product.id}
          sx={{
            backgroundColor: editedProducts[product.id] ? '#fff3e0' : 'inherit',
          }}
        >
          <TableCell>{product.name}</TableCell>
          <TableCell>{product.sku || '-'}</TableCell>
          
          <TableCell>
            <TextField
              size="small"
              type="number"
              defaultValue={product.price}
              onChange={(e) => handleEditProduct(product.id, 'price', e.target.value)}
              InputProps={{
                startAdornment: <Typography>$</Typography>
              }}
            />
          </TableCell>
          
          <TableCell>
            <TextField
              size="small"
              type="number"
              defaultValue={product.promotional_price}
              onChange={(e) => handleEditProduct(product.id, 'promotional_price', e.target.value)}
              placeholder="Sin promoción"
              InputProps={{
                startAdornment: <Typography>$</Typography>
              }}
            />
          </TableCell>
          
          <TableCell>
            <TextField
              size="small"
              type="number"
              defaultValue={product.stock}
              onChange={(e) => handleEditProduct(product.id, 'stock', e.target.value)}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

**Actualización masiva:**
```javascript
const handleUpdateProducts = async () => {
  // Filtrar solo productos con cambios
  const productsToUpdate = Object.keys(editedProducts).filter(
    id => Object.keys(editedProducts[id]).length > 0
  );

  if (productsToUpdate.length === 0) {
    alert('No hay cambios para actualizar');
    return;
  }

  setUpdatingProducts(true);
  const results = { total: productsToUpdate.length, updated: 0, errors: [] };

  try {
    for (const productId of productsToUpdate) {
      const product = tiendaNubeProducts.find(p => p.id.toString() === productId);
      const changes = editedProducts[productId];

      try {
        // En Tienda Nube, los precios están en las variantes
        if (product.variantId && 
            (changes.stock !== undefined || 
             changes.price !== undefined || 
             changes.promotional_price !== undefined)) {
          
          const variantUpdateData = {};
          
          if (changes.stock !== undefined) {
            variantUpdateData.stock = parseInt(changes.stock);
          }
          
          if (changes.price !== undefined) {
            // Tienda Nube espera string
            variantUpdateData.price = parseFloat(changes.price).toString();
          }
          
          if (changes.promotional_price !== undefined) {
            const promoPrice = parseFloat(changes.promotional_price);
            // null si es 0, string si tiene valor
            variantUpdateData.promotional_price = promoPrice > 0 ? promoPrice.toString() : null;
          }

          const variantResponse = await fetch(
            `/api/tiendanube/products/${productId}/variants/${product.variantId}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantUpdateData),
            }
          );

          const variantResult = await variantResponse.json();
          
          if (!variantResult.success) {
            throw new Error('Error al actualizar variante');
          }
        }

        results.updated++;
      } catch (error) {
        results.errors.push({ name: product.name, error: error.message });
      }
    }

    setSyncResults(results);
    alert(`Actualización completada: ${results.updated} productos actualizados`);
    
    // Recargar productos para ver cambios
    if (results.updated > 0) {
      handleLoadProducts();
    }
  } catch (error) {
    console.error('Error updating products:', error);
    alert('Error en la actualización');
  } finally {
    setUpdatingProducts(false);
  }
};
```

### Aspectos Técnicos Importantes

#### 1. Precios en Variantes
**CRÍTICO**: En Tienda Nube, los precios NO están en el producto, están en las variantes.

```javascript
// ❌ INCORRECTO - Actualizar producto
PUT /api/tiendanube/products/271789137
Body: { "price": 20000 }

// ✅ CORRECTO - Actualizar variante
PUT /api/tiendanube/products/271789137/variants/1214011741
Body: { "price": "20000.00" }
```

#### 2. Formato de Precios
Los precios deben enviarse como **strings**, no números:

```javascript
// ❌ INCORRECTO
{ "price": 20000 }

// ✅ CORRECTO
{ "price": "20000.00" }
```

#### 3. Precio Promocional
El precio promocional puede ser `null` o string:

```javascript
// Sin promoción
{ "promotional_price": null }

// Con promoción
{ "promotional_price": "15000.00" }
```

#### 4. Rastreo de Cambios
El sistema usa un objeto `editedProducts` para rastrear cambios:

```javascript
// Estructura
{
  "271789137": {
    "price": "20000",
    "promotional_price": "15000",
    "stock": "25"
  },
  "271789138": {
    "stock": "30"
  }
}
```

#### 5. Indicador Visual
Los productos editados se resaltan con fondo naranja:

```javascript
sx={{
  backgroundColor: editedProducts[product.id] ? '#fff3e0' : 'inherit',
}}
```

---

## FLUJOS DE DATOS

### Flujo 1: Autenticación OAuth

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Usuario │                │ Backend │                │ Tienda  │
│         │                │         │                │  Nube   │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ 1. Solicita autenticación│                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │ 2. Devuelve auth_url     │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ 3. Redirige a Tienda Nube│                          │
     ├──────────────────────────┼─────────────────────────>│
     │                          │                          │
     │ 4. Usuario autoriza      │                          │
     │                          │                          │
     │ 5. Callback con código   │                          │
     │<─────────────────────────┼──────────────────────────┤
     │                          │                          │
     │ 6. Envía código          │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 7. Intercambia código    │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ 8. Devuelve token        │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ 9. Guarda token          │
     │                          │                          │
     │ 10. Confirma autenticación│                         │
     │<─────────────────────────┤                          │
     │                          │                          │
```

### Flujo 2: Crear Producto

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│Frontend │                │ Backend │                │ Tienda  │
│         │                │         │                │  Nube   │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ 1. Usuario completa form │                          │
     │                          │                          │
     │ 2. POST /api/tiendanube/ │                          │
     │    products              │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 3. Valida token          │
     │                          │                          │
     │                          │ 4. POST /v1/{store}/     │
     │                          │    products              │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │                          │
     │                          │ 5. Crea producto         │
     │                          │                          │
     │                          │ 6. Response con producto │
     │                          │<─────────────────────────┤
     │                          │                          │
     │ 7. Response {success,    │                          │
     │    data}                 │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ 8. Muestra resultado     │                          │
     │                          │                          │
```

### Flujo 3: Sincronizar Stock

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│Frontend │                │ Backend │                │ Tienda  │
│         │                │         │                │  Nube   │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ 1. Cargar Productos      │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 2. GET /v1/{store}/      │
     │                          │    products?per_page=100 │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ 3. Lista de productos    │
     │                          │<─────────────────────────┤
     │                          │                          │
     │ 4. Array de productos    │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ 5. Renderiza tabla       │                          │
     │                          │                          │
     │ 6. Usuario edita valores │                          │
     │                          │                          │
     │ 7. Actualizar Productos  │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 8. Para cada producto:   │
     │                          │    PUT /v1/{store}/      │
     │                          │    products/{id}/        │
     │                          │    variants/{vid}        │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ 9. Variante actualizada  │
     │                          │<─────────────────────────┤
     │                          │                          │
     │ 10. Reporte de resultados│                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ 11. Recarga productos    │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
```

---

## MANEJO DE ERRORES

### Niveles de Error

#### 1. Frontend
```javascript
try {
  const response = await fetch('/api/tiendanube/products');
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  // Procesar datos
} catch (error) {
  console.error('Error:', error);
  alert('Error al cargar productos: ' + error.message);
}
```

#### 2. Backend - Routes
```python
@router.get('/products')
def list_products(...):
    try:
        products = tiendanube_service.list_products(params)
        return {'success': True, 'data': products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3. Backend - Service
```python
def _make_request(self, method, endpoint, data=None, params=None):
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        error_msg = f"Error en solicitud {method} {endpoint}: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" - Response: {e.response.text}"
        raise Exception(error_msg)
```

### Tipos de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | Token inválido o expirado | Re-autenticar |
| `404 Not Found` | Recurso no existe | Verificar ID |
| `422 Unprocessable Entity` | Datos inválidos | Validar estructura |
| `429 Too Many Requests` | Rate limit excedido | Esperar y reintentar |
| `500 Internal Server Error` | Error en Tienda Nube | Contactar soporte |

### Logging

**Backend:**
```python
print(f"[DEBUG] Actualizando variante {variant_id} con datos: {variant_data}")
print(f"[DEBUG] Resultado: {result}")
```

**Frontend:**
```javascript
console.log('Respuesta completa de la API:', data);
console.log('Primer producto raw:', data.data?.[0]);
console.log('Productos procesados:', products.slice(0, 3));
```

---

## CONSIDERACIONES TÉCNICAS

### 1. Límites de la API

- **Rate Limit**: 2 requests/segundo por store
- **Paginación**: Máximo 100 items por página
- **Timeout**: 30 segundos por request

### 2. Estructura de Datos de Tienda Nube

**Producto:**
```json
{
  "id": 271789137,
  "name": {"es": "Nombre del producto"},
  "description": {"es": "Descripción"},
  "handle": {"es": "url-amigable"},
  "published": true,
  "free_shipping": false,
  "requires_shipping": true,
  "canonical_url": "https://...",
  "created_at": "2025-05-20T22:51:57+0000",
  "updated_at": "2025-05-20T22:51:57+0000",
  "variants": [...],
  "images": [...],
  "categories": [...]
}
```

**Variante:**
```json
{
  "id": 1214011741,
  "product_id": 271789137,
  "position": 1,
  "price": "27205.18",
  "compare_at_price": "27205.18",
  "promotional_price": null,
  "stock_management": true,
  "stock": 5,
  "weight": "0.500",
  "sku": "29324",
  "barcode": null,
  "created_at": "2025-05-20T22:51:58+0000",
  "updated_at": "2025-11-27T21:14:11+0000"
}
```

### 3. Campos Multiidioma

Tienda Nube usa objetos para campos multiidioma:

```json
{
  "name": {"es": "Nombre en español"},
  "description": {"es": "Descripción en español"}
}
```

**Acceso correcto:**
```javascript
// ✅ CORRECTO
product.name?.es || product.name || 'N/A'

// ❌ INCORRECTO - Renderiza objeto
product.name
```

### 4. Conversión de Tipos

**Precios:**
```javascript
// De Tienda Nube (string) a número
const price = parseFloat(variant.price) || 0;

// De número a Tienda Nube (string)
const priceStr = parseFloat(changes.price).toString();
```

**Stock:**
```javascript
// A entero
const stock = parseInt(variant.stock) || 0;
```

### 5. Seguridad

- **Token**: Nunca exponer en frontend
- **HTTPS**: Todas las comunicaciones
- **Validación**: Backend y frontend
- **Sanitización**: Inputs del usuario

### 6. Performance

**Optimizaciones:**
- Paginación en listados
- Debounce en búsquedas
- Cache de datos estáticos
- Batch updates cuando sea posible

### 7. Mantenimiento

**Archivos a monitorear:**
- `tiendanube_token.json` - Renovar si expira
- Logs del backend - Errores de API
- Console del navegador - Errores frontend

---

## CONCLUSIÓN

Esta integración proporciona una interfaz completa para gestionar productos en Tienda Nube desde Ventas Boxer, con las siguientes capacidades:

✅ **Autenticación OAuth 2.0** segura y persistente
✅ **Visualización** de estado de conexión y datos de tienda
✅ **Creación** de productos con validación
✅ **Sincronización masiva** de precios y stock
✅ **Manejo robusto** de errores
✅ **Interfaz intuitiva** con Material-UI
✅ **Arquitectura escalable** con FastAPI y React

### Próximos Pasos Sugeridos

1. Implementar gestión de imágenes de productos
2. Agregar filtros y búsqueda avanzada
3. Sincronización de órdenes
4. Webhooks para actualizaciones en tiempo real
5. Reportes y analytics
6. Exportación/importación masiva vía CSV

---

**Documento generado**: 27 de Noviembre de 2025  
**Versión**: 1.0  
**Sistema**: Ventas Boxer - Integración Tienda Nube
