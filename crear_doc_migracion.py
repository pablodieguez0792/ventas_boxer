"""
Script para crear documentación de migración MercadoLibre a Tienda Nube
"""

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def crear_documento():
    doc = Document()
    
    # Título principal
    title = doc.add_heading('Migración de Publicaciones: MercadoLibre → Tienda Nube', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Información del proyecto
    doc.add_paragraph('Sistema: Ventas Boxer')
    doc.add_paragraph('Fecha: Diciembre 2025')
    doc.add_paragraph('Versión: 1.0')
    doc.add_paragraph()
    
    # Sección 1: Flujo Completo
    doc.add_heading('1. Flujo Completo de Migración', 1)
    
    doc.add_heading('1.1 Obtener Publicaciones de MercadoLibre', 2)
    
    p = doc.add_paragraph('Endpoint Frontend:')
    p.add_run('\nGET /api/mercadolibre/items-for-tiendanube?limit=50&status=active').bold = True
    
    p = doc.add_paragraph('\nEndpoint Backend:')
    code = doc.add_paragraph('@router.get(\'/items-for-tiendanube\')', style='Intense Quote')
    
    p = doc.add_paragraph('\nHeaders:')
    doc.add_paragraph('Authorization: Bearer {access_token}', style='List Bullet')
    doc.add_paragraph('Content-Type: application/json', style='List Bullet')
    
    p = doc.add_paragraph('\nRespuesta JSON:')
    doc.add_paragraph('''{
  "success": true,
  "data": {
    "items": [...],           // Productos mapeados para TN
    "original_items": [...]   // Productos originales de ML
  }
}''', style='Intense Quote')
    
    # Sección 2: Estructura de Datos
    doc.add_page_break()
    doc.add_heading('2. Estructura de Datos en MercadoLibre', 1)
    
    doc.add_paragraph('Ejemplo de producto obtenido de MercadoLibre:')
    doc.add_paragraph('''{
  "id": "MLA123456789",
  "title": "Filtro de Aceite Mann W719/30",
  "price": 15000,
  "original_price": 18000,
  "available_quantity": 25,
  "seller_custom_field": "SKU-001",
  "status": "active",
  "pictures": [
    {"secure_url": "https://...jpg"},
    {"secure_url": "https://...jpg"}
  ],
  "shipping": {
    "free_shipping": true,
    "mode": "me2",
    "dimensions": null
  },
  "attributes": [
    {"id": "WEIGHT", "value_name": "500 g"},
    {"id": "WIDTH", "value_name": "10 cm"},
    {"id": "HEIGHT", "value_name": "15 cm"},
    {"id": "LENGTH", "value_name": "20 cm"}
  ]
}''', style='Intense Quote')
    
    # Sección 3: Transformación
    doc.add_page_break()
    doc.add_heading('3. Transformación a Formato Tienda Nube', 1)
    
    doc.add_paragraph('El producto de MercadoLibre se transforma al siguiente formato:')
    doc.add_paragraph('''{
  "name": {
    "es": "Filtro de Aceite Mann W719/30"
  },
  "description": {
    "es": "<p>Descripción del producto</p>"
  },
  "published": true,
  "free_shipping": true,
  "variants": [{
    "price": "15000",
    "promotional_price": "18000",
    "stock": 25,
    "sku": "SKU-001",
    "weight": "0.5",
    "width": "10",
    "height": "15",
    "depth": "20"
  }],
  "images": [
    {"src": "https://http2.mlstatic.com/...jpg"},
    {"src": "https://http2.mlstatic.com/...jpg"}
  ],
  "seo_title": {
    "es": "Filtro de Aceite Mann W719/30"
  },
  "seo_description": {
    "es": "Descripción SEO del producto"
  }
}''', style='Intense Quote')
    
    # Sección 4: Tabla de Mapeo
    doc.add_page_break()
    doc.add_heading('4. Tabla de Mapeo Campo por Campo', 1)
    
    # Crear tabla
    table = doc.add_table(rows=1, cols=5)
    table.style = 'Light Grid Accent 1'
    
    # Encabezados
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'MercadoLibre'
    hdr_cells[1].text = 'Tipo ML'
    hdr_cells[2].text = 'Tienda Nube'
    hdr_cells[3].text = 'Tipo TN'
    hdr_cells[4].text = 'Notas'
    
    # Datos
    mapeos = [
        ('id', 'string', 'variants[0].sku', 'string', 'Si no hay seller_custom_field'),
        ('title', 'string', 'name.es', 'string', 'Título del producto'),
        ('price', 'number', 'variants[0].price', 'STRING', 'Convertir a string'),
        ('original_price', 'number', 'variants[0].promotional_price', 'STRING', 'Solo si > price'),
        ('available_quantity', 'number', 'variants[0].stock', 'number', 'Stock disponible'),
        ('seller_custom_field', 'string', 'variants[0].sku', 'string', 'SKU personalizado'),
        ('status', 'string', 'published', 'boolean', 'active → true'),
        ('pictures[].secure_url', 'string', 'images[].src', 'string', 'URLs de imágenes'),
        ('shipping.free_shipping', 'boolean', 'free_shipping', 'boolean', 'Envío gratis'),
        ('attributes[WEIGHT]', 'string', 'variants[0].weight', 'string', 'Convertir g → kg'),
        ('attributes[WIDTH]', 'string', 'variants[0].width', 'string', 'En cm'),
        ('attributes[HEIGHT]', 'string', 'variants[0].height', 'string', 'En cm'),
        ('attributes[LENGTH]', 'string', 'variants[0].depth', 'string', 'ML usa length, TN usa depth'),
    ]
    
    for ml_field, ml_type, tn_field, tn_type, nota in mapeos:
        row_cells = table.add_row().cells
        row_cells[0].text = ml_field
        row_cells[1].text = ml_type
        row_cells[2].text = tn_field
        row_cells[3].text = tn_type
        row_cells[4].text = nota
    
    # Sección 5: Envío a Tienda Nube
    doc.add_page_break()
    doc.add_heading('5. Envío a Tienda Nube', 1)
    
    doc.add_heading('5.1 Endpoint de Tienda Nube', 2)
    p = doc.add_paragraph()
    p.add_run('POST ').bold = True
    p.add_run('https://api.tiendanube.com/v1/{store_id}/products')
    
    doc.add_heading('5.2 Headers Requeridos', 2)
    doc.add_paragraph('Authentication: bearer {access_token}', style='List Bullet')
    doc.add_paragraph('Content-Type: application/json', style='List Bullet')
    doc.add_paragraph('User-Agent: VentasBoxer/1.0 (soporte@ventasboxer.com)', style='List Bullet')
    
    doc.add_heading('5.3 Código Backend (Python)', 2)
    doc.add_paragraph('''def create_product(self, product_data):
    print(f"[TN] Creando producto: {product_data.get('name', {}).get('es')}")
    print(f"[TN] Variante a enviar: {product_data.get('variants', [{}])[0]}")
    
    result = self._make_request('POST', 'products', data=product_data)
    
    print(f"[TN] Producto creado con ID: {result.get('id')}")
    return result''', style='Intense Quote')
    
    # Sección 6: Consideraciones Importantes
    doc.add_page_break()
    doc.add_heading('6. Consideraciones Importantes', 1)
    
    doc.add_heading('6.1 Dimensiones', 2)
    doc.add_paragraph('MercadoLibre: attributes con IDs WEIGHT, WIDTH, HEIGHT, LENGTH', style='List Bullet')
    doc.add_paragraph('Tienda Nube: variants[0] con weight, width, height, depth', style='List Bullet')
    doc.add_paragraph('Conversión automática: Gramos → Kilogramos', style='List Bullet')
    
    doc.add_heading('6.2 Precios (CRÍTICO)', 2)
    p = doc.add_paragraph()
    p.add_run('MercadoLibre: ').bold = True
    p.add_run('Números (15000)')
    p = doc.add_paragraph()
    p.add_run('Tienda Nube: ').bold = True
    p.add_run('STRINGS ("15000")').bold = True
    run = p.add_run(' ⚠️ Los precios DEBEN ser strings o la API falla')
    run.font.color.rgb = RGBColor(255, 0, 0)
    
    doc.add_heading('6.3 Imágenes', 2)
    doc.add_paragraph('MercadoLibre: Array de objetos con secure_url', style='List Bullet')
    doc.add_paragraph('Tienda Nube: Array de objetos con src', style='List Bullet')
    doc.add_paragraph('Máximo 10 imágenes por producto', style='List Bullet')
    
    doc.add_heading('6.4 SKU', 2)
    doc.add_paragraph('Prioridad: seller_custom_field → id', style='List Bullet')
    doc.add_paragraph('Debe ser único en Tienda Nube', style='List Bullet')
    
    doc.add_heading('6.5 Descripción', 2)
    doc.add_paragraph('Se genera HTML básico si no existe', style='List Bullet')
    doc.add_paragraph('Máximo 160 caracteres para SEO', style='List Bullet')
    
    # Sección 7: Logs de Debug
    doc.add_page_break()
    doc.add_heading('7. Logs de Debug', 1)
    
    doc.add_paragraph('Ejemplo de logs en consola del backend:')
    doc.add_paragraph('''[ML] ✓ Item MLA123456789: peso=0.5kg, ancho=10cm, alto=15cm, largo=20cm
[ML→TN] ✓ Agregando peso: 0.5 kg
[ML→TN] ✓ Agregando ancho: 10 cm
[ML→TN] ✓ Agregando alto: 15 cm
[ML→TN] ✓ Agregando profundidad: 20 cm
[ML→TN] Variante final: {'price': '15000', 'stock': 25, 'sku': 'SKU-001', ...}
[TN] Creando producto: Filtro de Aceite Mann W719/30
[TN] Variante a enviar: {'price': '15000', 'promotional_price': '18000', ...}
[TN] Producto creado con ID: 123456''', style='Intense Quote')
    
    # Sección 8: Archivos del Sistema
    doc.add_page_break()
    doc.add_heading('8. Archivos Relevantes del Sistema', 1)
    
    doc.add_heading('8.1 Backend', 2)
    doc.add_paragraph('mercadolibre_service.py (Línea 331-430): Mapeo ML → TN', style='List Bullet')
    doc.add_paragraph('mercadolibre_routes.py (Línea 63): Endpoint /items-for-tiendanube', style='List Bullet')
    doc.add_paragraph('tiendanube_service.py (Línea 143): Creación de productos', style='List Bullet')
    doc.add_paragraph('tiendanube_routes.py (Línea 93): Endpoint POST /products', style='List Bullet')
    
    doc.add_heading('8.2 Frontend', 2)
    doc.add_paragraph('TiendaNubeAPI.js (Línea 565-590): Carga de publicaciones ML', style='List Bullet')
    doc.add_paragraph('TiendaNubeAPI.js (Línea 618): Migración de productos seleccionados', style='List Bullet')
    doc.add_paragraph('TiendaNubeAPI.js (Línea 1333-1429): Tabla con checkboxes', style='List Bullet')
    
    # Sección 9: Ejemplo Completo
    doc.add_page_break()
    doc.add_heading('9. Ejemplo Completo de Uso', 1)
    
    doc.add_heading('9.1 Paso 1: Cargar Publicaciones', 2)
    doc.add_paragraph('1. Ir a pestaña "MercadoLibre"')
    doc.add_paragraph('2. Click en "Cargar Publicaciones"')
    doc.add_paragraph('3. Se obtienen hasta 50 publicaciones activas')
    doc.add_paragraph('4. Se muestran en tabla con checkboxes')
    
    doc.add_heading('9.2 Paso 2: Seleccionar Productos', 2)
    doc.add_paragraph('1. Revisar la tabla de productos mapeados')
    doc.add_paragraph('2. Verificar precios, stock y dimensiones')
    doc.add_paragraph('3. Seleccionar productos con checkboxes')
    doc.add_paragraph('4. Usar "Seleccionar Todos" si es necesario')
    
    doc.add_heading('9.3 Paso 3: Migrar a Tienda Nube', 2)
    doc.add_paragraph('1. Click en "Migrar Seleccionados a Tienda Nube"')
    doc.add_paragraph('2. El sistema envía cada producto individualmente')
    doc.add_paragraph('3. Se muestran alertas de éxito/error')
    doc.add_paragraph('4. Revisar logs en consola del backend')
    
    # Guardar documento
    filename = 'DOCUMENTACION_MIGRACION_ML_TN.docx'
    doc.save(filename)
    print(f'[OK] Documento creado: {filename}')
    return filename

if __name__ == '__main__':
    crear_documento()
