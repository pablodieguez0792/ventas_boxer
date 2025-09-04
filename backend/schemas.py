from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    brand: str
    internal_code: str
    original_code: Optional[str] = None
    supplier_code: Optional[str] = None
    price: float
    stock: int = 0
    location: Optional[str] = None
    vehicle_application: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProductSearch(BaseModel):
    id: int
    name: str
    brand: str
    internal_code: str
    original_code: Optional[str]
    supplier_code: Optional[str]
    price: float
    stock: int
    location: Optional[str]
    image_url: Optional[str]
    vehicle_application: Optional[str]
    description: Optional[str]
    match_score: int

class CustomerBase(BaseModel):
    name: str
    document: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float
    product: ProductResponse
    
    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    reference: Optional[str] = None
    seller: str
    sale_items: List[SaleItemCreate]
    discount_amount: float = 0
    discount_percentage: float = 0
    comments: Optional[str] = None

class SaleResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    reference: Optional[str]
    seller: str
    subtotal: float
    discount_amount: float
    discount_percentage: float
    tax_amount: float
    total: float
    status: str
    payment_method: Optional[str]
    comments: Optional[str]
    created_at: datetime
    sale_items: List[SaleItemResponse]
    customer: Optional[CustomerResponse]
    
    class Config:
        from_attributes = True

class QuoteItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class QuoteCreate(BaseModel):
    customer_id: Optional[int] = None
    vehicle_info: Optional[str] = None
    items: List[QuoteItemCreate]
    discount_amount: float = 0
    discount_percentage: float = 0
    notes: Optional[str] = None

class QuoteResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    vehicle_info: Optional[str]
    subtotal: float
    discount_amount: float
    discount_percentage: float
    tax_amount: float
    total: float
    status: str
    created_at: datetime
    customer: Optional[CustomerResponse]
    
    class Config:
        from_attributes = True
