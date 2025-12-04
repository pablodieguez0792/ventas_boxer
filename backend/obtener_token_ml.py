#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
obtener_token_ml.py - Autorización de Mercado Libre con soporte PKCE

Script para obtener tokens para la API de MercadoLibre usando flujo PKCE.

Uso:
1. python obtener_token_ml.py --auth           # Genera URL para autorizar la aplicación
2. python obtener_token_ml.py --save CODIGO    # Guarda token con el código obtenido
3. python obtener_token_ml.py --check          # Verifica estado del token actual
4. python obtener_token_ml.py --refresh        # Fuerza el refresco del token actual

Para usar en otros módulos:
  from obtener_token_ml import get_valid_access_token
  token = get_valid_access_token()
"""

import argparse
import base64
import hashlib
import json
import os
import random
import string
import time
from datetime import datetime

import requests

# ===========================================================================
# CONFIGURACIÓN
# ===========================================================================
CLIENT_ID = "4931374040797178"
CLIENT_SECRET = "XSdBaKPmqS1eXSoM6GUqwLwKFuREFDW6"
REDIRECT_URI = "https://warnesdodgesrl.ngrok.app/callback"
TOKEN_URL = "https://api.mercadolibre.com/oauth/token"

# Archivos para guardar token y datos PKCE
TOKEN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mercadolibre_token.json")
PKCE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pkce_verifier_ml.json")
EXPIRE_MARGIN = 300  # segundos antes de expiración para refrescar

# ===========================================================================
# FUNCIONES PKCE (Proof Key for Code Exchange)
# ===========================================================================
def generate_code_verifier():
    """Genera un code_verifier aleatorio según especificación PKCE"""
    code_verifier = ''.join(random.choice(string.ascii_letters + string.digits + '-._~') 
                          for _ in range(96))
    return code_verifier

def generate_code_challenge(code_verifier):
    """Genera code_challenge a partir del code_verifier usando el método S256"""
    code_challenge_bytes = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(code_challenge_bytes).decode('utf-8')
    return code_challenge.replace('=', '')

def save_pkce_data(code_verifier):
    pkce_data = {
        "code_verifier": code_verifier,
        "generated_at": time.time()
    }
    with open(PKCE_FILE, "w") as f:
        json.dump(pkce_data, f, indent=4)

def load_pkce_data():
    if os.path.exists(PKCE_FILE):
        try:
            with open(PKCE_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error al leer datos PKCE: {e}")
    return None

# ===========================================================================
# FUNCIONES PRINCIPALES
# ===========================================================================
def save_token(token_data):
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f, indent=4)
    print(f"[OK] Token guardado en {TOKEN_FILE}")
    if os.path.exists(PKCE_FILE):
        try:
            os.remove(PKCE_FILE)
        except Exception:
            pass

def load_token():
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error al leer token: {e}")
    return None

def get_auth_url():
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    save_pkce_data(code_verifier)
    url = (
        f"https://auth.mercadolibre.com/authorization?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&code_challenge={code_challenge}&code_challenge_method=S256"
        f"&scope=offline_access%20read%20write%20fulfillment"
    )
    print("\n[AUTH] Autoriza la aplicación visitando este enlace:\n")
    print(url)
    print("\n[INFO] Cuando autorices y obtengas el código, ejecuta:")
    print("python obtener_token_ml.py --save TU_CODIGO\n")
    return url

def save_token_from_code(auth_code):
    pkce_data = load_pkce_data()
    if not pkce_data:
        print("[ERROR] No se encontró code_verifier. Ejecuta primero --auth.")
        return
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": auth_code,
        "redirect_uri": REDIRECT_URI,
        "code_verifier": pkce_data["code_verifier"],
    }
    r = requests.post(TOKEN_URL, data=data)
    if r.status_code == 200:
        save_token(r.json())
        print("[OK] Token obtenido y guardado exitosamente!")
    else:
        print(f"[ERROR] Error al obtener token: {r.status_code} {r.text}")

def refresh_token():
    token = load_token()
    if not token or "refresh_token" not in token:
        print("[ERROR] No hay refresh_token para refrescar.")
        return
    print("[INFO] Refrescando token...")
    data = {
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": token["refresh_token"],
    }
    r = requests.post(TOKEN_URL, data=data)
    if r.status_code == 200:
        save_token(r.json())
        print("[OK] Token refrescado exitosamente!")
    else:
        print(f"[ERROR] Error al refrescar token: {r.status_code} {r.text}")

def check_token():
    token = load_token()
    if not token:
        print("[ERROR] No hay token guardado.")
        return
    expires_at = token.get("expires_in", 0) + token.get("created_at", 0)
    queda = expires_at - int(time.time())
    print(f"\n[INFO] Estado del Token:")
    print(f"   Valido: {'Si' if queda > 0 else 'No'}")
    print(f"   Segundos restantes: {queda}")
    print(f"   User ID: {token.get('user_id')}")
    print(f"\n[INFO] Token completo:")
    print(json.dumps(token, indent=4))

def get_valid_access_token():
    token = load_token()
    if not token:
        raise Exception("No hay token guardado. Ejecuta --auth y --save primero.")
    expires_at = token.get("expires_in", 0) + token.get("created_at", 0)
    queda = expires_at - int(time.time())
    if queda < EXPIRE_MARGIN:
        print("[INFO] Refrescando token...")
        refresh_token()
        token = load_token()
    return token["access_token"]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Obtener token MercadoLibre PKCE")
    parser.add_argument("--auth", action="store_true", help="Generar URL de autorización")
    parser.add_argument("--save", type=str, help="Guardar token usando código de autorización")
    parser.add_argument("--refresh", action="store_true", help="Refrescar token actual")
    parser.add_argument("--check", action="store_true", help="Verificar token actual")
    args = parser.parse_args()
    
    if args.auth:
        get_auth_url()
    elif args.save:
        save_token_from_code(args.save)
    elif args.refresh:
        refresh_token()
    elif args.check:
        check_token()
    else:
        parser.print_help()
