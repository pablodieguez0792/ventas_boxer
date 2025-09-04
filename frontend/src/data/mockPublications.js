// Mock data for MercadoLibre publications
export const mockPublications = [
  {
    id: 'pub-001',
    internalCode: 'BOX-001',
    mlaCode: 'MLA123456789',
    title: 'Kit Embrague Boxer 206 1.6 16v',
    brand: 'BOXER',
    imageUrl: '/static/images/kit-embrague.jpg',
    regularPrice: 45000,
    offerPrice: 42000,
    suggestedPrice: 48000,
    publicationType: 'Premium',
    quota: '2/5',
    stock: 8,
    status: 'Activa',
    isCombo: true,
    comboItems: [
      { code: 'EMB-001', name: 'Disco de Embrague', quantity: 1 },
      { code: 'EMB-002', name: 'Plato de Presión', quantity: 1 },
      { code: 'EMB-003', name: 'Collarin', quantity: 1 }
    ],
    variants: [
      { attribute: 'Motor', value: '1.6 16v' },
      { attribute: 'Año', value: '2005-2012' }
    ],
    netPrice: 38000,
    discountedPrice: 40000,
    ignoreStock: false,
    neverPause: true
  },
  {
    id: 'pub-002',
    internalCode: 'BOX-002',
    mlaCode: 'MLA987654321',
    title: 'Amortiguador Delantero Boxer Gol G5',
    brand: 'BOXER',
    imageUrl: '/static/images/amortiguador.jpg',
    regularPrice: 28000,
    offerPrice: null,
    suggestedPrice: 30000,
    publicationType: 'Clásica',
    quota: '0/0',
    stock: 15,
    status: 'Activa',
    isCombo: false,
    comboItems: [],
    variants: [
      { attribute: 'Posición', value: 'Delantero Derecho' },
      { attribute: 'Modelo', value: 'Gol G5' }
    ],
    netPrice: 24000,
    discountedPrice: 26000,
    ignoreStock: false,
    neverPause: false
  },
  {
    id: 'pub-003',
    internalCode: 'BOX-003',
    mlaCode: 'MLA456789123',
    title: 'Pastillas de Freno Boxer Corsa',
    brand: 'BOXER',
    imageUrl: '/static/images/pastillas-freno.jpg',
    regularPrice: 12000,
    offerPrice: 10500,
    suggestedPrice: 13500,
    publicationType: 'Premium',
    quota: '1/5',
    stock: 0,
    status: 'Pausada',
    isCombo: false,
    comboItems: [],
    variants: [
      { attribute: 'Posición', value: 'Delanteras' },
      { attribute: 'Modelo', value: 'Corsa 1.4-1.6' }
    ],
    netPrice: 9500,
    discountedPrice: 11000,
    ignoreStock: true,
    neverPause: false
  },
  {
    id: 'pub-004',
    internalCode: 'BOX-004',
    mlaCode: 'MLA789123456',
    title: 'Kit Distribución Boxer Clio 1.6',
    brand: 'BOXER',
    imageUrl: '/static/images/kit-distribucion.jpg',
    regularPrice: 65000,
    offerPrice: 60000,
    suggestedPrice: 70000,
    publicationType: 'Premium',
    quota: '3/5',
    stock: 5,
    status: 'Activa',
    isCombo: true,
    comboItems: [
      { code: 'DIST-001', name: 'Correa de Distribución', quantity: 1 },
      { code: 'DIST-002', name: 'Tensor Automático', quantity: 1 },
      { code: 'DIST-003', name: 'Polea Loca', quantity: 2 },
      { code: 'DIST-004', name: 'Bomba de Agua', quantity: 1 }
    ],
    variants: [
      { attribute: 'Motor', value: '1.6 16v K4M' },
      { attribute: 'Año', value: '2001-2012' }
    ],
    netPrice: 55000,
    discountedPrice: 58000,
    ignoreStock: false,
    neverPause: true
  },
  {
    id: 'pub-005',
    internalCode: 'BOX-005',
    mlaCode: 'MLA321654987',
    title: 'Filtro de Aceite Boxer Universal',
    brand: 'BOXER',
    imageUrl: '/static/images/filtro-aceite.jpg',
    regularPrice: 3500,
    offerPrice: null,
    suggestedPrice: 4000,
    publicationType: 'Clásica',
    quota: '0/0',
    stock: 50,
    status: 'Activa',
    isCombo: false,
    comboItems: [],
    variants: [
      { attribute: 'Aplicación', value: 'Universal' },
      { attribute: 'Rosca', value: '3/4-16 UNF' }
    ],
    netPrice: 2800,
    discountedPrice: 3200,
    ignoreStock: false,
    neverPause: false
  },
  {
    id: 'pub-006',
    internalCode: 'BOX-006',
    mlaCode: 'MLA654321789',
    title: 'Bujías Boxer Fiesta 1.6',
    brand: 'BOXER',
    imageUrl: '/static/images/bujias.jpg',
    regularPrice: 8000,
    offerPrice: 7200,
    suggestedPrice: 9000,
    publicationType: 'Clásica',
    quota: '0/0',
    stock: 25,
    status: 'Activa',
    isCombo: true,
    comboItems: [
      { code: 'BUJ-001', name: 'Bujía NGK', quantity: 4 }
    ],
    variants: [
      { attribute: 'Motor', value: '1.6 Sigma' },
      { attribute: 'Cantidad', value: '4 unidades' }
    ],
    netPrice: 6500,
    discountedPrice: 7000,
    ignoreStock: false,
    neverPause: false
  },
  {
    id: 'pub-007',
    internalCode: 'BOX-007',
    mlaCode: 'MLA147258369',
    title: 'Radiador Boxer Gol Trend',
    brand: 'BOXER',
    imageUrl: '/static/images/radiador.jpg',
    regularPrice: 35000,
    offerPrice: null,
    suggestedPrice: 38000,
    publicationType: 'Premium',
    quota: '1/5',
    stock: 3,
    status: 'Activa',
    isCombo: false,
    comboItems: [],
    variants: [
      { attribute: 'Modelo', value: 'Gol Trend 1.6' },
      { attribute: 'Año', value: '2008-2016' }
    ],
    netPrice: 30000,
    discountedPrice: 32000,
    ignoreStock: false,
    neverPause: true
  },
  {
    id: 'pub-008',
    internalCode: 'BOX-008',
    mlaCode: 'MLA963852741',
    title: 'Bomba de Combustible Boxer Focus',
    brand: 'BOXER',
    imageUrl: '/static/images/bomba-combustible.jpg',
    regularPrice: 22000,
    offerPrice: 19800,
    suggestedPrice: 25000,
    publicationType: 'Clásica',
    quota: '0/0',
    stock: 12,
    status: 'Pausada',
    isCombo: false,
    comboItems: [],
    variants: [
      { attribute: 'Modelo', value: 'Focus 1.6/2.0' },
      { attribute: 'Año', value: '2000-2007' }
    ],
    netPrice: 18000,
    discountedPrice: 20000,
    ignoreStock: false,
    neverPause: false
  },
  {
    id: 'pub-009',
    internalCode: 'BOX-009',
    mlaCode: 'MLA852741963',
    title: 'Kit Frenos Boxer Sandero',
    brand: 'BOXER',
    imageUrl: '/static/images/kit-frenos.jpg',
    regularPrice: 18000,
    offerPrice: 16200,
    suggestedPrice: 20000,
    publicationType: 'Premium',
    quota: '2/5',
    stock: 7,
    status: 'Activa',
    isCombo: true,
    comboItems: [
      { code: 'FRE-001', name: 'Pastillas Delanteras', quantity: 1 },
      { code: 'FRE-002', name: 'Pastillas Traseras', quantity: 1 },
      { code: 'FRE-003', name: 'Discos Delanteros', quantity: 2 }
    ],
    variants: [
      { attribute: 'Modelo', value: 'Sandero 1.6' },
      { attribute: 'Año', value: '2008-2014' }
    ],
    netPrice: 15000,
    discountedPrice: 16500,
    ignoreStock: false,
    neverPause: false
  },
  {
    id: 'pub-010',
    internalCode: 'BOX-010',
    mlaCode: 'MLA741852963',
    title: 'Alternador Boxer Suran 1.6',
    brand: 'BOXER',
    imageUrl: '/static/images/alternador.jpg',
    regularPrice: 42000,
    offerPrice: null,
    suggestedPrice: 45000,
    publicationType: 'Clásica',
    quota: '0/0',
    stock: 4,
    status: 'Activa',
    isCombo: false,
    comboItems: [],
    variants: [
      { attribute: 'Amperaje', value: '90A' },
      { attribute: 'Modelo', value: 'Suran 1.6' }
    ],
    netPrice: 36000,
    discountedPrice: 39000,
    ignoreStock: false,
    neverPause: true
  }
];

// Default calculation percentages for price calculator
export const defaultCalculationPercentages = [
  { id: 1, name: 'Ganancia Estándar', percentage: 25, enabled: true },
  { id: 2, name: 'Ganancia Premium', percentage: 35, enabled: true },
  { id: 3, name: 'Comisión ML', percentage: 12, enabled: true },
  { id: 4, name: 'Envío Gratis', percentage: 8, enabled: true },
  { id: 5, name: 'Promoción Bancaria', percentage: 15, enabled: false }
];
