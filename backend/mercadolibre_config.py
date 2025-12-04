"""
Configuración para la integración con MercadoLibre.
"""

import os
import json
from datetime import datetime

# Rutas de archivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(BASE_DIR, "mercadolibre_token.json")

# URLs de la API
API_URL_BASE = "https://api.mercadolibre.com"

# Configuración de la aplicación
MERCADOLIBRE_CONFIG = {
    "user_id": 403794231,
    "site_id": "MLA",  # Argentina
    "client_id": os.getenv("ML_CLIENT_ID", "4931374040797178"),
    "client_secret": os.getenv("ML_CLIENT_SECRET", "XSdBaKPmqS1eXSoM6GUqwLwKFuREFDW6"),
    "redirect_uri": os.getenv("ML_REDIRECT_URI", "https://warnesdodgesrl.ngrok.app/callback"),
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
        if 'expires_at' not in token_data:
            token_data['expires_at'] = datetime.now().timestamp() + token_data.get('expires_in', 21600)
        with open(TOKEN_FILE, 'w', encoding='utf-8') as f:
            json.dump(token_data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error al guardar token: {str(e)}")
        return False

def get_headers(access_token):
    """Obtiene los headers para las solicitudes a la API"""
    return {
        'Authorization': f"Bearer {access_token}",
        'Content-Type': 'application/json',
    }
