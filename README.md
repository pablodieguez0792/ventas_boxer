# Sistema de Gestión de Ventas Multi-Plataforma - Ventas Boxer

Sistema integral de gestión de ventas para autopartes con soporte multi-tienda (MercadoLibre, TiendaNube, Shopify) desarrollado con Python (backend) y React + Material-UI (frontend).

## 🚀 Características Principales

### **Sistema POS Tradicional**
- **Búsqueda Fuzzy**: Búsqueda inteligente por nombre, código, marca y aplicación de vehículo
- **Dos Perfiles de Usuario**: 
  - Experto: Búsqueda rápida por códigos
  - Vendedor/Novato: Búsqueda visual con fotos y detalles
- **Vistas Duales**: Lista (densidad) y Tarjetas (visual)
- **Gestión Completa**: Ventas, Caja, Presupuestos, Remitos y Facturación

### **Sistema de Gestión MercadoLibre**
- **Gestión Unificada de Ventas**: Centralización de ventas de múltiples plataformas
- **Sistema de Filtros Jerárquicos**: 8 niveles de filtrado cascada
- **Control de Armado con Escáner**: Sistema de verificación por códigos de barras
- **Estados Logísticos**: Seguimiento completo desde preparación hasta entrega
- **Gestión Visual**: Tarjetas de ventas con imágenes de productos
- **Configuración Avanzada**: Sistema unificado de gestión de costos y precios con simulador

## 📁 Estructura del Proyecto

```
ventas_boxer/
├── backend/                    # API Python (FastAPI)
│   ├── main.py                # Servidor principal
│   ├── api_routes.py          # Rutas de la API
│   ├── database.py            # Gestión de base de datos
│   ├── models.py              # Modelos de datos
│   ├── pos_autopartes.db      # Base de datos SQLite
│   └── static/images/         # Imágenes de productos
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   │   └── CascadingFilters.js
│   │   ├── contexts/          # Contextos de React
│   │   ├── data/              # Datos mock
│   │   │   └── mockData.js    # 50 ventas de prueba
│   │   ├── pages/             # Páginas principales
│   │   │   └── mercadolibre/  # Módulo MercadoLibre
│   │   │       ├── VentasUnificadas.js
│   │   │       ├── Configuracion.js
│   │   │       └── MisPublicaciones.js
│   │   └── App.js             # Componente principal
│   ├── public/
│   ├── package.json
│   └── build/                 # Build de producción
├── requirements.txt           # Dependencias Python
├── start-app.bat             # Script de inicio Windows
├── start-app.ps1             # Script PowerShell
└── README.md
```

## 🛠️ Instalación y Configuración

### **Requisitos Previos**
- Python 3.8+
- Node.js 14+
- npm o yarn

### **Instalación Automática**
```bash
# Windows (Ejecutar como Administrador)
./start-app.bat

# O usando PowerShell
./start-app.ps1
```

### **Instalación Manual**

#### **Backend**
```bash
cd backend
pip install -r ../requirements.txt
python main.py
```
*El backend se ejecutará en: http://localhost:8000*

#### **Frontend**
```bash
cd frontend
npm install
npm start
```
*El frontend se ejecutará en: http://localhost:3000*

## 📊 Módulos del Sistema

### **1. Módulo POS Tradicional**
**Ubicación**: `/` (Raíz de la aplicación)

**Funcionalidades**:
- Búsqueda inteligente de productos
- Gestión de carritos de compra
- Cálculo automático de precios
- Generación de presupuestos
- Control de stock en tiempo real

**Flujos de Trabajo**:
- **Enviar a Caja**: Venta pendiente de facturación
- **Guardar Presupuesto**: Cotización para cliente
- **Generar Remito**: Orden de venta sin descuento de stock
- **Facturar**: Venta final con descuento de stock

### **2. Módulo MercadoLibre**

#### **2.1 Ventas Unificadas**
**Ubicación**: `/mercadolibre/ventas-unificadas`

**Funcionalidades Principales**:

#### **🔍 Sistema de Filtros Avanzados**
- **Filtros por Tienda**: MercadoLibre, TiendaNube, Shopify
- **Filtros Jerárquicos**: 8 niveles de filtrado en cascada
  - Nivel 1: Estados Generales (A ENVIAR, ENVIADO, ENTREGADO, etc.)
  - Nivel 2: Tipos de Envío (FLEX, COLECTA, TURBO, etc.)
  - Nivel 3: Ubicaciones (CABA, CORDON 1, CORDON 2)
  - Nivel 4-8: Estados específicos de control y mensajería
- **Búsqueda por Texto**: Filtrado por número de venta, cliente, producto
- **Filtros por Fecha**: Rango de fechas personalizable

#### **📦 Gestión de Estados Logísticos**
Estados del flujo de trabajo:
1. **Para Preparar** (🟠): Pedido recibido, listo para armar
2. **Etiqueta Impresa** (🔵): Etiqueta de envío generada
3. **Controlada** (🟣): Paquete verificado y armado
4. **Lista para Enviar** (🟣): Preparado para despacho
5. **Facturada** (🟢): Facturación completada
6. **Entregada** (🟢): Entrega confirmada

#### **🏷️ Sistema de Control de Armado**
**Modal de Armado con Escáner**:
- **Barra de Búsqueda**: Para escaneo de códigos de barras
- **Lista de Productos**: Muestra todos los artículos del pedido
- **Información Detallada por Producto**:
  - Stock disponible
  - Marca del producto
  - Código SKU interno
  - Código original del fabricante
  - Ubicación en almacén
- **Feedback Visual**: 
  - ✅ Verde cuando el código es correcto
  - ⏳ Amarillo para artículos pendientes
- **Progreso en Tiempo Real**: Barra de progreso y contador
- **Validación Completa**: Botón de guardado solo aparece cuando todos los artículos están escaneados

#### **🎯 Acciones Rápidas por Estado**
- **Para Preparar**: Imprimir Etiqueta, Armar Paquete
- **Etiqueta Impresa**: Controlar, Asignar Mensajería
- **Controlada**: Listar para Envío, Generar Remito
- **Lista para Enviar**: Facturar, Enviar
- **Facturada**: Ver Detalles, Seguimiento

#### **📱 Interfaz de Usuario**
- **Tarjetas Visuales**: Cada venta se muestra en una tarjeta completa
- **Imágenes de Productos**: Fotos reales de los artículos (80x80px)
- **Información Completa**: Cliente, dirección, envío, total, estado
- **Selección Múltiple**: Para acciones en lote
- **Responsive Design**: Adaptable a diferentes tamaños de pantalla

#### **📈 Gestión de Datos**
- **50 Ventas de Prueba**: Datos realistas para testing
- **20 Productos Diferentes**: Con imágenes, códigos y ubicaciones
- **15 Clientes Diversos**: Con direcciones de toda Argentina
- **Estados Aleatorios**: Para simular flujo de trabajo real

#### **2.2 Configuración Avanzada**
**Ubicación**: `/mercadolibre/configuracion`

**Funcionalidades del Sistema de Configuración**:

##### **💰 Gestión Unificada de Costos y Porcentajes**
- **Costos Dinámicos**: Cada costo puede ser configurado como monto fijo ($) o porcentaje (%)
- **Habilitación Individual**: Switch para activar/desactivar cada costo independientemente
- **Costos Predefinidos**:
  - Embalaje (costo fijo por defecto)
  - IIBB (Ingresos Brutos)
  - PADS (Percepción AFIP)
  - Oferta (descuentos especiales)
- **Agregar Costos Personalizados**: Posibilidad de crear nuevos costos con nombre y tipo personalizado

##### **🧮 Simulador de Precios en Tiempo Real**
- **Cálculo Automático**: Actualización instantánea al modificar cualquier parámetro
- **Campos Permanentes**:
  - **IVA**: 21% por defecto, configurable y activable/desactivable
  - **Ganancia**: 25% por defecto, configurable y activable/desactivable
- **Fórmula de Cálculo**:
  ```
  Precio Final = ((Costo Base × Ganancia) + Costos Fijos + Costo Fijo ML + Envío + IIBB + PADS + Oferta) × Comisión ML × IVA
  ```

##### **📦 Configuración de Envíos y Costos ML**
- **Costo de Envío**: Monto fijo configurable
- **Umbral de Envío Gratis**: Precio mínimo para envío gratuito
- **Comisión MercadoLibre**: Selección entre 14% o 36% según tipo de publicación
- **Costos Fijos ML por Rango**: Configuración de costos según rangos de precio:
  - $0 - $15,000: $200
  - $15,001 - $50,000: $400
  - $50,001+: $600

##### **💾 Persistencia de Configuraciones**
- **Guardado Automático**: Todas las configuraciones se guardan automáticamente en la base de datos
- **Carga al Inicio**: Las configuraciones se restauran al abrir la aplicación
- **Validación de Datos**: Verificación de integridad de datos al cargar configuraciones
- **Manejo de Errores**: Fallback a valores por defecto si hay problemas de carga

##### **📊 Desglose Detallado de Precios**
- **Visualización Paso a Paso**: Muestra cada componente del cálculo final
- **Código de Colores**: Diferentes colores para identificar tipos de costos
- **Valores en Tiempo Real**: Actualización instantánea de todos los valores
- **Formato Monetario**: Presentación clara con dos decimales ($XX.XX)

## 🗄️ Base de Datos

### **Estructura Principal**
- **SQLite**: Base de datos local para desarrollo
- **Productos**: Catálogo completo con códigos, precios, stock
- **Ventas**: Registro de transacciones
- **Clientes**: Información de contacto y direcciones
- **Estados**: Seguimiento de logística
- **Configuraciones**: Almacenamiento de parámetros del sistema (costos, porcentajes, configuraciones ML)

### **Datos Mock para Testing**
El sistema incluye datos de prueba realistas:
- 50 ventas con diferentes estados logísticos
- 20 productos de autopartes con imágenes
- Códigos de barras simulados (SKU + Código Original)
- Ubicaciones de almacén (formato A1-B2)
- Stock y precios variables

## 🚀 Scripts de Inicio

### **start-app.bat** (Windows)
Script automatizado que:
1. Inicia el backend en puerto 8000
2. Inicia el frontend en puerto 3000
3. Abre automáticamente el navegador
4. Gestiona ambos procesos simultáneamente

### **start-app.ps1** (PowerShell)
Versión PowerShell con las mismas funcionalidades

## 🔧 Configuración de Desarrollo

### **Variables de Entorno**
```bash
# Backend
BACKEND_PORT=8000
DATABASE_URL=sqlite:///pos_autopartes.db

# Frontend
REACT_APP_API_URL=http://localhost:8000
PORT=3000
```

### **Puertos por Defecto**
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Documentación API**: http://localhost:8000/docs

## 📝 Flujos de Trabajo Principales

### **Flujo POS Tradicional**
1. Búsqueda de producto → Agregar al carrito → Calcular total → Generar venta

### **Flujo MercadoLibre**
1. **Recepción**: Venta llega con estado "Para Preparar"
2. **Configuración**: Ajustar costos, porcentajes y parámetros de cálculo
3. **Armado**: Usar modal de escáner para verificar productos
4. **Control**: Marcar como "Controlada" al completar escáner
5. **Envío**: Procesar etiquetas y asignar mensajería
6. **Facturación**: Completar proceso administrativo con precios calculados
7. **Entrega**: Confirmar recepción del cliente

## 🎨 Tecnologías Utilizadas

### **Backend**
- **FastAPI**: Marco de trabajo web moderno y rápido
- **SQLite**: Base de datos ligera
- **Pydantic**: Validación de datos
- **Uvicorn**: Servidor ASGI

### **Frontend**
- **React 18**: Biblioteca de interfaces de usuario
- **Material-UI v5**: Componentes de diseño
- **React Router**: Navegación de aplicación de página única
- **Axios**: Cliente HTTP

## 📞 Soporte y Mantenimiento

Para reportar problemas o solicitar nuevas funcionalidades, contacte al equipo de desarrollo.

---

**Versión**: 2.0.0  
**Última Actualización**: Enero 2025  
**Desarrollado por**: Equipo Ventas Boxer
