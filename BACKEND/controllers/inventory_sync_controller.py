# controllers/inventory_sync_controller.py

import requests
import os
from typing import Optional, Dict, Any

class InventorySyncService:
    """
    Servicio para sincronizar con el sistema de inventario
    """
    
    def __init__(self):
        self.inventory_api_url = os.getenv('INVENTORY_API_URL', 'http://localhost:3002')
        self.inventory_api_key = os.getenv('INVENTORY_API_KEY', '')
    
    async def notify_ticket_approved(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Notifica al sistema de inventario que un ticket fue aprobado
        
        Args:
            ticket_data: Diccionario con los datos del ticket
            
        Returns:
            Respuesta del sistema de inventario
        """
        try:
            payload = {
                "ticketId": ticket_data.get('id'),
                "deskLocation": ticket_data.get('desk_location'),
                "assetCondition": ticket_data.get('asset_condition'),
                "description": ticket_data.get('description', '')
            }
            
            # Filtrar valores None
            payload = {k: v for k, v in payload.items() if v is not None}
            
            response = requests.post(
                f"{self.inventory_api_url}/api/ticket-approved",
                headers={
                    "Content-Type": "application/json",
                    "X-API-Token": self.inventory_api_key
                },
                json=payload,
                timeout=10  # 10 segundos de timeout
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"Error {response.status_code}: {response.text}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Timeout al conectar con el sistema de inventario"
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": "No se pudo conectar con el sistema de inventario"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error inesperado: {str(e)}"
            }


# Instancia global
inventory_sync = InventorySyncService()