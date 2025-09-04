// Mock data for sales management system
const stores = ['MercadoLibre', 'TiendaNube', 'Shopify'];
const shippingTypes = ['Flex', 'Colecta', 'Turbo', 'Encomienda', 'A Coordinar', 'Full'];
const logisticsStatuses = ['para_preparar', 'etiqueta_impresa', 'controlada', 'lista_para_enviar', 'facturada', 'entregada'];
const saleStatuses = ['Pagado', 'Pendiente', 'Cancelado'];

const products = [
  { sku: 'AMO001', title: 'Amortiguador Delantero Ford Focus', price: 45000, category: 'SUSPENSION', imageUrl: 'http://localhost:8000/static/images/producto1.jpg', stock: 15, brand: 'Monroe', originalCode: 'G7392', location: 'A1-B2' },
  { sku: 'FRE002', title: 'Pastillas de Freno Chevrolet Corsa', price: 12500, category: 'FRENOS', imageUrl: 'http://localhost:8000/static/images/producto2.jpg', stock: 28, brand: 'Bosch', originalCode: 'BP1234', location: 'B3-C1' },
  { sku: 'FIL003', title: 'Filtro de Aire Volkswagen Gol', price: 8900, category: 'FILTROS', imageUrl: 'http://localhost:8000/static/images/producto3.jpg', stock: 42, brand: 'K&N', originalCode: '33-2865', location: 'C2-D3' },
  { sku: 'ACE004', title: 'Aceite Motor 15W40 5L Shell', price: 18700, category: 'LUBRICANTES', imageUrl: 'http://localhost:8000/static/images/producto4.jpg', stock: 67, brand: 'Shell', originalCode: 'HX7-15W40', location: 'D1-E2' },
  { sku: 'BAT005', title: 'Batería 12V 75Ah Moura', price: 67500, category: 'ELECTRICO', imageUrl: 'http://localhost:8000/static/images/producto5.jpg', stock: 8, brand: 'Moura', originalCode: 'M75JD', location: 'E3-F1' },
  { sku: 'NEU006', title: 'Neumático 185/65R15 Pirelli', price: 89000, category: 'NEUMATICOS', imageUrl: 'http://localhost:8000/static/images/producto6.jpg', stock: 12, brand: 'Pirelli', originalCode: 'P7-185/65R15', location: 'F2-G3' },
  { sku: 'BUJ007', title: 'Bujías NGK Platinum x4', price: 23400, category: 'ENCENDIDO', imageUrl: 'http://localhost:8000/static/images/producto7.jpg', stock: 35, brand: 'NGK', originalCode: 'PFR6N-11', location: 'G1-H2' },
  { sku: 'COR008', title: 'Correa de Distribución Gates', price: 34800, category: 'TRANSMISION', imageUrl: 'http://localhost:8000/static/images/producto8.jpg', stock: 19, brand: 'Gates', originalCode: '5455XS', location: 'H3-I1' },
  { sku: 'RAD009', title: 'Radiador Peugeot 206', price: 67500, category: 'REFRIGERACION', imageUrl: 'http://localhost:8000/static/images/producto9.jpg', stock: 6, brand: 'Valeo', originalCode: '732974', location: 'I2-J3' },
  { sku: 'CLU010', title: 'Kit Embrague Fiat Palio', price: 78900, category: 'KIT', imageUrl: 'http://localhost:8000/static/images/producto10.jpg', stock: 11, brand: 'Sachs', originalCode: '3000951005', location: 'J1-K2' },
  { sku: 'ESP011', title: 'Espejo Retrovisor Toyota Corolla', price: 45600, category: 'CARROCERIA', imageUrl: 'http://localhost:8000/static/images/producto11.jpg', stock: 24, brand: 'TYC', originalCode: '5210102350', location: 'K3-L1' },
  { sku: 'ALT012', title: 'Alternador Renault Clio', price: 125000, category: 'ELECTRICO', imageUrl: 'http://localhost:8000/static/images/producto12.jpg', stock: 4, brand: 'Valeo', originalCode: '746025', location: 'L2-M3' },
  { sku: 'BOM013', title: 'Bomba de Agua Chevrolet Cruze', price: 89500, category: 'REFRIGERACION', imageUrl: 'http://localhost:8000/static/images/producto13.jpg', stock: 16, brand: 'Gates', originalCode: '42570', location: 'M1-N2' },
  { sku: 'FUE014', title: 'Bomba de Combustible Nissan Sentra', price: 156000, category: 'COMBUSTIBLE', imageUrl: 'http://localhost:8000/static/images/producto14.jpg', stock: 7, brand: 'Bosch', originalCode: '0580464084', location: 'N3-O1' },
  { sku: 'DIR015', title: 'Caja de Dirección Hidráulica', price: 234000, category: 'DIRECCION', imageUrl: 'http://localhost:8000/static/images/producto15.jpg', stock: 3, brand: 'ZF', originalCode: '8001955326', location: 'O2-P3' },
  { sku: 'SUS016', title: 'Brazo de Suspensión BMW Serie 3', price: 89700, category: 'SUSPENSION', imageUrl: 'http://localhost:8000/static/images/producto16.jpg', stock: 9, brand: 'Lemförder', originalCode: '31126758513', location: 'P1-Q2' },
  { sku: 'FRE017', title: 'Discos de Freno Ventilados x2', price: 67800, category: 'FRENOS', imageUrl: 'http://localhost:8000/static/images/producto17.jpg', stock: 22, brand: 'Brembo', originalCode: '09.9772.11', location: 'Q3-R1' },
  { sku: 'TUR018', title: 'Turbocompresor Volkswagen', price: 345000, category: 'MOTOR', imageUrl: 'http://localhost:8000/static/images/producto18.jpg', stock: 2, brand: 'Garrett', originalCode: '038253019N', location: 'R2-S3' },
  { sku: 'CAT019', title: 'Catalizador Universal', price: 178000, category: 'ESCAPE', imageUrl: 'http://localhost:8000/static/images/producto19.jpg', stock: 5, brand: 'Walker', originalCode: '16576', location: 'S1-T2' },
  { sku: 'KIT020', title: 'Kit Distribución Completo', price: 145000, category: 'KIT', imageUrl: 'http://localhost:8000/static/images/producto20.jpg', stock: 13, brand: 'INA', originalCode: '530054010', location: 'T3-U1' }
];

const customers = [
  { name: 'Juan Pérez', address: 'Av. Corrientes 1234, CABA, Buenos Aires' },
  { name: 'María González', address: 'San Martín 567, La Plata, Buenos Aires' },
  { name: 'Carlos Rodríguez', address: 'Belgrano 890, Córdoba, Córdoba' },
  { name: 'Ana López', address: 'Mitre 234, Rosario, Santa Fe' },
  { name: 'Luis Martínez', address: 'Rivadavia 456, Mendoza, Mendoza' },
  { name: 'Elena Fernández', address: 'Sarmiento 789, Tucumán, Tucumán' },
  { name: 'Roberto Silva', address: 'Moreno 123, Salta, Salta' },
  { name: 'Patricia Ruiz', address: 'Alvear 345, Mar del Plata, Buenos Aires' },
  { name: 'Miguel Torres', address: 'Libertad 678, Bahía Blanca, Buenos Aires' },
  { name: 'Carmen Díaz', address: 'Independencia 901, Neuquén, Neuquén' },
  { name: 'Fernando Castro', address: 'España 234, Paraná, Entre Ríos' },
  { name: 'Silvia Herrera', address: 'Italia 567, Santa Fe, Santa Fe' },
  { name: 'Alejandro Vega', address: 'Francia 890, Tandil, Buenos Aires' },
  { name: 'Mónica Jiménez', address: 'Alemania 123, San Juan, San Juan' },
  { name: 'Ricardo Morales', address: 'Brasil 456, Río Cuarto, Córdoba' }
];

// Generate 50 diverse mock sales
const mockSales = Array.from({ length: 50 }, (_, index) => {
  const store = stores[Math.floor(Math.random() * stores.length)];
  const shippingType = shippingTypes[Math.floor(Math.random() * shippingTypes.length)];
  const logisticsStatus = logisticsStatuses[Math.floor(Math.random() * logisticsStatuses.length)];
  const saleStatus = saleStatuses[Math.floor(Math.random() * saleStatuses.length)];
  const product = products[Math.floor(Math.random() * products.length)];
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const quantity = Math.floor(Math.random() * 3) + 1;
  
  // Generate random date within last 30 days
  const randomDate = new Date();
  randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
  
  return {
    id: 1001 + index,
    shippingId: `ML${Math.floor(Math.random() * 900000000) + 100000000}`,
    platform: store,
    store: store,
    saleNumber: `${store.substring(0, 2).toUpperCase()}${String(1001 + index).padStart(6, '0')}`,
    date: randomDate.toISOString(),
    title: product.title,
    customer: {
      name: customer.name,
      address: customer.address
    },
    items: [{
      sku: product.sku,
      title: product.title,
      imageUrl: product.imageUrl,
      price: product.price,
      category: product.category,
      quantity: quantity
    }],
    shippingType: shippingType,
    logisticsStatus: logisticsStatus,
    saleStatus: saleStatus,
    total: product.price * quantity,
    paymentMethod: 'MercadoPago',
    status: 'Pagado'
  };
});

export { mockSales };
