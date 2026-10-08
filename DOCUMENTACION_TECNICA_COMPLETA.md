# DOCUMENTACIÓN TÉCNICA COMPLETA - VENTAS BOXER
## Sistema de Gestión de Ventas Multi-Plataforma para Autopartes

**Fecha**: Enero 2025  
**Versión**: 1.0

---

## 📋 STACK TECNOLÓGICO

### Frontend
- **Framework**: React 18.2.0 + React Scripts 5.0.1
- **UI**: Material-UI 5.14.20 (@mui/material, @mui/icons-material, @mui/x-data-grid)
- **Routing**: React Router DOM 6.20.1
- **HTTP**: Axios 1.6.2
- **IA**: Google Generative AI 0.24.1

### Backend
- **Framework**: FastAPI 0.104.1 + Uvicorn 0.24.0
- **Database**: SQLite + SQLAlchemy 2.0.23
- **Validation**: Pydantic 2.5.0
- **Auth**: python-jose 3.3.0 + passlib 1.7.4
- **Search**: fuzzywuzzy 0.18.0
- **HTTP**: httpx 0.25.2 + requests 2.31.0
- **Data**: pandas 2.1.4 + openpyxl 3.1.2
- **PDF**: reportlab 4.0.7
- **IA**: openai 0.28.1

---

## 🏗️ ARQUITECTURA

```
Frontend (React:3000) ←→ Backend (FastAPI:8000) ←→ SQLite + APIs Externas
```

**Patrón**: Cliente-Servidor con separación clara
**Comunicación**: REST API con JSON
**Estado**: Context API (React) + SQLAlchemy ORM (Backend)

---

## 📁 ESTRUCTURA DE CARPETAS

### Frontend (`/frontend/src`)
```
components/          # Componentes reutilizables
├── Sidebar.js       # Barra lateral principal
├── Navbar.js        # Barra superior
├── CartSidebar.js   # Carrito lateral
└── ...

contexts/            # Estado global
└── CartContext.js   # Carrito compartido

pages/               # Vistas principales
├── MainSale.js      # Pantalla ventas
├── Caja.js          # Módulo caja
├── conexiones/      # Integraciones API
│   ├── RuralSantaFe.js
│   ├── TiendaNubeAPI.js
│   └── PromotiveAPI.js
└── crm/             # CRM

App.js               # Raíz con routing
```

### Backend (`/backend`)
```
main.py                      # FastAPI app
database.py, models.py       # ORM

*_routes.py                  # Endpoints por módulo
*_service.py                 # Lógica de negocio
*_config.py                  # Configuración

static/images/               # Archivos estáticos
*.db                         # Bases de datos SQLite
```

---

## 🎨 DISEÑO FRONTEND

### Sistema de Colores (Material-UI Theme)

| Color | Hex | Uso |
|-------|-----|-----|
| **Primary** | #1976d2 | Botones principales, sidebar activo |
| **Secondary** | #9c27b0 | Acciones secundarias |
| **Success** | #2e7d32 | Confirmaciones, estados OK |
| **Warning** | #ed6c02 | Advertencias |
| **Error** | #d32f2f | Errores |
| **Background** | #f5f5f5 | Fondo general |
| **Paper** | #ffffff | Tarjetas, modales |

### Tipografía
- **Familia**: Roboto, Helvetica, Arial
- **h4**: 24px, peso 600 (títulos)
- **h6**: 20px, peso 500 (subtítulos)
- **body1**: 16px (texto normal)

### Componentes Personalizados
- Botones sin transformación de texto (`textTransform: 'none'`)
- Tarjetas con sombra suave (`boxShadow: '0 2px 8px rgba(0,0,0,0.1)'`)

---

## 📂 BARRA LATERAL (SIDEBAR)

**Archivo**: `frontend/src/components/Sidebar.js`

### Dimensiones
- **Expandido**: 280px
- **Colapsado**: 64px
- **Transición**: 0.3s

### Estructura

```
┌─────────────────────────────┐
│ 🚗 POS Boxer          [≡]  │ ← Header azul
├─────────────────────────────┤
│ ▼ Ventas                    │
│   • Sistema de Ventas       │
├─────────────────────────────┤
│ ▼ MercadoLibre              │
│   • Gestión Integral ML     │
├─────────────────────────────┤
│ ▼ CRM                       │
│   • Gestión de Clientes     │
├─────────────────────────────┤
│ ▼ CHATBOT                   │
│   • CHATBOT ORIGINAL        │
│   • CHATBOT X MODULOS       │
├─────────────────────────────┤
│ ▼ CONEXIONES API            │
│   • Rural Santa Fe          │
│   • Promotive - API         │
│   • Artículos               │
│   • Tienda Nube             │
└─────────────────────────────┘
```

### Rutas y Módulos

| Sección | Ruta | Icono |
|---------|------|-------|
| **Ventas** | `/ventas` | PointOfSale |
| **MercadoLibre** | `/mercadolibre` | Store |
| **CRM** | `/crm` | People |
| **Chatbot Original** | `/chatbot/original` | SmartToy |
| **Chatbot Módulos** | `/chatbot/modulos` | SmartToy |
| **Rural Santa Fe** | `/conexiones-api/rural-santa-fe` | Agriculture |
| **Promotive API** | `/conexiones-api/promotive-api` | Business |
| **Promotive Artículos** | `/conexiones-api/promotive-articulos` | ShoppingCart |
| **Tienda Nube** | `/conexiones-api/tiendanube` | CloudSync |

### Estados Visuales
- **Activo**: Fondo azul (#1976d2), texto blanco
- **Inactivo**: Fondo transparente
- **Hover**: Gris claro
- **Colapsado**: Solo iconos con tooltips

---

## 📱 MÓDULOS PRINCIPALES

### 1. VENTAS (`/ventas`)

**Componentes**: `VentasContainer.js`, `MainSale.js`, `Caja.js`, `Presupuestos.js`

**Funcionalidades**:
- Búsqueda fuzzy de productos
- Carrito lateral con totales automáticos
- Descuentos (% o fijo)
- Cálculo de IVA
- Envío a caja o creación de presupuestos

**Layout**:
```
[Búsqueda]                    [Carrito →]
┌─────────┐ ┌─────────┐
│Producto1│ │Producto2│
│ $1,200  │ │  $850   │
└─────────┘ └─────────┘
```

### 2. MERCADOLIBRE (`/mercadolibre`)

**Componente**: `MercadoLibreContainer.js`

**Pestañas**:
- Configuración (OAuth)
- Publicaciones (listar, editar)
- Preguntas (responder)
- Ventas (órdenes)

**Funcionalidades**:
- Autenticación OAuth 2.0
- Gestión de publicaciones
- Actualización de stock/precios
- Migración a Tienda Nube

### 3. CRM (`/crm`)

**Componente**: `CRMContainer.js`

**Pestañas**:
- Particulares (clientes)
- Artículos (inventario)
- Conversaciones (historial)

### 4. CHATBOT (`/chatbot`)

**Componentes**: `ChatbotModulos.js`, `ChatbotSection.js`

**Secciones**: Ventas, Cuentas, Compras, Clientes, Proveedores, Artículos, MercadoLibre

**Características**:
- OpenAI GPT integration
- Base de conocimiento por sección
- Preguntas frecuentes configurables
- Auto-limpieza de conversaciones (>15 días)

### 5. CONEXIONES API

#### Rural Santa Fe (`/conexiones-api/rural-santa-fe`)

**Pestañas**: Configuración, Productos, Descuentos, Pedidos, Documentos

**Filtros de Productos**:
- Marca (MarcaRSF, MarcaOriginal)
- Rubro (categoría)
- OEM (código fabricante)
- Código (CodigoRSF, Artículo, CodigoBarra)

**Paginación**: 100 productos/página (local)

#### Tienda Nube (`/conexiones-api/tiendanube`)

**Pestañas**: Configuración, Endpoints, Agregar Producto, Sincronizar Stock

**Características**:
- OAuth 2.0
- Actualización masiva de precios/stock
- **IMPORTANTE**: Precios en variantes como strings ("20000.00")
- Migración desde MercadoLibre

#### Promotive API (`/conexiones-api/promotive-api`)

**Funcionalidades**:
- Identificación de vehículos (patente/VIN)
- Búsqueda de autopartes
- Compatibilidad vehicular
- Información técnica detallada

---

## 🔌 API BACKEND - ENDPOINTS

**Base URL**: `http://localhost:8000`

### Generales (`/api`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products/search?q={term}` | Búsqueda fuzzy |
| GET | `/api/products/{id}` | Producto específico |
| GET | `/api/customers/search?q={term}` | Buscar clientes |
| POST | `/api/customers` | Crear cliente |
| GET | `/api/sales/pending` | Ventas pendientes |
| POST | `/api/sales/send-to-caja` | Enviar a caja |
| POST | `/api/sales/{id}/invoice` | Facturar venta |
| GET | `/api/quotes` | Listar presupuestos |
| POST | `/api/quotes` | Crear presupuesto |

### Rural Santa Fe (`/api/rsf`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/rsf/login` | Autenticación |
| GET | `/api/rsf/status` | Estado conexión |
| GET | `/api/rsf/products` | Lista productos |
| GET | `/api/rsf/products/search?q={term}` | Buscar productos |
| GET | `/api/rsf/discounts` | Descuentos por marca |
| POST | `/api/rsf/orders` | Crear pedido |
| GET | `/api/rsf/documents` | Facturas/docs |

**Autenticación**:
```json
POST /api/rsf/login
{
  "cuenta_rsf": "5482",
  "password": "80856"
}
```

### Tienda Nube (`/api/tiendanube`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tiendanube/status` | Estado |
| GET | `/api/tiendanube/auth-url` | URL OAuth |
| POST | `/api/tiendanube/callback` | Callback OAuth |
| GET | `/api/tiendanube/store` | Info tienda |
| GET | `/api/tiendanube/products` | Listar productos |
| POST | `/api/tiendanube/products` | Crear producto |
| PUT | `/api/tiendanube/products/{id}/variants/{vid}` | Actualizar variante |
| POST | `/api/tiendanube/products/bulk-update` | Actualización masiva |

**Actualizar Variante** (precios/stock):
```json
PUT /api/tiendanube/products/{id}/variants/{vid}
{
  "price": "20000.00",
  "promotional_price": "18000.00",
  "stock": 25
}
```

### MercadoLibre (`/api/mercadolibre`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/mercadolibre/status` | Estado |
| POST | `/api/mercadolibre/verify-connection` | Verificar/renovar |
| GET | `/api/mercadolibre/user` | Info usuario |
| GET | `/api/mercadolibre/items` | Publicaciones |
| GET | `/api/mercadolibre/items/{id}` | Publicación específica |
| GET | `/api/mercadolibre/items-for-tiendanube` | Items para TN |
| GET | `/api/mercadolibre/questions` | Preguntas |
| POST | `/api/mercadolibre/questions/{id}/answer` | Responder |

### Promotive (`/api/promotive`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/promotive/login` | Autenticación |
| GET | `/api/promotive/status` | Estado |
| GET | `/api/promotive/vehicle/identify` | Identificar vehículo |
| GET | `/api/promotive/parts/list` | Listar partes |

---

## 🔗 APIS EXTERNAS

### 1. RURAL SANTA FE API v3

**Base URL**: `https://plataformarsf.com:1043`

**Credenciales**:
- Cuenta: `5482`
- Password: `80856`

**Autenticación**: JWT Bearer (12h)
```
POST /api/login
{"cuentaRSF": "5482", "password": "80856"}
→ {"accessToken": "...", "razonSocial": "..."}

Header: Authorization: Bearer {token}
```

**Endpoints**:
- `GET /api/productos/lista?addHeader=true` → CSV con 17 campos
- `GET /api/descuentomarcas/json` → Descuentos
- `POST /api/pedidos/ingresar` → Crear pedido
- `GET /api/Documento/ByDate?fromDateTime=YYYY-MM-DD` → Documentos

### 2. TIENDA NUBE API

**Base URL**: `https://api.tiendanube.com/v1/{store_id}`

**Credenciales**:
- Client ID: `17976`
- Store ID: `6256320`
- Redirect URI: `http://localhost:5000/callback`

**Autenticación**: OAuth 2.0 (token persistente)
```
Headers:
- Authentication: bearer {token}
- User-Agent: VentasBoxer (email@example.com)
```

**Endpoints**:
- `GET /store` → Info tienda
- `GET /products` → Listar
- `POST /products` → Crear
- `PUT /products/{id}/variants/{vid}` → Actualizar variante

**CRÍTICO**: Precios como strings: `"20000.00"` no `20000`

### 3. MERCADOLIBRE API

**Base URL**: `https://api.mercadolibre.com`

**Autenticación**: OAuth 2.0 con refresh token

**Endpoints**:
- `GET /users/me` → Usuario
- `GET /users/{id}/items/search` → Publicaciones
- `GET /items/{id}` → Item
- `PUT /items/{id}` → Actualizar
- `GET /questions/search?item={id}` → Preguntas
- `POST /answers` → Responder

### 4. PROMOTIVE/SPECPARTS API

**Base URL**: `https://external-api.specparts.ai`  
**Auth URL**: `https://auth.specparts.ai/oauth`

**Credenciales**:
- Client ID: `gsGXZxtFux30YIXnmIYupqcj9wBcB49bmy8kH5dEsOV5o9eror`
- Client Secret: `dtEQnmBVlGJ0tq1j49nx2V85nGgpx9quyCVOu3a0Y24GemPi2uCnIEm0Q5zIt66emNEbrV`

**Autenticación**: OAuth Bearer
```
POST /oauth
{"client_id": "...", "client_secret": "..."}
→ {"access_token": "...", "ttl": 3600}
```

**Endpoints**:
- `GET /part/list?lang=1&page=1&limit=100` → Listar partes

---

## ✅ BUENAS PRÁCTICAS

### Organización

1. **Archivos < 300 líneas**: Dividir en módulos si excede
2. **Estructura modular**: `feature_routes.py`, `feature_service.py`, `feature_models.py`
3. **Nombres descriptivos**:
   - Python: `snake_case`
   - JavaScript: `camelCase`
   - Componentes: `PascalCase`
   - Constantes: `UPPER_SNAKE_CASE`

### Frontend (React)

```javascript
// ✅ Componente funcional con hooks
const ProductList = ({ category }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadProducts();
  }, [category]);
  
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/products?category=${category}`);
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      {loading ? <CircularProgress /> : (
        products.map(p => <ProductCard key={p.id} {...p} />)
      )}
    </Box>
  );
};
```

**Estilos con MUI**:
```javascript
// ✅ Usar sx prop
<Box sx={{ display: 'flex', gap: 2, p: 3 }}>
  <Button variant="contained" color="primary">Acción</Button>
</Box>

// ❌ Evitar inline styles
<div style={{ display: 'flex' }}>...</div>
```

### Backend (FastAPI)

```python
# ✅ Router con documentación
@router.get("/items")
async def list_items(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> List[ItemResponse]:
    """
    Lista items con paginación.
    
    Args:
        page: Número de página
        limit: Items por página (max 100)
    """
    if limit > 100:
        raise HTTPException(400, "Limit max: 100")
    
    offset = (page - 1) * limit
    return db.query(Item).offset(offset).limit(limit).all()
```

**Manejo de errores**:
```python
try:
    result = await api_call()
    return {"success": True, "data": result}
except HTTPException:
    raise
except Exception as e:
    logger.error(f"Error: {e}")
    raise HTTPException(500, str(e))
```

### Base de Datos

```python
# models.py
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

# schemas.py
class ProductCreate(BaseModel):
    name: str
    price: float
    stock: int = 0

class ProductResponse(ProductCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True
```

---

## 🚀 INSTALACIÓN Y EJECUCIÓN

### Requisitos
- Python 3.8+
- Node.js 14+
- npm o yarn

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

### Iniciar Ambos

```bash
# Windows
iniciar.bat

# Linux/Mac
./iniciar.sh
```

---

## 📝 NOTAS IMPORTANTES

### Tecnologías Requeridas
- **Frontend**: React/Vite + Material-UI
- **Backend**: Python + FastAPI (o Flask) + MySQL (o SQLite)

### Mantener Consistencia
- Mismo diseño visual (colores, tipografía, layout)
- Misma estructura de carpetas
- Mismos patrones de código
- Documentación clara en cada módulo

### Escalabilidad
- Código modular y reutilizable
- Servicios separados de rutas
- Componentes pequeños y específicos
- Máximo 300 líneas por archivo

### Legibilidad
- Nombres descriptivos
- Comentarios en funciones complejas
- Documentación de APIs
- Ejemplos de uso

---

## 📧 CONTACTO Y SOPORTE

Para dudas sobre la implementación, consultar:
- Documentación de Material-UI: https://mui.com
- Documentación de FastAPI: https://fastapi.tiangolo.com
- Documentación de React: https://react.dev

---

**Fin de la Documentación Técnica**
