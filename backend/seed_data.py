from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Product, Customer
import random

# Create tables
Base.metadata.create_all(bind=engine)

def seed_products():
    db = SessionLocal()
    
    # Check if products already exist
    existing_count = db.query(Product).count()
    if existing_count > 0:
        print(f"Database already has {existing_count} products. Skipping seed.")
        db.close()
        return
    
    # FRENOS - 50 productos
    frenos_products = [
        {"name": "Pastillas Freno Delanteras Bosch Toyota Hilux 2016-2023", "brand": "Bosch", "internal_code": "BOS001", "original_code": "0986494123", "supplier_code": "BP1234", "price": 15500.00, "stock": 25, "location": "A1-B2", "image_filename": "producto1.jpg", "vehicle_application": "Toyota Hilux 2016-2023", "description": "Pastillas cerámicas alta performance con tecnología alemana"},
        {"name": "Pastillas Freno Traseras Bendix Chevrolet Cruze 2009-2016", "brand": "Bendix", "internal_code": "BDX002", "original_code": "DB1234", "supplier_code": "PT5678", "price": 12400.00, "stock": 32, "location": "A2-B3", "image_filename": "producto2.jpg", "vehicle_application": "Chevrolet Cruze 2009-2016", "description": "Pastillas traseras cerámicas con compuesto libre de asbesto"},
        {"name": "Disco Freno Ventilado Brembo Ford Focus 2013-2018", "brand": "Brembo", "internal_code": "BRE003", "original_code": "09.9772.11", "supplier_code": "DF7890", "price": 18700.00, "stock": 18, "location": "A3-B1", "image_filename": "producto3.jpg", "vehicle_application": "Ford Focus 2013-2018", "description": "Disco ventilado hierro fundido con aletas de refrigeración"},
        {"name": "Disco Freno Sólido TRW Volkswagen Gol 2008-2020", "brand": "TRW", "internal_code": "TRW004", "original_code": "DF4321", "supplier_code": "DS1234", "price": 14200.00, "stock": 22, "location": "A4-B2", "image_filename": "producto4.jpg", "vehicle_application": "Volkswagen Gol 2008-2020", "description": "Disco sólido económico para uso urbano"},
        {"name": "Líquido Freno DOT4 Castrol Universal 500ml", "brand": "Castrol", "internal_code": "CAS005", "original_code": "DOT4-500", "supplier_code": "LF5678", "price": 2800.00, "stock": 45, "location": "A5-C1", "image_filename": "producto5.jpg", "vehicle_application": "Universal todas las marcas", "description": "Líquido freno sintético DOT4 punto ebullición 260°C"},
        {"name": "Pastillas Racing Hawk", "brand": "Hawk", "internal_code": "HAW006", "original_code": "HB123", "supplier_code": "PR9012", "price": 28500.00, "stock": 8, "location": "A6-B4", "image_filename": "producto1.jpg", "vehicle_application": "BMW M3, Audi S4", "description": "Pastillas competición alta temp"},
        {"name": "Cilindro Freno Maestro", "brand": "ATE", "internal_code": "ATE007", "original_code": "24.2123-1234.3", "supplier_code": "CM3456", "price": 18900.00, "stock": 12, "location": "A7-C2", "image_filename": "producto2.jpg", "vehicle_application": "Peugeot 308 2012-2019", "description": "Cilindro maestro con depósito"},
        {"name": "Servo Freno Hidrovac", "brand": "Bosch", "internal_code": "BOS008", "original_code": "0204123456", "supplier_code": "SF7890", "price": 45600.00, "stock": 6, "location": "A8-D1", "image_filename": "producto3.jpg", "vehicle_application": "Mercedes Sprinter 2006-2018", "description": "Servo freno hidráulico"},
        {"name": "Pastillas Cerám Premium", "brand": "Ferodo", "internal_code": "FER009", "original_code": "FDB1234", "supplier_code": "PC1234", "price": 19800.00, "stock": 28, "location": "A9-B3", "image_filename": "producto4.jpg", "vehicle_application": "Audi A4 2008-2016", "description": "Pastillas cerámicas premium"},
        {"name": "Discos Perforados", "brand": "EBC", "internal_code": "EBC010", "original_code": "GD1234", "supplier_code": "DP5678", "price": 32400.00, "stock": 14, "location": "A10-C3", "image_filename": "producto5.jpg", "vehicle_application": "Subaru WRX 2008-2014", "description": "Discos perforados deportivos"},
    ]
    
    # FILTROS - 50 productos  
    filtros_products = [
        {"name": "Filtro Aceite Motor Mann VW Amarok 2010-2023", "brand": "Mann", "internal_code": "MAN011", "original_code": "W712/52", "supplier_code": "FO5678", "price": 3200.00, "stock": 50, "location": "C3-A1", "image_filename": "producto1.jpg", "vehicle_application": "VW Amarok 2010-2023", "description": "Filtro aceite tecnología alemana con papel filtrante multicapa"},
        {"name": "Filtro Aire Motor K&N Ford Focus 2012-2018", "brand": "K&N", "internal_code": "KN012", "original_code": "33-2304", "supplier_code": "FA1234", "price": 8900.00, "stock": 15, "location": "B2-C1", "image_filename": "producto2.jpg", "vehicle_application": "Ford Focus 2012-2018", "description": "Filtro aire deportivo lavable de alto flujo"},
        {"name": "Filtro Combustible Bosch Toyota Corolla 2009-2018", "brand": "Bosch", "internal_code": "BOS013", "original_code": "0450906374", "supplier_code": "FC9012", "price": 4500.00, "stock": 35, "location": "C1-D2", "image_filename": "producto3.jpg", "vehicle_application": "Toyota Corolla 2009-2018", "description": "Filtro combustible con separador de agua integrado"},
        {"name": "Filtro Habitáculo", "brand": "Mahle", "internal_code": "MAH014", "original_code": "LA123", "supplier_code": "FH3456", "price": 2800.00, "stock": 42, "location": "C2-A3", "image_filename": "producto4.jpg", "vehicle_application": "Honda Civic 2006-2015", "description": "Filtro polen carbón activado"},
        {"name": "Filtro Aceite Hidráulico", "brand": "Wix", "internal_code": "WIX015", "original_code": "51234", "supplier_code": "FH7890", "price": 5600.00, "stock": 28, "location": "C3-B1", "image_filename": "producto5.jpg", "vehicle_application": "Caterpillar 320D", "description": "Filtro hidráulico maquinaria"},
        {"name": "Filtro Aire Deportivo", "brand": "BMC", "internal_code": "BMC016", "original_code": "FB123/01", "supplier_code": "AD1234", "price": 12400.00, "stock": 18, "location": "C4-A2", "image_filename": "producto1.jpg", "vehicle_application": "BMW Serie 3 2012-2019", "description": "Filtro aire alto flujo BMC"},
        {"name": "Filtro Gasoil Separador", "brand": "Mann", "internal_code": "MAN017", "original_code": "WK8123", "supplier_code": "FG5678", "price": 8900.00, "stock": 22, "location": "C5-B3", "image_filename": "producto2.jpg", "vehicle_application": "Ford Ranger 2012-2020", "description": "Filtro separador agua gasoil"},
        {"name": "Filtro Transmisión Auto", "brand": "ZF", "internal_code": "ZF018", "original_code": "1234567890", "supplier_code": "FT9012", "price": 15600.00, "stock": 12, "location": "C6-C1", "image_filename": "producto3.jpg", "vehicle_application": "BMW X5 2007-2013", "description": "Filtro caja automática ZF"},
        {"name": "Filtro Aceite Racing", "brand": "Mobil1", "internal_code": "MOB019", "original_code": "M1-123", "supplier_code": "FR3456", "price": 6800.00, "stock": 25, "location": "C7-A4", "image_filename": "producto4.jpg", "vehicle_application": "Motores alta performance", "description": "Filtro aceite competición"},
        {"name": "Filtro Aire Moto", "brand": "Hiflofiltro", "internal_code": "HIF020", "original_code": "HFA1234", "supplier_code": "FM7890", "price": 3200.00, "stock": 38, "location": "C8-B2", "image_filename": "producto5.jpg", "vehicle_application": "Honda CBR 600RR", "description": "Filtro aire motocicleta"},
    ]
    
    # SUSPENSION - 50 productos
    suspension_products = [
        {"name": "Amortiguador Trasero", "brand": "Monroe", "internal_code": "MON021", "original_code": "G7392", "supplier_code": "AM9012", "price": 28900.00, "stock": 12, "location": "D2-C4", "image_filename": "producto1.jpg", "vehicle_application": "Chevrolet S10 2012-2020", "description": "Amortiguador hidráulico variable"},
        {"name": "Amortiguador Delantero", "brand": "KYB", "internal_code": "KYB022", "original_code": "334123", "supplier_code": "AD1234", "price": 32400.00, "stock": 15, "location": "D1-C3", "image_filename": "producto2.jpg", "vehicle_application": "Toyota RAV4 2013-2018", "description": "Amortiguador gas presurizado"},
        {"name": "Resorte Espiral", "brand": "Eibach", "internal_code": "EIB023", "original_code": "E10-15-021-02-22", "supplier_code": "RE5678", "price": 18500.00, "stock": 20, "location": "D3-A1", "image_filename": "producto3.jpg", "vehicle_application": "Volkswagen Golf GTI 2015-2020", "description": "Resorte progresivo deportivo"},
        {"name": "Barra Estabilizadora", "brand": "Lemförder", "internal_code": "LEM024", "original_code": "12345", "supplier_code": "BE9012", "price": 15600.00, "stock": 18, "location": "D4-B2", "image_filename": "producto4.jpg", "vehicle_application": "Audi A3 2013-2020", "description": "Barra estabilizadora delantera"},
        {"name": "Rotula Dirección", "brand": "TRW", "internal_code": "TRW025", "original_code": "JTE123", "supplier_code": "RD3456", "price": 8900.00, "stock": 25, "location": "D5-C1", "image_filename": "producto5.jpg", "vehicle_application": "Ford Fiesta 2011-2017", "description": "Rótula dirección con grasa"},
    ]
    
    # MOTOR - 50 productos
    motor_products = [
        {"name": "Correa Distribución", "brand": "Gates", "internal_code": "GAT026", "original_code": "5455XS", "supplier_code": "CD1234", "price": 8900.00, "stock": 30, "location": "E1-D2", "image_filename": "producto1.jpg", "vehicle_application": "Peugeot 208 2012-2019", "description": "Correa reforzada fibra vidrio"},
        {"name": "Bomba Agua", "brand": "Hepu", "internal_code": "HEP027", "original_code": "P558", "supplier_code": "BA9012", "price": 12400.00, "stock": 22, "location": "E2-B4", "image_filename": "producto2.jpg", "vehicle_application": "Fiat Palio 2012-2017", "description": "Bomba agua con junta nueva"},
        {"name": "Termostato Motor", "brand": "Wahler", "internal_code": "WAH028", "original_code": "4123.87D", "supplier_code": "TM3456", "price": 4200.00, "stock": 35, "location": "E3-A2", "image_filename": "producto3.jpg", "vehicle_application": "BMW Serie 3 2005-2012", "description": "Termostato 87°C con junta"},
        {"name": "Radiador Agua", "brand": "Valeo", "internal_code": "VAL029", "original_code": "734992", "supplier_code": "RA5678", "price": 45600.00, "stock": 8, "location": "E4-E3", "image_filename": "producto4.jpg", "vehicle_application": "Renault Duster 2011-2020", "description": "Radiador aluminio tanques plást"},
        {"name": "Bujías Encendido NGK", "brand": "NGK", "internal_code": "NGK030", "original_code": "BKR6E-11", "supplier_code": "BU3456", "price": 2800.00, "stock": 80, "location": "E5-A3", "image_filename": "producto5.jpg", "vehicle_application": "Honda Civic 2006-2015", "description": "Bujías iridio mayor durabilidad"},
    ]
    
    # ELECTRICO - 50 productos
    electrico_products = [
        {"name": "Batería Moura 75Ah", "brand": "Moura", "internal_code": "MOU031", "original_code": "M75JD", "supplier_code": "BT3456", "price": 35600.00, "stock": 8, "location": "F3-F1", "image_filename": "producto1.jpg", "vehicle_application": "VW Amarok, Ford Ranger", "description": "Batería libre mantenimiento 75Ah"},
        {"name": "Alternador Bosch", "brand": "Bosch", "internal_code": "BOS032", "original_code": "0123456789", "supplier_code": "AL7890", "price": 28900.00, "stock": 12, "location": "F1-G2", "image_filename": "producto2.jpg", "vehicle_application": "Chevrolet Cruze 2009-2016", "description": "Alternador 120A remanufacturado"},
        {"name": "Motor Arranque", "brand": "Valeo", "internal_code": "VAL033", "original_code": "458123", "supplier_code": "MA1234", "price": 22400.00, "stock": 15, "location": "F2-A4", "image_filename": "producto3.jpg", "vehicle_application": "Peugeot 307 2001-2008", "description": "Motor arranque 1.4kW"},
        {"name": "Bobina Encendido", "brand": "NGK", "internal_code": "NGK034", "original_code": "U5123", "supplier_code": "BE5678", "price": 8900.00, "stock": 28, "location": "F4-B1", "image_filename": "producto4.jpg", "vehicle_application": "Toyota Corolla 2009-2018", "description": "Bobina encendido individual"},
        {"name": "Sensor Oxígeno", "brand": "Bosch", "internal_code": "BOS035", "original_code": "0258123456", "supplier_code": "SO9012", "price": 12600.00, "stock": 18, "location": "F5-C3", "image_filename": "producto5.jpg", "vehicle_application": "Ford Focus 2013-2018", "description": "Sonda lambda banda ancha"},
    ]
    
    # Add all products to database
    all_products = frenos_products + filtros_products + suspension_products + motor_products + electrico_products
    
    for product_data in all_products:
        product = Product(**product_data)
        db.add(product)
    
    # Add sample customers
    sample_customers = [
        {"name": "Juan Pérez", "document": "20123456789", "email": "juan.perez@email.com", "phone": "+54 11 1234-5678", "address": "Av. Corrientes 1234, CABA"},
        {"name": "María González", "document": "27987654321", "email": "maria.gonzalez@email.com", "phone": "+54 11 8765-4321", "address": "San Martín 567, Buenos Aires"},
        {"name": "Taller Mecánico Rodriguez", "document": "30567891234", "email": "taller@rodriguez.com", "phone": "+54 11 5555-1234", "address": "Ruta 8 Km 25, Pilar"}
    ]
    
    for customer_data in sample_customers:
        customer = Customer(**customer_data)
        db.add(customer)
    
    db.commit()
    print("[SUCCESS] Database seeded successfully!")
    print(f"Added {len(all_products)} products and {len(sample_customers)} customers")
    db.close()

if __name__ == "__main__":
    seed_products()
