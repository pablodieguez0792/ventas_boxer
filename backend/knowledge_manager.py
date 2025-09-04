#!/usr/bin/env python3
"""
Gestor de base de conocimiento para el chatbot BOXER
"""

import json
import os
from typing import Dict, List, Optional

class KnowledgeManager:
    def __init__(self, knowledge_file: str = "backend/knowledge_base.json"):
        self.knowledge_file = knowledge_file
        self.knowledge = self._load_knowledge()
    
    def _load_knowledge(self) -> Dict:
        """Carga la base de conocimiento desde el archivo JSON."""
        try:
            if os.path.exists(self.knowledge_file):
                with open(self.knowledge_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return {}
        except Exception as e:
            print(f"Error cargando knowledge base: {e}")
            return {}
    
    def reload_knowledge(self):
        """Recarga la base de conocimiento (útil si se modifica el archivo)."""
        self.knowledge = self._load_knowledge()
    
    def get_best_practices(self, topic: str) -> Optional[Dict]:
        """Obtiene buenas prácticas para un tema específico."""
        return self.knowledge.get("buenas_practicas", {}).get(topic)
    
    def get_frequent_answer(self, query_key: str) -> Optional[str]:
        """Obtiene respuesta frecuente para una consulta común."""
        return self.knowledge.get("respuestas_frecuentes", {}).get(query_key)
    
    def search_relevant_content(self, user_message: str) -> List[Dict]:
        """Busca contenido relevante basado en el mensaje del usuario."""
        relevant_content = []
        message_lower = user_message.lower()
        
        # Palabras clave para diferentes temas
        keywords_map = {
            "organizacion_local": ["organizar", "local", "orden", "estante", "mostrador", "deposito"],
            "gestion_stock": ["stock", "inventario", "mercaderia", "repuesto", "faltante", "reposicion"],
            "atencion_cliente": ["cliente", "atencion", "venta", "garantia", "servicio"],
            "proveedores": ["proveedor", "compra", "entrega", "precio", "negociar"],
            "finanzas": ["plata", "dinero", "caja", "banco", "cobrar", "pagar", "ganancia", "margen"]
        }
        
        # Buscar en buenas prácticas
        for topic, keywords in keywords_map.items():
            if any(keyword in message_lower for keyword in keywords):
                practices = self.get_best_practices(topic)
                if practices:
                    relevant_content.append({
                        "type": "buenas_practicas",
                        "topic": topic,
                        "content": practices
                    })
        
        # Buscar en respuestas frecuentes
        frequent_answers_map = {
            "como_organizar_local": ["como organizar", "organizar local", "orden local"],
            "mejorar_stock": ["mejorar stock", "stock", "inventario", "mercaderia"],
            "problemas_proveedores": ["problema proveedor", "proveedor", "entrega"],
            "mejorar_ventas": ["mejorar venta", "vender mas", "aumentar venta"],
            "control_financiero": ["control", "plata", "finanza", "caja"]
        }
        
        for answer_key, keywords in frequent_answers_map.items():
            if any(keyword in message_lower for keyword in keywords):
                answer = self.get_frequent_answer(answer_key)
                if answer:
                    relevant_content.append({
                        "type": "respuesta_frecuente",
                        "key": answer_key,
                        "content": answer
                    })
        
        return relevant_content
    
    def get_calculator_info(self, calc_type: str) -> Optional[Dict]:
        """Obtiene información de calculadoras disponibles."""
        return self.knowledge.get("calculadoras", {}).get(calc_type)
    
    def format_knowledge_for_prompt(self, relevant_content: List[Dict]) -> str:
        """Formatea el conocimiento relevante para incluir en el prompt."""
        if not relevant_content:
            return ""
        
        formatted = "\n\nCONOCIMIENTO ESPECIALIZADO DISPONIBLE:\n"
        
        for item in relevant_content:
            if item["type"] == "buenas_practicas":
                content = item["content"]
                formatted += f"\n{content['titulo'].upper()}:\n"
                
                if "consejos" in content:
                    formatted += "Consejos clave:\n"
                    for consejo in content["consejos"][:3]:  # Limitar a 3 consejos
                        formatted += f"• {consejo}\n"
                
                if "procedimientos" in content:
                    formatted += "Procedimientos recomendados:\n"
                    for proc in content["procedimientos"][:2]:  # Limitar a 2 procedimientos
                        formatted += f"• {proc}\n"
            
            elif item["type"] == "respuesta_frecuente":
                formatted += f"\nRESPUESTA ESPECIALIZADA:\n{item['content']}\n"
        
        formatted += "\nUSA ESTE CONOCIMIENTO para dar consejos específicos y profesionales."
        return formatted
    
    def add_knowledge(self, category: str, topic: str, content: Dict):
        """Permite agregar nuevo conocimiento programáticamente."""
        if category not in self.knowledge:
            self.knowledge[category] = {}
        
        self.knowledge[category][topic] = content
        self._save_knowledge()
    
    def _save_knowledge(self):
        """Guarda la base de conocimiento actualizada."""
        try:
            with open(self.knowledge_file, 'w', encoding='utf-8') as f:
                json.dump(self.knowledge, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error guardando knowledge base: {e}")

# Instancia global
knowledge_manager = KnowledgeManager()
