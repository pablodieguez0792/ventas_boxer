import json
import os
from datetime import datetime
from typing import Optional, Dict, Any

class TokenStorage:
    """Clase para persistir tokens RSF en archivo JSON"""
    
    def __init__(self, storage_file: str = "rsf_token.json"):
        self.storage_file = storage_file
    
    def save_token(self, token_data: Dict[str, Any]) -> None:
        """
        Guarda los datos del token en archivo
        
        Args:
            token_data: Diccionario con datos del token
        """
        try:
            with open(self.storage_file, 'w') as f:
                json.dump(token_data, f, indent=2)
        except Exception as e:
            print(f"Error guardando token: {e}")
    
    def load_token(self) -> Optional[Dict[str, Any]]:
        """
        Carga los datos del token desde archivo
        
        Returns:
            Diccionario con datos del token o None si no existe
        """
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error cargando token: {e}")
        return None
    
    def clear_token(self) -> None:
        """Elimina el archivo de token"""
        try:
            if os.path.exists(self.storage_file):
                os.remove(self.storage_file)
        except Exception as e:
            print(f"Error eliminando token: {e}")
    
    def is_token_valid(self, token_data: Dict[str, Any]) -> bool:
        """
        Verifica si el token es válido (no expirado)
        
        Args:
            token_data: Datos del token
            
        Returns:
            True si el token es válido
        """
        if not token_data or 'token_expires_at' not in token_data:
            return False
        
        try:
            expires_at = datetime.fromisoformat(token_data['token_expires_at'])
            return datetime.now() < expires_at
        except Exception:
            return False
