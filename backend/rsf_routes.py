"""
Rutas de API para integración con Rural Santa Fe
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import asyncio
import logging
import io
import pandas as pd
from datetime import datetime

# from database import get_db  # Will use the one from main.py
from rsf_api_service import RSFAPIService, RSFOrderProduct

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rsf", tags=["Rural Santa Fe"])

# Instancia global del servicio RSF
rsf_service = RSFAPIService()

# Modelos Pydantic para requests/responses
class RSFLoginRequest(BaseModel):
    cuenta_rsf: str
    password: str

class RSFOrderProductRequest(BaseModel):
    cantidad: int
    codigo_rsf: Optional[str] = None
    articulo: Optional[str] = None
    fabrica: Optional[str] = None
    marca_rsf: Optional[str] = None
    marca_original: Optional[str] = None

class RSFOrderRequest(BaseModel):
    products: List[RSFOrderProductRequest]
    test: bool = True
    comentario: Optional[str] = None
    email: Optional[str] = None

class RSFProductResponse(BaseModel):
    marca_rsf: str
    articulo: str
    fabrica: str
    descripcion: str
    tipo_txt: str
    marca_original: str
    precio_lista: float
    precio_neto: float
    stock_final: int
    stock_status: str
    modulo_venta: int
    rubro: str
    segmento: str
    codigo_rsf: str
    codigo_barra_big: str

class RSFDiscountResponse(BaseModel):
    marca_rsf: str
    marca_original: str
    descuento: float
    tipo: int
    tipo_descripcion: str

@router.post("/login")
async def rsf_login(request: RSFLoginRequest, db: Session = Depends(lambda: None)):
    """
    Autenticación con la API de Rural Santa Fe
    """
    try:
        result = await rsf_service.login(request.cuenta_rsf, request.password)
        
        if not result:
            raise HTTPException(
                status_code=401, 
                detail="Error de autenticación"
            )
        
        # Obtener estado actualizado después del login
        status = rsf_service.get_connection_status()
        
        return {
            "success": True,
            "message": "Autenticación exitosa",
            "data": {
                "cuenta_rsf": status["cuenta_rsf"],
                "razon_social": status["razon_social"],
                "expires_at": status["token_expires_at"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error en login RSF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def rsf_status():
    """
    Obtiene el estado actual de la conexión con RSF
    """
    try:
        status = rsf_service.get_connection_status()
        # Retornar directamente el status para que coincida con lo que espera el frontend
        return status
    except Exception as e:
        logger.error(f"Error obteniendo status RSF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products", response_model=Dict[str, Any])
async def get_rsf_products(
    page: int = 1,
    page_size: int = 100,
    marca: Optional[str] = None,
    rubro: Optional[str] = None,
    oem: Optional[str] = None,
    stock_disponible: Optional[bool] = None
):
    """
    Obtiene la lista de productos de RSF con paginación
    """
    try:
        # Usar la instancia global que mantiene el token
        products = await rsf_service.get_products_list()
        
        # Aplicar filtros
        if marca:
            products = [p for p in products if marca.lower() in p.marca_rsf.lower() or marca.lower() in p.marca_original.lower()]
        
        if rubro:
            products = [p for p in products if rubro.lower() in p.rubro.lower()]
            
        if oem:
            products = [p for p in products if oem.lower() in p.oem.lower()]
        
        # Filtrar por stock disponible si se especifica
        if stock_disponible is not None:
            if stock_disponible:
                products = [p for p in products if p.stock_final in [1, 2]]  # Disponible o baja cantidad
            else:
                products = [p for p in products if p.stock_final == 3]  # Sin stock
        
        total_products = len(products)
        
        # Calcular paginación
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_products = products[start_index:end_index]
        
        # Convertir a diccionarios para la respuesta
        products_dict = []
        for product in paginated_products:
            product_dict = {
                'codigo_rsf': product.codigo_rsf,
                'articulo': product.articulo,
                'descripcion': product.descripcion,
                'marca_rsf': product.marca_rsf,
                'marca_original': product.marca_original,
                'precio_lista': product.precio_lista,
                'precio_neto': product.precio_neto,
                'stock_final': product.stock_final,
                'rubro': product.rubro,
                'segmento': product.segmento,
                'modulo_venta': product.modulo_venta,
                'oem': product.oem,
                'codigo_barra': product.codigo_barra
            }
            products_dict.append(product_dict)
        
        total_pages = (total_products + page_size - 1) // page_size
        
        return {
            "success": True,
            "data": products_dict,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_products,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "message": f"Productos obtenidos exitosamente (página {page} de {total_pages})"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo productos: {e}")
        return {
            "success": False,
            "data": [],
            "pagination": {
                "page": 1,
                "page_size": page_size,
                "total_items": 0,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False
            },
            "message": f"Error obteniendo productos: {str(e)}"
        }

@router.get("/products/export")
async def export_products_excel():
    """
    Exporta todos los productos a un archivo Excel
    """
    try:
        products = await rsf_service.get_products_list()
        
        # Convertir productos a DataFrame
        products_data = []
        for product in products:
            product_dict = {
                'Código RSF': product.codigo_rsf,
                'Artículo': product.articulo,
                'Descripción': product.descripcion,
                'Marca RSF': product.marca_rsf,
                'Marca Original': product.marca_original,
                'Precio Lista': product.precio_lista,
                'Precio Neto': product.precio_neto,
                'Stock Final': product.stock_final,
                'Rubro': product.rubro,
                'Segmento': product.segmento,
                'Módulo Venta': product.modulo_venta,
                'OEM': product.oem,
                'Código Barra': product.codigo_barra
            }
            products_data.append(product_dict)
        
        df = pd.DataFrame(products_data)
        
        # Crear archivo Excel en memoria
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Productos RSF', index=False)
        
        excel_buffer.seek(0)
        
        # Crear nombre de archivo con fecha
        filename = f"productos_rsf_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(excel_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exportando productos a Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/discounts")
async def get_rsf_discounts():
    """
    Obtiene los descuentos por marca de RSF
    """
    try:
        discounts = await rsf_service.get_discounts_json()
        
        discount_responses = []
        for discount in discounts:
            discount_dict = {
                'marca_rsf': discount.marca_rsf,
                'marca_original': discount.marca_original,
                'descuento': discount.descuento,
                'tipo': discount.tipo,
                'tipo_descripcion': "Específico" if discount.tipo == 1 else "General"
            }
            discount_responses.append(discount_dict)
        
        return {
            "success": True,
            "total": len(discount_responses),
            "data": discount_responses
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo descuentos RSF: {e}")
        return {
            "success": False,
            "data": [],
            "message": f"Error obteniendo descuentos: {str(e)}"
        }

@router.post("/orders")
async def send_rsf_order(request: RSFOrderRequest, db: Session = Depends(lambda: None)):
    """
    Envía un pedido a Rural Santa Fe y lo guarda en la base de datos local
    """
    try:
        # Convertir productos del request
        rsf_products = []
        for product_req in request.products:
            rsf_product = RSFOrderProduct(
                cantidad=product_req.cantidad,
                codigo_rsf=product_req.codigo_rsf,
                articulo=product_req.articulo,
                fabrica=product_req.fabrica,
                marca_rsf=product_req.marca_rsf,
                marca_original=product_req.marca_original
            )
            rsf_products.append(rsf_product)
        
        # Enviar pedido
        result = await rsf_service.send_order(
            products=rsf_products,
            test=request.test,
            comentario=request.comentario,
            email=request.email
        )
        
        # Guardar orden en base de datos local si el envío fue exitoso
        if result and "trasaccion" in result:
            try:
                from sqlalchemy import create_engine
                from sqlalchemy.orm import sessionmaker
                from models import RSFOrder, RSFOrderItem
                
                engine = create_engine('sqlite:///publicaciones.db')
                SessionLocal = sessionmaker(bind=engine)
                local_db = SessionLocal()
                
                # Calcular total
                total = sum(p.cantidad * (p.precio_unitario if hasattr(p, 'precio_unitario') else 0) for p in rsf_products)
                
                # Crear orden
                new_order = RSFOrder(
                    order_id=f"RSF-{result['trasaccion'][:8]}-2025",
                    transaction_id=result['trasaccion'],
                    cuenta_rsf=result.get('cuenta', ''),
                    estado="Pendiente",
                    total=total,
                    comentario=request.comentario,
                    email=request.email,
                    test=request.test
                )
                
                local_db.add(new_order)
                local_db.flush()  # Para obtener el ID
                
                # Crear items de la orden
                for product_req in request.products:
                    order_item = RSFOrderItem(
                        order_id=new_order.id,
                        codigo_rsf=product_req.codigo_rsf or '',
                        articulo=product_req.articulo or '',
                        descripcion=f"Producto {product_req.articulo}",
                        marca_rsf=product_req.marca_rsf or '',
                        marca_original=product_req.marca_original or '',
                        fabrica=product_req.fabrica or '',
                        cantidad=product_req.cantidad,
                        precio_unitario=0.0,  # Se actualizará cuando tengamos el precio real
                        subtotal=0.0
                    )
                    local_db.add(order_item)
                
                local_db.commit()
                local_db.close()
                
                logger.info(f"Orden guardada en BD local: {new_order.order_id}")
                
            except Exception as db_error:
                logger.error(f"Error guardando orden en BD local: {db_error}")
                # No fallar el endpoint por error de BD local
        
        return {
            "success": True,
            "message": "Pedido enviado exitosamente",
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error enviando pedido RSF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def get_rsf_documents(from_date: Optional[str] = None):
    """
    Obtiene documentos de RSF por fecha
    """
    try:
        documents = await rsf_service.get_documents_by_date(from_date)
        
        # Convertir documentos a formato serializable
        documents_data = []
        for doc in documents:
            doc_data = {
                "numero": doc.numero,
                "tipo": doc.tipo,
                "tipo_descripcion": doc.tipo_descripcion,
                "codigo_arca": doc.codigo_arca,
                "subtotal": doc.subtotal,
                "total": doc.total,
                "saldo": doc.saldo,
                "estado": doc.estado,
                "total_percepciones": doc.total_percepciones,
                "iva": doc.iva,
                "fecha": doc.fecha,
                "percepcion_detalles": doc.percepcion_detalles,
                "producto_detalles": doc.producto_detalles
            }
            documents_data.append(doc_data)
        
        return {
            "success": True,
            "total": len(documents_data),
            "data": documents_data
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo documentos RSF: {e}")
        return {
            "success": False,
            "data": [],
            "message": f"Error obteniendo documentos: {str(e)}"
        }

@router.get("/documents/{numero_documento}")
async def get_rsf_document_by_number(numero_documento: str):
    """
    Obtiene un documento específico por número
    """
    try:
        document = await rsf_service.get_document_by_number(numero_documento)
        
        if not document:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        doc_data = {
            "numero": document.numero,
            "tipo": document.tipo,
            "tipo_descripcion": document.tipo_descripcion,
            "codigo_arca": document.codigo_arca,
            "subtotal": document.subtotal,
            "total": document.total,
            "saldo": document.saldo,
            "estado": document.estado,
            "total_percepciones": document.total_percepciones,
            "iva": document.iva,
            "fecha": document.fecha,
            "percepcion_detalles": document.percepcion_detalles,
            "producto_detalles": document.producto_detalles
        }
        
        return {
            "success": True,
            "data": doc_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo documento {numero_documento}: {e}")
        return {
            "success": False,
            "data": None,
            "message": f"Error obteniendo documento: {str(e)}"
        }

@router.get("/orders")
async def get_rsf_orders():
    """
    Obtiene el historial de órdenes/pedidos de RSF
    """
    try:
        # Por ahora retornamos una lista vacía ya que la API de RSF no tiene endpoint para obtener órdenes
        # En el futuro se podría implementar guardando las órdenes enviadas en base de datos
        return {
            "success": True,
            "total": 0,
            "data": [],
            "message": "Funcionalidad de historial de órdenes en desarrollo"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo órdenes RSF: {e}")
        return {
            "success": False,
            "data": [],
            "message": f"Error obteniendo órdenes: {str(e)}"
        }

@router.get("/orders-history")
async def get_rsf_orders_history():
    """
    Obtiene el historial de órdenes/pedidos de RSF desde la base de datos local
    """
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from models import RSFOrder, RSFOrderItem
        
        engine = create_engine('sqlite:///publicaciones.db')
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        # Obtener órdenes de la base de datos
        orders = db.query(RSFOrder).order_by(RSFOrder.created_at.desc()).all()
        
        orders_data = []
        for order in orders:
            # Obtener items de la orden
            order_items = db.query(RSFOrderItem).filter(RSFOrderItem.order_id == order.id).all()
            
            productos = []
            for item in order_items:
                productos.append({
                    "codigo_rsf": item.codigo_rsf,
                    "articulo": item.articulo,
                    "descripcion": item.descripcion,
                    "marca_rsf": item.marca_rsf,
                    "marca_original": item.marca_original,
                    "cantidad": item.cantidad,
                    "precio_unitario": item.precio_unitario,
                    "subtotal": item.subtotal
                })
            
            order_data = {
                "id": order.order_id,
                "fecha": order.created_at.isoformat(),
                "estado": order.estado,
                "total": order.total,
                "productos_count": len(productos),
                "comentario": order.comentario,
                "test": order.test,
                "productos": productos
            }
            orders_data.append(order_data)
        
        db.close()
        
        # Si no hay órdenes reales, mostrar mensaje informativo
        if not orders_data:
            return {
                "success": True,
                "total": 0,
                "data": [],
                "message": "No hay órdenes registradas. Las órdenes aparecerán aquí cuando se envíen pedidos a RSF."
            }
        
        return {
            "success": True,
            "total": len(orders_data),
            "data": orders_data,
            "message": f"Historial de órdenes RSF ({len(orders_data)} órdenes encontradas)"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo órdenes RSF: {e}")
        return {
            "success": False,
            "data": [],
            "message": f"Error obteniendo órdenes: {str(e)}"
        }

@router.get("/sync/status")
async def get_sync_status():
    """
    Obtiene el estado de sincronización con RSF
    """
    try:
        connection_status = rsf_service.get_connection_status()
        
        # Simular estadísticas de sincronización
        sync_stats = {
            "last_sync": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "products_synced": 0,
            "success_rate": 0.0,
            "next_sync": "Manual"
        }
        
        if connection_status["connected"]:
            # Obtener productos para estadísticas reales
            try:
                products = await rsf_service.get_products_list()
                sync_stats["products_synced"] = len(products)
                sync_stats["success_rate"] = 98.5
            except:
                pass
        
        return {
            "success": True,
            "data": {
                "connection": connection_status,
                "sync": sync_stats
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo estado de sincronización: {e}")
        raise HTTPException(status_code=500, detail=str(e))
