from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


# ---- Chatbot & Test Data Models ----

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_activity_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    title = Column(String, default="Conversación")
    ip_address = Column(String)
    client_cuit = Column(String)

    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    meta_json = Column(Text)  # JSON string: feedback, suggestions, anonymized flags

    conversation = relationship("ChatConversation", back_populates="messages")


class TestUsuario(Base):
    __tablename__ = "test_usuarios"

    id = Column(Integer, primary_key=True, index=True)
    cuit = Column(String, index=True)
    nombre = Column(String, index=True)
    email = Column(String)
    direccion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestCliente(Base):
    __tablename__ = "test_clientes"

    id = Column(Integer, primary_key=True, index=True)
    cuit = Column(String, index=True)
    nombre = Column(String, index=True)
    email = Column(String)
    direccion = Column(Text)
    deuda = Column(Float, default=0)  # For compatibility with original
    deuda_cc = Column(Float, default=0)
    monto_vendido_30d = Column(Float, default=0)
    cantidad_ventas = Column(Integer, default=0)
    fecha_ingreso = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestProveedor(Base):
    __tablename__ = "test_proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    cuit = Column(String, index=True)
    email = Column(String)
    cant_articulos = Column(Integer, default=0)
    ultima_factura_impaga = Column(String)  # texto simple p/ demostración
    deuda_cc = Column(Float, default=0)
    monto_comprado_30d = Column(Float, default=0)
    cantidad_pedidos_30d = Column(Integer, default=0)
    calificacion = Column(Float, default=0)
    dias_promedio_entrega = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestArticulo(Base):
    __tablename__ = "test_articulos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True)
    nombre = Column(String, index=True)  # For compatibility
    descripcion = Column(Text)
    marca = Column(String, index=True)
    stock = Column(Integer, default=0)
    ventas = Column(Integer, default=0)  # For compatibility
    ventas_30d = Column(Integer, default=0)
    proveedor_id = Column(Integer, ForeignKey("test_proveedores.id"))

    proveedor = relationship("TestProveedor")

class Configuration(Base):
    __tablename__ = "configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    brand = Column(String, nullable=False, index=True)
    internal_code = Column(String, unique=True, index=True)
    original_code = Column(String, index=True)
    supplier_code = Column(String, index=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    location = Column(String)  # Ubicación en depósito
    image_filename = Column(String)
    vehicle_application = Column(Text)  # Aplicación de vehículo
    description = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    document = Column(String, index=True)  # DNI/CUIT
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sales = relationship("Sale", back_populates="customer")
    quotes = relationship("Quote", back_populates="customer")

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    reference = Column(String)  # Referencia para caja
    seller = Column(String, nullable=False)  # Nombre del cliente
    actual_seller = Column(String, default="ADMIN")  # Vendedor real
    subtotal = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    discount_percentage = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    total = Column(Float, nullable=False)
    status = Column(String, default="draft")  # draft, pending_invoice, invoiced, cancelled
    payment_method = Column(String)
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    invoiced_at = Column(DateTime)
    
    # Relationships
    customer = relationship("Customer", back_populates="sales")
    sale_items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    # Relationships
    sale = relationship("Sale", back_populates="sale_items")
    product = relationship("Product")

# ---- Chatbot & Test Data Models ----

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_activity_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    title = Column(String, default="Conversación")

    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    meta_json = Column(Text)  # JSON string: feedback, suggestions, anonymized flags

    conversation = relationship("ChatConversation", back_populates="messages")


class TestUsuario(Base):
    __tablename__ = "test_usuarios"

    id = Column(Integer, primary_key=True, index=True)
    cuit = Column(String, index=True)
    nombre = Column(String, index=True)
    direccion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestCliente(Base):
    __tablename__ = "test_clientes"

    id = Column(Integer, primary_key=True, index=True)
    cuit = Column(String, index=True)
    nombre = Column(String, index=True)
    direccion = Column(Text)
    deuda_cc = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestProveedor(Base):
    __tablename__ = "test_proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    cuit = Column(String, index=True)
    cant_articulos = Column(Integer, default=0)
    ultima_factura_impaga = Column(String)  # texto simple p/ demostración
    deuda_cc = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestArticulo(Base):
    __tablename__ = "test_articulos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True)
    descripcion = Column(Text)
    marca = Column(String, index=True)
    stock = Column(Integer, default=0)
    ventas_30d = Column(Integer, default=0)
    proveedor_id = Column(Integer, ForeignKey("test_proveedores.id"))

    proveedor = relationship("TestProveedor")

class Quote(Base):
    __tablename__ = "quotes"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String)  # Nombre del cliente
    customer_email = Column(String)  # Email del cliente
    customer_phone = Column(String)  # Teléfono del cliente
    vehicle_info = Column(Text)  # Información del vehículo
    subtotal = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    discount_percentage = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    total = Column(Float, nullable=False)
    status = Column(String, default="active")  # active, converted, expired
    valid_until = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="quotes")
    quote_items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")

class QuoteItem(Base):
    __tablename__ = "quote_items"
    
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    # Relationships
    quote = relationship("Quote", back_populates="quote_items")
    product = relationship("Product")

class Return(Base):
    __tablename__ = "returns"
    
    id = Column(Integer, primary_key=True, index=True)
    original_sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String)
    return_type = Column(String, nullable=False)  # 'refund' or 'exchange'
    subtotal = Column(Float, default=0)
    total_refund = Column(Float, default=0)  # Money to be refunded
    total_exchange = Column(Float, default=0)  # Value of new products
    difference = Column(Float, default=0)  # Difference (+ customer pays, - customer receives)
    status = Column(String, default="pending")  # pending, completed, cancelled
    notes = Column(Text)
    processed_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer")
    original_sale = relationship("Sale")
    return_items = relationship("ReturnItem", back_populates="return_record", cascade="all, delete-orphan")
    exchange_items = relationship("ExchangeItem", back_populates="return_record", cascade="all, delete-orphan")

class ReturnItem(Base):
    __tablename__ = "return_items"
    
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("returns.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    reason = Column(String)  # Reason for return
    
    # Relationships
    return_record = relationship("Return", back_populates="return_items")
    product = relationship("Product")

class ExchangeItem(Base):
    __tablename__ = "exchange_items"
    
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("returns.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    # Relationships
    return_record = relationship("Return", back_populates="exchange_items")
    product = relationship("Product")
