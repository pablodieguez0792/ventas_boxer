"""
Configuración para la integración con Tienda Nube.
"""

import os
import json
from datetime import datetime

# Rutas de archivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(BASE_DIR, "tiendanube_token.json")

# URLs de la API
API_URL_BASE = "https://api.tiendanube.com/v1"
AUTH_URL = "https://www.tiendanube.com/apps/authorize"
TOKEN_URL = "https://www.tiendanube.com/apps/authorize/token"

# Configuración de la aplicación (desde variables de entorno o valores por defecto)
TIENDANUBE_CONFIG = {
    "client_id": os.getenv("TIENDANUBE_CLIENT_ID", "17976"),
    "client_secret": os.getenv("TIENDANUBE_CLIENT_SECRET", "ab343a09e2cad932691360cb736b75bc777649e6fc0d3ab0"),
    "store_id": os.getenv("TIENDANUBE_STORE_ID", "6256320"),
    "redirect_uri": os.getenv("TIENDANUBE_REDIRECT_URI", "http://localhost:5000/callback"),
    "scopes": [
        "read_products",
        "write_products",
        "read_orders",
        "write_orders",
        "read_customers",
        "write_customers",
        "read_content",
        "write_content"
    ]
}

def load_token():
    """Carga el token de acceso desde el archivo"""
    try:
        if os.path.exists(TOKEN_FILE):
            with open(TOKEN_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error al cargar token: {str(e)}")
        return None

def save_token(token_data):
    """Guarda el token de acceso en el archivo"""
    try:
        token_data['obtained_at'] = datetime.now().isoformat()
        with open(TOKEN_FILE, 'w', encoding='utf-8') as f:
            json.dump(token_data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error al guardar token: {str(e)}")
        return False

def get_headers(access_token):
    """Obtiene los headers para las solicitudes a la API"""
    return {
        'Authentication': f"bearer {access_token}",
        'Content-Type': 'application/json',
        'User-Agent': 'VentasBoxer/1.0 (soporte@ventasboxer.com)'
    }
