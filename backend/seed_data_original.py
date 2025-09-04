from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Product, Customer
import random

# Create tables
Base.metadata.create_all(bind=engine)

def seed_products():
    db = SessionLocal()
    
    # Sample auto parts data
    sample_products = [
        {
            "name": "Pastillas de Freno Delanteras",
            "brand": "Bosch",
            "internal_code": "BOS001",
            "original_code": "0986494123",
            "supplier_code": "BP1234",
            "price": 15500.00,
            "stock": 25,
            "location": "A1-B2",
            "vehicle_application": "Toyota Hilux 2016-2023, Ford Ranger 2012-2020",
            "description": "Pastillas de freno cerámicas de alta performance para vehículos medianos y pesados"
        },
        {
            "name": "Filtro de Aceite",
            "brand": "Mann",
            "internal_code": "MAN002",
            "original_code": "W712/52",
            "supplier_code": "FO5678",
            "price": 3200.00,
            "stock": 50,
            "location": "C3-A1",
            "vehicle_application": "Volkswagen Amarok 2010-2023, Audi Q5 2008-2017",
            "description": "Filtro de aceite de motor con tecnología alemana"
        },
        {
            "name": "Amortiguador Trasero",
            "brand": "Monroe",
            "internal_code": "MON003",
            "original_code": "G7392",
            "supplier_code": "AM9012",
            "price": 28900.00,
            "stock": 12,
            "location": "D2-C4",
            "vehicle_application": "Chevrolet S10 2012-2020, Isuzu D-Max 2012-2019",
            "description": "Amortiguador hidráulico con válvula de compresión variable"
        },
        {
            "name": "Bujías de Encendido NGK",
            "brand": "NGK",
            "internal_code": "NGK004",
            "original_code": "BKR6E-11",
            "supplier_code": "BU3456",
            "price": 2800.00,
            "stock": 80,
            "location": "B1-A3",
            "vehicle_application": "Honda Civic 2006-2015, Toyota Corolla 2009-2018",
            "description": "Bujías de iridio para mejor combustión y mayor durabilidad"
        },
        {
            "name": "Disco de Freno Ventilado",
            "brand": "Brembo",
            "internal_code": "BRE005",
            "original_code": "09.9772.11",
            "supplier_code": "DF7890",
            "price": 18700.00,
            "stock": 18,
            "location": "A3-B1",
            "vehicle_application": "Ford Focus 2013-2018, Volkswagen Golf 2014-2020",
            "description": "Disco de freno ventilado de hierro fundido con tratamiento anticorrosión"
        },
        {
            "name": "Correa de Distribución",
            "brand": "Gates",
            "internal_code": "GAT006",
            "original_code": "5455XS",
            "supplier_code": "CD1234",
            "price": 8900.00,
            "stock": 30,
            "location": "E1-D2",
            "vehicle_application": "Peugeot 208 2012-2019, Citroën C3 2013-2020",
            "description": "Correa de distribución reforzada con fibra de vidrio"
        },
        {
            "name": "Radiador de Agua",
            "brand": "Valeo",
            "internal_code": "VAL007",
            "original_code": "734992",
            "supplier_code": "RA5678",
            "price": 45600.00,
            "stock": 8,
            "location": "F2-E3",
            "vehicle_application": "Renault Duster 2011-2020, Nissan Frontier 2008-2015",
            "description": "Radiador de aluminio con tanques de plástico reforzado"
        },
        {
            "name": "Bomba de Agua",
            "brand": "Hepu",
            "internal_code": "HEP008",
            "original_code": "P558",
            "supplier_code": "BA9012",
            "price": 12400.00,
            "stock": 22,
            "location": "C2-B4",
            "vehicle_application": "Fiat Palio 2012-2017, Fiat Uno 2010-2020",
            "description": "Bomba de agua con impulsor de metal y sello mecánico"
        },
        {
            "name": "Alternador Reconstruido",
            "brand": "Bosch",
            "internal_code": "BOS009",
            "original_code": "0124525037",
            "supplier_code": "AL3456",
            "price": 67800.00,
            "stock": 5,
            "location": "G1-F2",
            "vehicle_application": "Mercedes Benz Sprinter 2006-2018, Volkswagen Crafter 2006-2016",
            "description": "Alternador reconstruido 140A con garantía de 12 meses"
        },
        {
            "name": "Kit de Embrague",
            "brand": "Sachs",
            "internal_code": "SAC010",
            "original_code": "3000951301",
            "supplier_code": "KE7890",
            "price": 89500.00,
            "stock": 6,
            "location": "H2-G3",
            "vehicle_application": "Volkswagen Gol 2008-2020, Volkswagen Voyage 2008-2020",
            "description": "Kit completo de embrague: disco, plato y collarin"
        },
        {
            "name": "Filtro de Aire K&N",
            "brand": "K&N",
            "internal_code": "KN011",
            "original_code": "33-2304",
            "supplier_code": "FA1234",
            "price": 8900.00,
            "stock": 15,
            "location": "B2-C1",
            "vehicle_application": "Ford Focus 2012-2018, Ford Fiesta 2011-2017",
            "description": "Filtro de aire deportivo lavable y reutilizable"
        },
        {
            "name": "Pastillas Traseras Bendix",
            "brand": "Bendix",
            "internal_code": "BDX012",
            "original_code": "DB1234",
            "supplier_code": "PT5678",
            "price": 12400.00,
            "stock": 32,
            "location": "A2-B3",
            "vehicle_application": "Chevrolet Cruze 2009-2016, Chevrolet Sonic 2012-2020",
            "description": "Pastillas de freno traseras cerámicas de larga duración"
        },
        {
            "name": "Aceite Motor Castrol 5W30",
            "brand": "Castrol",
            "internal_code": "CAS013",
            "original_code": "GTX-5W30",
            "supplier_code": "AC9012",
            "price": 4200.00,
            "stock": 45,
            "location": "D1-A2",
            "vehicle_application": "Motores nafta y diesel modernos, todas las marcas",
            "description": "Aceite sintético 5W30 para motores de alta performance"
        },
        {
            "name": "Batería Moura 12V 75Ah",
            "brand": "Moura",
            "internal_code": "MOU014",
            "original_code": "M75JD",
            "supplier_code": "BT3456",
            "price": 35600.00,
            "stock": 8,
            "location": "E3-F1",
            "vehicle_application": "Volkswagen Amarok, Ford Ranger, Toyota Hilux",
            "description": "Batería libre mantenimiento 75Ah arranque en frío"
        },
        {
            "name": "Neumático Pirelli 205/55R16",
            "brand": "Pirelli",
            "internal_code": "PIR015",
            "original_code": "P7-205-55-16",
            "supplier_code": "NE7890",
            "price": 42800.00,
            "stock": 12,
            "location": "F1-G2",
            "vehicle_application": "Volkswagen Golf, Ford Focus, Chevrolet Cruze",
            "description": "Neumático radial 205/55R16 para autos medianos"
        }
    ]
    
    # Check if products already exist
    existing_count = db.query(Product).count()
    if existing_count > 0:
        print(f"Database already has {existing_count} products. Skipping seed.")
        db.close()
        return
    
    # Add products
    for product_data in sample_products:
        product = Product(**product_data)
        db.add(product)
    
    # Add sample customers
    sample_customers = [
        {
            "name": "Juan Pérez",
            "document": "20123456789",
            "email": "juan.perez@email.com",
            "phone": "+54 11 1234-5678",
            "address": "Av. Corrientes 1234, CABA"
        },
        {
            "name": "María González",
            "document": "27987654321",
            "email": "maria.gonzalez@email.com",
            "phone": "+54 11 8765-4321",
            "address": "San Martín 567, Buenos Aires"
        },
        {
            "name": "Taller Mecánico Rodriguez",
            "document": "30567891234",
            "email": "taller@rodriguez.com",
            "phone": "+54 11 5555-1234",
            "address": "Ruta 8 Km 25, Pilar"
        }
    ]
    
    for customer_data in sample_customers:
        customer = Customer(**customer_data)
        db.add(customer)
    
    db.commit()
    print("[SUCCESS] Database seeded successfully!")
    print(f"Added {len(sample_products)} products and {len(sample_customers)} customers")
    db.close()

if __name__ == "__main__":
    seed_products()
