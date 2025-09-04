import requests
import json

# Probar autenticación y búsqueda por VIN
def test_vin_search():
    base_url = "http://localhost:8000/api/promotive"
    
    # 1. Autenticar
    login_data = {
        "client_id": "8e4aa28708151c851ddceb70bd5cc8be",
        "client_secret": "45bd24d82eba8b8194d2c7fff2db027eb006768fc8241c2810f51daa716f8895"
    }
    
    print("Autenticando con SpecParts...")
    login_response = requests.post(f"{base_url}/login", json=login_data)
    print(f"Status: {login_response.status_code}")
    print(f"Response: {login_response.text}")
    
    if login_response.status_code != 200:
        print("Error en autenticacion")
        return
    
    # 2. Probar búsqueda por VIN específico
    test_vins = [
        "WAUGFEF58JA121588"  # VIN proporcionado por usuario
    ]
    
    for vin in test_vins:
        print(f"\nBuscando vehiculo por VIN: {vin}")
        
        search_response = requests.get(f"{base_url}/vehicle/identify?vin={vin}")
        print(f"Status: {search_response.status_code}")
        
        if search_response.status_code == 200:
            data = search_response.json()
            if data.get("success"):
                print("ENCONTRADO!")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
                # Obtener información técnica completa
                vehicle_code = data["data"]["code"]
                print(f"\nObteniendo informacion tecnica completa para codigo: {vehicle_code}")
                
                enrich_response = requests.get(f"{base_url}/vehicle/enrich/{vehicle_code}")
                print(f"Status enriquecimiento: {enrich_response.status_code}")
                if enrich_response.status_code == 200:
                    enrich_data = enrich_response.json()
                    print("INFORMACION TECNICA:")
                    print(json.dumps(enrich_data, indent=2, ensure_ascii=False))
                
                # Obtener partes compatibles
                print(f"\nObteniendo partes compatibles...")
                parts_response = requests.get(f"{base_url}/vehicle/parts?vehicle_id={vehicle_code}")
                print(f"Status partes: {parts_response.status_code}")
                if parts_response.status_code == 200:
                    parts_data = parts_response.json()
                    print("PARTES COMPATIBLES:")
                    print(json.dumps(parts_data, indent=2, ensure_ascii=False))
                
                break
            else:
                print(f"No encontrado: {data.get('message')}")
        else:
            print(f"Error: {search_response.text}")
    
    # También probar con patente argentina típica
    print(f"\nProbando con patente argentina tipica: ABC123")
    plate_response = requests.get(f"{base_url}/vehicle/identify?plate=ABC123")
    print(f"Status: {plate_response.status_code}")
    print(f"Response: {plate_response.text}")

if __name__ == "__main__":
    test_vin_search()
