import sqlite3
import json
import random

# Connect to the database
conn = sqlite3.connect('publicaciones.db')
cursor = conn.cursor()

# Extract key columns for frontend use
query = """
SELECT 
    item_id,
    title,
    price,
    original_price,
    available_quantity,
    listing_type_id,
    status,
    permalink,
    attributes_json,
    brand
FROM publicaciones 
LIMIT 50
"""

cursor.execute(query)
rows = cursor.fetchall()

# Sample images for different product types
sample_images = [
    '/static/images/amortiguador.jpg',
    '/static/images/pastillas-freno.jpg', 
    '/static/images/filtro-aceite.jpg',
    '/static/images/kit-embrague.jpg',
    '/static/images/bujias.jpg',
    '/static/images/radiador.jpg',
    '/static/images/bomba-combustible.jpg',
    '/static/images/kit-frenos.jpg',
    '/static/images/alternador.jpg',
    '/static/images/kit-distribucion.jpg'
]

publications = []
for i, row in enumerate(rows):
    # Parse attributes to extract SKU
    attributes = json.loads(row[8]) if row[8] else []
    brand = row[9] if row[9] else "BOXER"  # Use brand from database
    sku = f"BOX-{i+1:03d}"  # Default SKU
    
    for attr in attributes:
        if attr.get('id') == 'SELLER_SKU':
            sku = attr.get('value_name', f"BOX-{i+1:03d}")
    
    # Determine publication type
    pub_type = 'Premium' if row[5] == 'gold_pro' else 'Clásica'
    quota = '3/5' if pub_type == 'Premium' else '0/0'
    
    # Random combo status
    is_combo = random.choice([True, False, False, False])  # 25% chance
    
    publication = {
        'id': f'pub-{i+1}',
        'internalCode': sku,
        'mlaCode': row[0],  # item_id
        'title': row[1][:60] + '...' if len(row[1]) > 60 else row[1],
        'brand': brand,
        'imageUrl': random.choice(sample_images),
        'regularPrice': float(row[2]) if row[2] else 0,
        'offerPrice': float(row[3]) if row[3] and row[3] != row[2] else None,
        'suggestedPrice': float(row[2]) * 1.1 if row[2] else 0,
        'publicationType': pub_type,
        'quota': quota,
        'stock': int(row[4]) if row[4] else 0,
        'status': 'Activa' if row[6] == 'active' else 'Pausada',
        'isCombo': is_combo,
        'comboItems': [
            {'code': f'ITEM-{j}', 'name': f'Componente {j}', 'quantity': 1}
            for j in range(1, random.randint(2, 4))
        ] if is_combo else [],
        'variants': [
            {'attribute': 'Marca', 'value': brand},
            {'attribute': 'SKU', 'value': sku}
        ],
        'netPrice': float(row[2]) * 0.8 if row[2] else 0,
        'discountedPrice': float(row[2]) * 0.9 if row[2] else 0,
        'ignoreStock': random.choice([True, False]),
        'neverPause': random.choice([True, False])
    }
    
    publications.append(publication)

# Write to JavaScript file
js_content = f"""// Real publications data from database
export const realPublications = {json.dumps(publications, indent=2, ensure_ascii=False)};

// Default calculation percentages for price calculator
export const defaultCalculationPercentages = [
  {{ id: 1, name: 'Ganancia Estándar', percentage: 25, enabled: true }},
  {{ id: 2, name: 'Ganancia Premium', percentage: 35, enabled: true }},
  {{ id: 3, name: 'Comisión ML', percentage: 12, enabled: true }},
  {{ id: 4, name: 'Envío Gratis', percentage: 8, enabled: true }},
  {{ id: 5, name: 'Promoción Bancaria', percentage: 15, enabled: false }}
];
"""

with open('frontend/src/data/realPublications.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Extracted {len(publications)} publications to realPublications.js")
print("Sample publication:")
print(json.dumps(publications[0], indent=2, ensure_ascii=False))

conn.close()
