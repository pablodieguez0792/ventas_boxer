import React, { useState, useEffect } from 'react';
import geminiService from '../../services/geminiService';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';
import {
  Person, Phone, Email, DirectionsCar, ShoppingCart, Warning,
  TrendingUp, LocationOn, CalendarToday, Star, Notifications,
  Add, Search, Edit, Delete, WhatsApp, Close, LocalOffer,
  Campaign, Build, Schedule, Send, PhotoCamera, Security,
  Analytics, Timeline, Visibility, History
} from '@mui/icons-material';

const Particulares = () => {
  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: 'Juan Carlos Pérez',
      telefono: '+54 11 4567-8901',
      email: 'juan.perez@email.com',
      direccion: 'Av. Corrientes 1234, CABA',
      tipoCliente: 'Premium',
      fechaRegistro: '2024-01-15',
      ultimaCompra: '2024-12-20',
      totalCompras: 15,
      montoTotal: 125000,
      estado: 'Activo',
      descuentoActual: 15,
      vehiculos: [
        {
          id: 1,
          marca: 'Toyota',
          modelo: 'Corolla',
          año: 2018,
          patente: 'ABC123',
          kilometraje: 85000,
          proximoService: '2025-02-15',
          foto: '/images/vehicles/toyota-corolla.jpg'
        },
        {
          id: 2,
          marca: 'Honda',
          modelo: 'Civic',
          año: 2020,
          patente: 'DEF456',
          kilometraje: 45000,
          proximoService: '2025-03-10',
          foto: '/images/vehicles/honda-civic.jpg'
        }
      ],
      historialCompras: [
        {
          id: 1,
          fecha: '2024-12-20',
          productos: [
            { nombre: 'Filtro de Aceite Toyota', codigo: 'FO-TOY-001', precio: 2500, cantidad: 2, vehiculo: 'Toyota Corolla' },
            { nombre: 'Aceite 5W30 Shell', codigo: 'AC-SH-5W30', precio: 8500, cantidad: 4, vehiculo: 'Toyota Corolla' }
          ],
          total: 39000
        },
        {
          id: 2,
          fecha: '2024-11-15',
          productos: [
            { nombre: 'Pastillas de Freno Honda', codigo: 'PF-HON-002', precio: 12000, cantidad: 1, vehiculo: 'Honda Civic' }
          ],
          total: 12000
        }
      ],
      garantias: [
        {
          id: 1,
          producto: 'Pastillas de Freno Honda',
          fechaCompra: '2024-11-15',
          fechaVencimiento: '2025-11-15',
          estado: 'Vigente',
          documento: '/docs/garantia-001.pdf'
        }
      ],
      alertas: [
        {
          id: 1,
          tipo: 'mantenimiento',
          mensaje: 'Service Toyota Corolla próximo (15/02/2025)',
          prioridad: 'media',
          fecha: '2025-02-01'
        },
        {
          id: 2,
          tipo: 'oferta',
          mensaje: 'Descuento 20% en filtros Toyota',
          prioridad: 'baja',
          fecha: '2025-01-15'
        }
      ],
      predicciones: {
        proximaCompra: '2025-02-10',
        productosRecomendados: ['Filtro de Aire Toyota', 'Bujías NGK'],
        valorVidaCliente: 450000,
        riesgoAbandono: 'bajo'
      }
    },
    {
      id: 2,
      nombre: 'María Elena González',
      telefono: '+54 11 9876-5432',
      email: 'maria.gonzalez@email.com',
      direccion: 'Calle Falsa 567, San Isidro',
      tipoCliente: 'Regular',
      fechaRegistro: '2024-03-10',
      ultimaCompra: '2024-12-18',
      totalCompras: 8,
      montoTotal: 67500,
      estado: 'Activo',
      descuentoActual: 8,
      vehiculos: [
        {
          id: 3,
          marca: 'Volkswagen',
          modelo: 'Gol',
          año: 2016,
          patente: 'GHI789',
          kilometraje: 120000,
          proximoService: '2025-01-30',
          foto: '/images/vehicles/vw-gol.jpg'
        }
      ],
      historialCompras: [
        {
          id: 3,
          fecha: '2024-12-18',
          productos: [
            { nombre: 'Amortiguadores VW Gol', codigo: 'AM-VW-001', precio: 25000, cantidad: 2, vehiculo: 'Volkswagen Gol' }
          ],
          total: 50000
        }
      ],
      garantias: [],
      alertas: [
        {
          id: 3,
          tipo: 'mantenimiento',
          mensaje: 'Service VW Gol próximo (30/01/2025)',
          prioridad: 'alta',
          fecha: '2025-01-25'
        }
      ],
      predicciones: {
        proximaCompra: '2025-01-25',
        productosRecomendados: ['Filtro de Combustible VW', 'Correa de Distribución'],
        valorVidaCliente: 180000,
        riesgoAbandono: 'medio'
      }
    },
    {
      id: 3,
      nombre: 'Roberto Silva',
      telefono: '+54 11 2345-6789',
      email: 'roberto.silva@email.com',
      direccion: 'Av. Santa Fe 890, Palermo',
      tipoCliente: 'Nuevo',
      fechaRegistro: '2024-11-05',
      ultimaCompra: '2024-12-15',
      totalCompras: 2,
      montoTotal: 18900,
      estado: 'Activo',
      descuentoActual: 0,
      vehiculos: [
        {
          id: 4,
          marca: 'Ford',
          modelo: 'Focus',
          año: 2019,
          patente: 'JKL012',
          kilometraje: 65000,
          proximoService: '2025-03-20',
          foto: '/images/vehicles/ford-focus.jpg'
        }
      ],
      historialCompras: [
        {
          id: 4,
          fecha: '2024-12-15',
          productos: [
            { nombre: 'Batería Ford Focus', codigo: 'BAT-FOR-001', precio: 18900, cantidad: 1, vehiculo: 'Ford Focus' }
          ],
          total: 18900
        }
      ],
      garantias: [
        {
          id: 2,
          producto: 'Batería Ford Focus',
          fechaCompra: '2024-12-15',
          fechaVencimiento: '2025-12-15',
          estado: 'Vigente',
          documento: '/docs/garantia-002.pdf'
        }
      ],
      alertas: [],
      predicciones: {
        proximaCompra: '2025-03-15',
        productosRecomendados: ['Filtro de Aire Ford', 'Aceite 5W40'],
        valorVidaCliente: 85000,
        riesgoAbandono: 'alto'
      }
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      telefono: '+54 11 3456-7890',
      email: 'ana.martinez@email.com',
      direccion: 'Calle San Martín 456, Vicente López',
      tipoCliente: 'Regular',
      fechaRegistro: '2024-02-20',
      ultimaCompra: '2024-12-10',
      totalCompras: 12,
      montoTotal: 89500,
      estado: 'Activo',
      descuentoActual: 8,
      vehiculos: [
        {
          id: 5,
          marca: 'Chevrolet',
          modelo: 'Onix',
          año: 2021,
          patente: 'MNO345',
          kilometraje: 35000,
          proximoService: '2025-02-28',
          foto: '/images/vehicles/chevrolet-onix.jpg'
        }
      ],
      historialCompras: [
        {
          id: 5,
          fecha: '2024-12-10',
          productos: [
            { nombre: 'Cubiertas Michelin 185/60 R15', codigo: 'CUB-MICH-001', precio: 45000, cantidad: 2, vehiculo: 'Chevrolet Onix' }
          ],
          total: 90000
        }
      ],
      garantias: [],
      alertas: [
        {
          id: 4,
          tipo: 'mantenimiento',
          mensaje: 'Service Chevrolet Onix próximo (28/02/2025)',
          prioridad: 'media',
          fecha: '2025-02-20'
        }
      ],
      predicciones: {
        proximaCompra: '2025-02-20',
        productosRecomendados: ['Filtro de Aire Chevrolet', 'Aceite 5W30'],
        valorVidaCliente: 250000,
        riesgoAbandono: 'bajo'
      }
    },
    {
      id: 5,
      nombre: 'Carlos Rodríguez',
      telefono: '+54 11 5678-9012',
      email: 'carlos.rodriguez@email.com',
      direccion: 'Av. Libertador 789, San Isidro',
      tipoCliente: 'Premium',
      fechaRegistro: '2023-08-10',
      ultimaCompra: '2024-12-22',
      totalCompras: 28,
      montoTotal: 320000,
      estado: 'Activo',
      descuentoActual: 15,
      vehiculos: [
        {
          id: 6,
          marca: 'BMW',
          modelo: 'X3',
          año: 2020,
          patente: 'PQR678',
          kilometraje: 55000,
          proximoService: '2025-01-15',
          foto: '/images/vehicles/bmw-x3.jpg'
        },
        {
          id: 7,
          marca: 'Audi',
          modelo: 'A4',
          año: 2019,
          patente: 'STU901',
          kilometraje: 72000,
          proximoService: '2025-02-05',
          foto: '/images/vehicles/audi-a4.jpg'
        }
      ],
      historialCompras: [
        {
          id: 6,
          fecha: '2024-12-22',
          productos: [
            { nombre: 'Pastillas de Freno BMW Premium', codigo: 'PF-BMW-001', precio: 35000, cantidad: 1, vehiculo: 'BMW X3' },
            { nombre: 'Aceite Castrol 5W40', codigo: 'AC-CAST-5W40', precio: 12000, cantidad: 6, vehiculo: 'BMW X3' }
          ],
          total: 107000
        }
      ],
      garantias: [
        {
          id: 3,
          producto: 'Pastillas de Freno BMW Premium',
          fechaCompra: '2024-12-22',
          fechaVencimiento: '2025-12-22',
          estado: 'Vigente',
          documento: '/docs/garantia-003.pdf'
        }
      ],
      alertas: [],
      predicciones: {
        proximaCompra: '2025-01-10',
        productosRecomendados: ['Filtros BMW', 'Bujías NGK Premium'],
        valorVidaCliente: 850000,
        riesgoAbandono: 'bajo'
      }
    },
    {
      id: 6,
      nombre: 'Laura Fernández',
      telefono: '+54 11 6789-0123',
      email: 'laura.fernandez@email.com',
      direccion: 'Calle Belgrano 234, Tigre',
      tipoCliente: 'Nuevo',
      fechaRegistro: '2024-12-01',
      ultimaCompra: null,
      totalCompras: 0,
      montoTotal: 0,
      estado: 'Activo',
      descuentoActual: 0,
      vehiculos: [
        {
          id: 8,
          marca: 'Fiat',
          modelo: 'Argo',
          año: 2022,
          patente: 'VWX234',
          kilometraje: 15000,
          proximoService: '2025-04-10',
          foto: '/images/vehicles/fiat-argo.jpg'
        }
      ],
      historialCompras: [],
      garantias: [],
      alertas: [
        {
          id: 5,
          tipo: 'bienvenida',
          mensaje: 'Cliente nuevo - Ofrecer descuento de bienvenida',
          prioridad: 'alta',
          fecha: '2024-12-01'
        }
      ],
      predicciones: {
        proximaCompra: '2025-01-20',
        productosRecomendados: ['Aceite Fiat Original', 'Filtro de Aceite Fiat'],
        valorVidaCliente: 120000,
        riesgoAbandono: 'medio'
      }
    },
    {
      id: 7,
      nombre: 'Miguel Torres',
      telefono: '+54 11 7890-1234',
      email: 'miguel.torres@email.com',
      direccion: 'Av. Maipú 567, Olivos',
      tipoCliente: 'Regular',
      fechaRegistro: '2024-05-15',
      ultimaCompra: '2024-11-30',
      totalCompras: 6,
      montoTotal: 45000,
      estado: 'Activo',
      descuentoActual: 8,
      vehiculos: [
        {
          id: 9,
          marca: 'Renault',
          modelo: 'Sandero',
          año: 2017,
          patente: 'YZA567',
          kilometraje: 95000,
          proximoService: '2025-01-20',
          foto: '/images/vehicles/renault-sandero.jpg'
        }
      ],
      historialCompras: [
        {
          id: 7,
          fecha: '2024-11-30',
          productos: [
            { nombre: 'Correa de Distribución Renault', codigo: 'CD-REN-001', precio: 15000, cantidad: 1, vehiculo: 'Renault Sandero' }
          ],
          total: 15000
        }
      ],
      garantias: [],
      alertas: [
        {
          id: 6,
          tipo: 'inactividad',
          mensaje: 'Cliente sin compras hace más de 30 días',
          prioridad: 'media',
          fecha: '2024-12-30'
        }
      ],
      predicciones: {
        proximaCompra: '2025-01-15',
        productosRecomendados: ['Amortiguadores Renault', 'Pastillas de Freno'],
        valorVidaCliente: 150000,
        riesgoAbandono: 'medio'
      }
    },
    {
      id: 8,
      nombre: 'Patricia López',
      telefono: '+54 11 8901-2345',
      email: 'patricia.lopez@email.com',
      direccion: 'Calle Rivadavia 890, Martínez',
      tipoCliente: 'Premium',
      fechaRegistro: '2023-12-05',
      ultimaCompra: '2024-12-19',
      totalCompras: 22,
      montoTotal: 280000,
      estado: 'Activo',
      descuentoActual: 15,
      vehiculos: [
        {
          id: 10,
          marca: 'Mercedes-Benz',
          modelo: 'Clase A',
          año: 2021,
          patente: 'BCD890',
          kilometraje: 42000,
          proximoService: '2025-02-10',
          foto: '/images/vehicles/mercedes-a.jpg'
        }
      ],
      historialCompras: [
        {
          id: 8,
          fecha: '2024-12-19',
          productos: [
            { nombre: 'Kit de Embrague Mercedes', codigo: 'KE-MB-001', precio: 85000, cantidad: 1, vehiculo: 'Mercedes-Benz Clase A' }
          ],
          total: 85000
        }
      ],
      garantias: [
        {
          id: 4,
          producto: 'Kit de Embrague Mercedes',
          fechaCompra: '2024-12-19',
          fechaVencimiento: '2026-12-19',
          estado: 'Vigente',
          documento: '/docs/garantia-004.pdf'
        }
      ],
      alertas: [],
      predicciones: {
        proximaCompra: '2025-02-05',
        productosRecomendados: ['Aceite Mercedes Original', 'Filtros Mercedes'],
        valorVidaCliente: 750000,
        riesgoAbandono: 'bajo'
      }
    },
    {
      id: 9,
      nombre: 'Diego Morales',
      telefono: '+54 11 9012-3456',
      email: 'diego.morales@email.com',
      direccion: 'Av. del Libertador 1123, Acassuso',
      tipoCliente: 'Nuevo',
      fechaRegistro: '2024-11-20',
      ultimaCompra: '2024-12-05',
      totalCompras: 1,
      montoTotal: 8500,
      estado: 'Activo',
      descuentoActual: 0,
      vehiculos: [
        {
          id: 11,
          marca: 'Peugeot',
          modelo: '208',
          año: 2020,
          patente: 'EFG123',
          kilometraje: 38000,
          proximoService: '2025-03-15',
          foto: '/images/vehicles/peugeot-208.jpg'
        }
      ],
      historialCompras: [
        {
          id: 9,
          fecha: '2024-12-05',
          productos: [
            { nombre: 'Lámpara H7 Philips', codigo: 'LAM-PH-H7', precio: 8500, cantidad: 1, vehiculo: 'Peugeot 208' }
          ],
          total: 8500
        }
      ],
      garantias: [],
      alertas: [
        {
          id: 7,
          tipo: 'seguimiento',
          mensaje: 'Hacer seguimiento post-venta - Cliente nuevo',
          prioridad: 'alta',
          fecha: '2024-12-12'
        }
      ],
      predicciones: {
        proximaCompra: '2025-03-10',
        productosRecomendados: ['Aceite Peugeot', 'Filtro de Aire Peugeot'],
        valorVidaCliente: 95000,
        riesgoAbandono: 'alto'
      }
    },
    {
      id: 10,
      nombre: 'Silvia Ramírez',
      telefono: '+54 11 0123-4567',
      email: 'silvia.ramirez@email.com',
      direccion: 'Calle Mitre 345, San Fernando',
      tipoCliente: 'Regular',
      fechaRegistro: '2024-07-08',
      ultimaCompra: '2024-10-15',
      totalCompras: 4,
      montoTotal: 32000,
      estado: 'Inactivo',
      descuentoActual: 8,
      vehiculos: [
        {
          id: 12,
          marca: 'Nissan',
          modelo: 'Versa',
          año: 2018,
          patente: 'HIJ456',
          kilometraje: 78000,
          proximoService: '2025-01-25',
          foto: '/images/vehicles/nissan-versa.jpg'
        }
      ],
      historialCompras: [
        {
          id: 10,
          fecha: '2024-10-15',
          productos: [
            { nombre: 'Batería Nissan 12V', codigo: 'BAT-NIS-12V', precio: 32000, cantidad: 1, vehiculo: 'Nissan Versa' }
          ],
          total: 32000
        }
      ],
      garantias: [
        {
          id: 5,
          producto: 'Batería Nissan 12V',
          fechaCompra: '2024-10-15',
          fechaVencimiento: '2025-10-15',
          estado: 'Vigente',
          documento: '/docs/garantia-005.pdf'
        }
      ],
      alertas: [
        {
          id: 8,
          tipo: 'reactivacion',
          mensaje: 'Cliente inactivo - Más de 60 días sin compras',
          prioridad: 'alta',
          fecha: '2024-12-15'
        },
        {
          id: 9,
          tipo: 'mantenimiento',
          mensaje: 'Service Nissan Versa próximo (25/01/2025)',
          prioridad: 'media',
          fecha: '2025-01-20'
        }
      ],
      predicciones: {
        proximaCompra: '2025-01-20',
        productosRecomendados: ['Aceite Nissan', 'Filtros Nissan'],
        valorVidaCliente: 120000,
        riesgoAbandono: 'alto'
      }
    }
  ]);

  const [filteredClientes, setFilteredClientes] = useState(clientes);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterAlertas, setFilterAlertas] = useState('');
  const [filterTipoAlerta, setFilterTipoAlerta] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [newAlertData, setNewAlertData] = useState({
    tipo: '',
    mensaje: '',
    prioridad: 'media',
    grupoRepuestos: [],
    diasRecurrencia: '',
    condicionActivacion: 'compra' // 'compra', 'kilometraje', 'tiempo'
  });

  // Estado para diálogo de detalle de alertas (campanita)
  const [alertsDetailOpen, setAlertsDetailOpen] = useState(false);
  const [selectedAlertsDetail, setSelectedAlertsDetail] = useState([]);
  const [selectedAlertsTitle, setSelectedAlertsTitle] = useState('');
  const [filterUltimaCompra, setFilterUltimaCompra] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteDetailOpen, setClienteDetailOpen] = useState(false);
  const [selectedClienteDetail, setSelectedClienteDetail] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoCliente: 'Regular',
    vehiculos: [{
      marca: '',
      modelo: '',
      año: '',
      patente: '',
      vin: '',
      kilometraje: ''
    }]
  });

  // Filtrar clientes
  useEffect(() => {
    let filtered = clientes;

    // Filtro por texto de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefono.includes(searchTerm) ||
        cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo de cliente
    if (filterTipo) {
      filtered = filtered.filter(cliente => cliente.tipoCliente === filterTipo);
    }

    // Filtro por estado
    if (filterEstado) {
      filtered = filtered.filter(cliente => cliente.estado === filterEstado);
    }

    // Filtro por alertas
    if (filterAlertas) {
      if (filterAlertas === 'con_alertas') {
        filtered = filtered.filter(cliente => cliente.alertas.length > 0);
      } else if (filterAlertas === 'sin_alertas') {
        filtered = filtered.filter(cliente => cliente.alertas.length === 0);
      }
    }

    // Filtro por tipo específico de alerta
    if (filterTipoAlerta) {
      filtered = filtered.filter(cliente => 
        cliente.alertas.some(alerta => alerta.tipo === filterTipoAlerta)
      );
    }

    // Filtro por última compra
    if (filterUltimaCompra) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sixtyDaysAgo = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(cliente => {
        if (!cliente.ultimaCompra) {
          return filterUltimaCompra === 'sin_compras';
        }
        
        const ultimaCompraDate = new Date(cliente.ultimaCompra);
        
        switch (filterUltimaCompra) {
          case 'ultimos_30':
            return ultimaCompraDate >= thirtyDaysAgo;
          case 'mas_30':
            return ultimaCompraDate < thirtyDaysAgo && ultimaCompraDate >= sixtyDaysAgo;
          case 'mas_60':
            return ultimaCompraDate < sixtyDaysAgo;
          case 'sin_compras':
            return false;
          default:
            return true;
        }
      });
    }

    setFilteredClientes(filtered);
  }, [searchTerm, filterTipo, filterEstado, filterAlertas, filterTipoAlerta, filterUltimaCompra, clientes]);

  const handleSelectClient = (clienteId) => {
    setSelectedClients(prev => 
      prev.includes(clienteId) 
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const handleSelectAllClients = () => {
    if (selectedClients.length === filteredClientes.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClientes.map(c => c.id));
    }
  };

  const handleCreateAlert = () => {
    // Lógica para crear alerta automática
    const nuevaAlerta = {
      id: Date.now(),
      ...newAlertData,
      activa: true,
      fechaCreacion: new Date().toISOString().split('T')[0],
      clientesAfectados: 0 // Se calculará automáticamente
    };
    
    console.log('Creando nueva regla de alerta:', nuevaAlerta);
    alert('Alerta creada exitosamente. Se activará automáticamente según las condiciones definidas.');
    
    setAlertDialogOpen(false);
    setNewAlertData({
      tipo: '',
      mensaje: '',
      prioridad: 'media',
      grupoRepuestos: [],
      diasRecurrencia: '',
      condicionActivacion: 'compra'
    });
  };

  const handleSendCampaign = (campaignType) => {
    console.log(`Enviando campaña ${campaignType} a:`, selectedClients);
    setCampaignDialogOpen(false);
  };

  const handleOpenDialog = (cliente = null) => {
    if (cliente) {
      setSelectedCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        tipoCliente: cliente.tipoCliente,
        vehiculos: cliente.vehiculos || [{
          marca: '',
          modelo: '',
          año: '',
          patente: '',
          vin: '',
          kilometraje: ''
        }]
      });
    } else {
      setSelectedCliente(null);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        tipoCliente: 'Regular',
        vehiculos: [{
          marca: '',
          modelo: '',
          año: '',
          patente: '',
          vin: '',
          kilometraje: ''
        }]
      });
    }
    setOpenDialog(true);
  };

  const handleVehiculoChange = (index, field, value) => {
    const newVehiculos = [...formData.vehiculos];
    newVehiculos[index][field] = value;
    setFormData({...formData, vehiculos: newVehiculos});
  };

  const addVehiculo = () => {
    setFormData({
      ...formData,
      vehiculos: [...formData.vehiculos, {
        marca: '',
        modelo: '',
        año: '',
        patente: '',
        vin: '',
        kilometraje: ''
      }]
    });
  };

  const removeVehiculo = (index) => {
    if (formData.vehiculos.length > 1) {
      const newVehiculos = formData.vehiculos.filter((_, i) => i !== index);
      setFormData({...formData, vehiculos: newVehiculos});
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCliente(null);
  };

  const handleSave = () => {
    if (selectedCliente) {
      // Editar cliente existente
      setClientes(clientes.map(cliente =>
        cliente.id === selectedCliente.id
          ? { ...cliente, ...formData }
          : cliente
      ));
    } else {
      // Crear nuevo cliente
      const newCliente = {
        id: Math.max(...clientes.map(c => c.id)) + 1,
        ...formData,
        fechaRegistro: new Date().toISOString().split('T')[0],
        ultimaCompra: null,
        totalCompras: 0,
        montoTotal: 0,
        estado: 'Activo'
      };
      setClientes([...clientes, newCliente]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      setClientes(clientes.filter(cliente => cliente.id !== id));
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Premium': return 'success';
      case 'Regular': return 'primary';
      case 'Nuevo': return 'warning';
      default: return 'default';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'alta': return 'error';
      case 'media': return 'warning';
      case 'baja': return 'info';
      default: return 'default';
    }
  };

  const getRiesgoColor = (riesgo) => {
    switch (riesgo) {
      case 'alto': return 'error';
      case 'medio': return 'warning';
      case 'bajo': return 'success';
      default: return 'default';
    }
  };

  const handleOpenClienteDetail = (cliente) => {
    setSelectedClienteDetail(cliente);
    setClienteDetailOpen(true);
    setTabValue(0);
  };

  const handleCloseClienteDetail = () => {
    setClienteDetailOpen(false);
    setSelectedClienteDetail(null);
  };

  const TabPanel = ({ children, value, index, ...other }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`cliente-tabpanel-${index}`}
        aria-labelledby={`cliente-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  return (
    <Box>
      {/* Header con estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Clientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.filter(c => c.tipoCliente === 'Premium').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Premium
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.filter(c => c.tipoCliente === 'Nuevo').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nuevos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.filter(c => c.estado === 'Inactivo').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clientes Inactivos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <DirectionsCar />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.reduce((sum, c) => sum + c.vehiculos.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vehículos Registrados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.reduce((sum, c) => sum + c.alertas.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alertas Activas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles de filtrado y búsqueda */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Buscar cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterTipo}
                label="Tipo"
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Premium">Premium</MenuItem>
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Nuevo">Nuevo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                label="Estado"
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1.5}>
            <FormControl fullWidth>
              <InputLabel>Alertas</InputLabel>
              <Select
                value={filterAlertas}
                label="Alertas"
                onChange={(e) => setFilterAlertas(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="con_alertas">Con Alertas</MenuItem>
                <MenuItem value="sin_alertas">Sin Alertas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1.5}>
            <FormControl fullWidth>
              <InputLabel>Tipo Alerta</InputLabel>
              <Select
                value={filterTipoAlerta}
                label="Tipo Alerta"
                onChange={(e) => setFilterTipoAlerta(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                <MenuItem value="oferta">Oferta</MenuItem>
                <MenuItem value="reactivacion">Reactivación</MenuItem>
                <MenuItem value="seguimiento">Seguimiento</MenuItem>
                <MenuItem value="stock">Stock Disponible</MenuItem>
                <MenuItem value="vencimiento">Vencimiento</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Última Compra</InputLabel>
              <Select
                value={filterUltimaCompra}
                label="Última Compra"
                onChange={(e) => setFilterUltimaCompra(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="ultimos_30">Últimos 30 días</MenuItem>
                <MenuItem value="mas_30">Más de 30 días</MenuItem>
                <MenuItem value="mas_60">Más de 60 días</MenuItem>
                <MenuItem value="sin_compras">Sin compras</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center', pr: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              size="large"
              sx={{ minWidth: 120 }}
            >
              Cliente
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<Notifications />}
              onClick={() => setAlertDialogOpen(true)}
              size="large"
              sx={{ minWidth: 120 }}
            >
              Alertas
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Campaign />}
              onClick={() => setCampaignDialogOpen(true)}
              size="large"
              sx={{ minWidth: 120 }}
            >
              Campañas
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Acciones masivas */}
      {selectedClients.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedClients.length} cliente(s) seleccionado(s)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsApp />}
                onClick={() => setCampaignDialogOpen(true)}
                size="small"
              >
                Campaña WhatsApp
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<Email />}
                onClick={() => setCampaignDialogOpen(true)}
                size="small"
              >
                Campaña Email
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedClients([])}
                size="small"
              >
                Limpiar
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tabla de clientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedClients.length > 0 && selectedClients.length < filteredClientes.length}
                  checked={filteredClientes.length > 0 && selectedClients.length === filteredClientes.length}
                  onChange={handleSelectAllClients}
                />
              </TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Vehículos</TableCell>
              <TableCell>Última Compra</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedClients.includes(cliente.id)}
                    onChange={() => handleSelectClient(cliente.id)}
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {cliente.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" />
                      {cliente.direccion}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Phone fontSize="small" />
                      {cliente.telefono}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email fontSize="small" />
                      {cliente.email}
                    </Typography>
                  </Box>
                </TableCell>
                {/* Columna Vehículos */}
                <TableCell>
                  {cliente.vehiculos && cliente.vehiculos.length > 0 ? (
                    cliente.vehiculos.map((v, idx) => (
                      <Chip
                        key={idx}
                        label={`${v.marca} ${v.modelo} - ${v.patente}`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">Sin vehículos</Typography>
                  )}
                </TableCell>
                {/* Columna Última Compra (monto + fecha) */}
                <TableCell>
                  {cliente.ultimaCompra ? (
                    <Box>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        ${cliente.montoTotal.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(cliente.ultimaCompra).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Sin compras</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={cliente.estado}
                      color={cliente.estado === 'Activo' ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip
                      label={`${cliente.descuentoActual}%`}
                      color="info"
                      size="small"
                      icon={<LocalOffer />}
                    />
                    {cliente.alertas.length > 0 && (
                      <Tooltip
                        placement="top"
                        title={
                          <Box>
                            <Typography variant="subtitle2" component="div">
                              Alertas ({cliente.alertas.length})
                            </Typography>
                            {cliente.alertas.slice(0, 4).map((a, idx) => (
                              <Typography key={idx} variant="caption" component="div">
                                • {a.mensaje}
                              </Typography>
                            ))}
                            {cliente.alertas.length > 4 && (
                              <Typography variant="caption" component="div">…</Typography>
                            )}
                          </Box>
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedAlertsTitle(`Alertas de ${cliente.nombre}`);
                            setSelectedAlertsDetail(cliente.alertas);
                            setAlertsDetailOpen(true);
                          }}
                        >
                          <Badge badgeContent={cliente.alertas.length} color="error" overlap="rectangular">
                            <Notifications fontSize="small" />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Ver Perfil Completo">
                    <IconButton size="small" color="primary" onClick={() => handleOpenClienteDetail(cliente)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="WhatsApp">
                    <IconButton size="small" color="success">
                      <WhatsApp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(cliente)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => handleDelete(cliente.id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogo de detalle de alertas (campanita) */}
      <Dialog open={alertsDetailOpen} onClose={() => setAlertsDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedAlertsTitle}</DialogTitle>
        <DialogContent dividers>
          {selectedAlertsDetail && selectedAlertsDetail.length > 0 ? (
            <List>
              {selectedAlertsDetail.map((a, idx) => (
                <ListItem key={idx} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <Notifications />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    disableTypography
                    primary={<Typography variant="subtitle2">{a.mensaje}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary">Fecha: {a.fecha}</Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">Sin alertas</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertsDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar cliente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre Completo"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Cliente</InputLabel>
                <Select
                  value={formData.tipoCliente}
                  label="Tipo de Cliente"
                  onChange={(e) => setFormData({ ...formData, tipoCliente: e.target.value })}
                >
                  <MenuItem value="Premium">Premium</MenuItem>
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Nuevo">Nuevo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                multiline
                rows={2}
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6">Vehículos</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={addVehiculo}
                >
                  Agregar Vehículo
                </Button>
              </Box>
              {formData.vehiculos.map((vehiculo, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Vehículo {index + 1}</Typography>
                    {formData.vehiculos.length > 1 && (
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeVehiculo(index)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Marca"
                        value={vehiculo.marca}
                        onChange={(e) => handleVehiculoChange(index, 'marca', e.target.value)}
                        placeholder="Ej: Ford, Chevrolet, Toyota"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Modelo"
                        value={vehiculo.modelo}
                        onChange={(e) => handleVehiculoChange(index, 'modelo', e.target.value)}
                        placeholder="Ej: Focus, Corsa, Corolla"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Año"
                        type="number"
                        value={vehiculo.año}
                        onChange={(e) => handleVehiculoChange(index, 'año', e.target.value)}
                        placeholder="2020"
                        inputProps={{ min: 1990, max: new Date().getFullYear() + 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Patente"
                        value={vehiculo.patente}
                        onChange={(e) => handleVehiculoChange(index, 'patente', e.target.value.toUpperCase())}
                        placeholder="ABC123 o AB123CD"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Kilometraje"
                        type="number"
                        value={vehiculo.kilometraje}
                        onChange={(e) => handleVehiculoChange(index, 'kilometraje', e.target.value)}
                        placeholder="50000"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="VIN (Número de Chasis)"
                        value={vehiculo.vin}
                        onChange={(e) => handleVehiculoChange(index, 'vin', e.target.value.toUpperCase())}
                        placeholder="17 caracteres alfanuméricos"
                        inputProps={{ maxLength: 17 }}
                      />
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedCliente ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog detallado del cliente */}
      <Dialog
        open={clienteDetailOpen}
        onClose={handleCloseClienteDetail}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h5">{selectedClienteDetail?.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                Cliente {selectedClienteDetail?.tipoCliente} • {selectedClienteDetail?.totalCompras} compras
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip
                label={`${selectedClienteDetail?.descuentoActual}% descuento`}
                color="success"
                size="small"
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab icon={<Person />} label="Perfil" />
              <Tab icon={<DirectionsCar />} label="Vehículos" />
              <Tab icon={<History />} label="Historial" />
              <Tab icon={<Security />} label="Garantías" />
              <Tab icon={<Notifications />} label="Alertas" />
              <Tab icon={<Analytics />} label="Análisis" />
            </Tabs>
          </Box>

          {/* Tab Perfil */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Person sx={{ mr: 1 }} />
                      Información Personal
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone fontSize="small" />
                        <Typography>{selectedClienteDetail?.telefono}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email fontSize="small" />
                        <Typography>{selectedClienteDetail?.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        <Typography>{selectedClienteDetail?.direccion}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <TrendingUp sx={{ mr: 1 }} />
                      Estadísticas
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {selectedClienteDetail?.totalCompras}
                          </Typography>
                          <Typography variant="body2">Compras</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            ${selectedClienteDetail?.montoTotal.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">Total Gastado</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab Vehículos */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              {selectedClienteDetail?.vehiculos.map((vehiculo) => (
                <Grid item xs={12} md={6} key={vehiculo.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                          <DirectionsCar />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6">
                            {vehiculo.marca} {vehiculo.modelo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {vehiculo.año} • {vehiculo.patente}
                          </Typography>
                          <Typography variant="body2">
                            {vehiculo.kilometraje.toLocaleString()} km
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`Próximo service: ${vehiculo.proximoService}`}
                              color="warning"
                              size="small"
                              icon={<Schedule />}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Tab Historial */}
          <TabPanel value={tabValue} index={2}>
            <List>
              {selectedClienteDetail?.historialCompras.map((compra) => (
                <ListItem key={compra.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <ShoppingCart />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography variant="subtitle2">{`Compra del ${compra.fecha}`}</Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">Total: ${compra.total.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary" component="div">
                          Productos: {compra.productos.map(p => p.nombre).join(', ')}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Typography variant="h6" color="success.main">
                      ${compra.total.toLocaleString()}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </TabPanel>

          {/* Tab Garantías */}
          <TabPanel value={tabValue} index={3}>
            {selectedClienteDetail?.garantias.length > 0 ? (
              <List>
                {selectedClienteDetail.garantias.map((garantia) => (
                  <ListItem key={garantia.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <Security />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      disableTypography
                      primary={<Typography variant="subtitle2">{garantia.producto}</Typography>}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">Vence: {new Date(garantia.fechaVencimiento).toLocaleDateString()}</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip label={garantia.estado} color="success" size="small" />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={garantia.estado}
                        color={garantia.estado === 'Vigente' ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No hay garantías registradas</Alert>
            )}
          </TabPanel>

          {/* Tab Alertas */}
          <TabPanel value={tabValue} index={4}>
            {selectedClienteDetail?.alertas.length > 0 ? (
              <List>
                {selectedClienteDetail.alertas.map((alerta) => (
                  <ListItem key={alerta.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getPrioridadColor(alerta.prioridad) + '.main' }}>
                        <Notifications />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={alerta.mensaje}
                      secondary={`Fecha: ${alerta.fecha}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={alerta.prioridad}
                        color={getPrioridadColor(alerta.prioridad)}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success">No hay alertas pendientes</Alert>
            )}
          </TabPanel>

          {/* Tab Análisis */}
          <TabPanel value={tabValue} index={5}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Timeline sx={{ mr: 1 }} />
                      Predicciones
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Próxima compra estimada
                        </Typography>
                        <Typography variant="h6">
                          {selectedClienteDetail?.predicciones.proximaCompra}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Valor de vida del cliente
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          ${selectedClienteDetail?.predicciones.valorVidaCliente.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Riesgo de abandono
                        </Typography>
                        <Chip
                          label={selectedClienteDetail?.predicciones.riesgoAbandono}
                          color={getRiesgoColor(selectedClienteDetail?.predicciones.riesgoAbandono)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <LocalOffer sx={{ mr: 1 }} />
                      Productos Recomendados
                    </Typography>
                    <List dense>
                      {selectedClienteDetail?.predicciones.productosRecomendados.map((producto, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                              <Build fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={producto} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClienteDetail}>Cerrar</Button>
          <Button variant="contained" startIcon={<WhatsApp />} color="success">
            Contactar por WhatsApp
          </Button>
          <Button variant="contained" startIcon={<Email />}>
            Enviar Email
          </Button>
        </DialogActions>
      </Dialog>

        {/* Dialog para crear nueva alerta automática */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <Notifications />
            </Avatar>
            <Typography variant="h6">
              Crear Nueva Alerta Automática
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Alerta</InputLabel>
                <Select
                  value={newAlertData.tipo}
                  label="Tipo de Alerta"
                  onChange={(e) => setNewAlertData({ ...newAlertData, tipo: e.target.value })}
                >
                  <MenuItem value="mantenimiento">Mantenimiento Programado</MenuItem>
                  <MenuItem value="oferta">Oferta Especial</MenuItem>
                  <MenuItem value="reactivacion">Reactivación Cliente</MenuItem>
                  <MenuItem value="seguimiento">Seguimiento Post-Venta</MenuItem>
                  <MenuItem value="stock">Stock Disponible</MenuItem>
                  <MenuItem value="vencimiento">Vencimiento Garantía</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={newAlertData.prioridad}
                  label="Prioridad"
                  onChange={(e) => setNewAlertData({ ...newAlertData, prioridad: e.target.value })}
                >
                  <MenuItem value="baja">Baja</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensaje de la Alerta"
                multiline
                rows={3}
                value={newAlertData.mensaje}
                onChange={(e) => setNewAlertData({ ...newAlertData, mensaje: e.target.value })}
                placeholder="Ej: ¡Hola {nombre}! Han pasado {dias} días desde tu última compra de {producto}. Es momento del service de tu {vehiculo}."
                helperText="Variables: {nombre}, {vehiculo}, {dias}, {producto}, {kilometraje}"
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={[
                  'Aceites y Lubricantes', 'Filtros', 'Frenos', 'Suspensión',
                  'Motor', 'Transmisión', 'Eléctrico', 'Carrocería',
                  'Neumáticos', 'Accesorios'
                ]}
                value={newAlertData.grupoRepuestos}
                onChange={(e, newValue) => setNewAlertData({ ...newAlertData, grupoRepuestos: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Grupos de Repuestos Relacionados"
                    placeholder="Seleccionar grupos..."
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Condición de Activación</InputLabel>
                <Select
                  value={newAlertData.condicionActivacion}
                  label="Condición de Activación"
                  onChange={(e) => setNewAlertData({ ...newAlertData, condicionActivacion: e.target.value })}
                >
                  <MenuItem value="compra">Después de una compra</MenuItem>
                  <MenuItem value="kilometraje">Por kilometraje del vehículo</MenuItem>
                  <MenuItem value="tiempo">Por tiempo transcurrido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Días de Recurrencia"
                type="number"
                value={newAlertData.diasRecurrencia}
                onChange={(e) => setNewAlertData({ ...newAlertData, diasRecurrencia: e.target.value })}
                placeholder="365"
                helperText="Cada cuántos días se debe activar la alerta"
                inputProps={{ min: 1, max: 3650 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Ejemplos de uso:</strong><br/>
                  • Service anual: 365 días después de compra de kit de filtros<br/>
                  • Frenos: 730 días (2 años) después de compra de frenos<br/>
                  • Mantenimiento: Cada 10,000 km de kilometraje<br/>
                  • Reactivación: 90 días sin actividad
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateAlert}
            disabled={!newAlertData.tipo || !newAlertData.mensaje}
          >
            Crear Alerta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para gestión de campañas */}
      <Dialog open={campaignDialogOpen} onClose={() => setCampaignDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <Campaign />
            </Avatar>
            <Typography variant="h6">
              Gestor de Campañas
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <CampaignManager 
            selectedClients={selectedClients}
            clientes={clientes}
            onSend={handleSendCampaign}
            onClose={() => setCampaignDialogOpen(false)}
            standalone={true}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Componente para gestión de campañas
const CampaignManager = ({ selectedClients = [], clientes = [], onSend, onClose, standalone = false }) => {
  const [campaignType, setCampaignType] = useState('whatsapp');
  const [campaignData, setCampaignData] = useState({
    nombre: '',
    asunto: '',
    mensaje: '',
    plantilla: '',
    programada: false,
    fechaEnvio: '',
    horaEnvio: '',
    imagen: null,
    imagenUrl: ''
  });
  const [savedCampaigns, setSavedCampaigns] = useState([
    {
      id: 1,
      nombre: 'Service Verano 2024',
      tipo: 'whatsapp',
      mensaje: '¡Hola {nombre}! 🌞 Llegó el verano y es momento de preparar tu {vehiculo}. Oferta especial en service completo.',
      imagen: null,
      fechaCreacion: '2024-01-15'
    },
    {
      id: 2,
      nombre: 'Promoción Frenos',
      tipo: 'email',
      asunto: 'Oferta Especial - Frenos 30% OFF',
      mensaje: 'Estimado {nombre}, tenemos una oferta imperdible en frenos para tu {vehiculo}.',
      imagen: null,
      fechaCreacion: '2024-01-10'
    }
  ]);
  const [showSavedCampaigns, setShowSavedCampaigns] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const plantillasWhatsApp = {
    mantenimiento: `¡Hola {nombre}! 🚗\n\nEs momento del service de tu {vehiculo}. En Ventas Boxer tenemos todos los repuestos originales que necesitas.\n\n✅ Filtros\n✅ Aceites\n✅ Frenos\n\n¡Agenda tu cita hoy!`,
    oferta: `¡{nombre}, oferta especial! 🎉\n\n{descuento}% OFF en repuestos para tu {vehiculo}\n\nVálido hasta {fecha}\n\n¡No te lo pierdas!`,
    reactivacion: `¡Te extrañamos {nombre}! 😊\n\nTenemos nuevos productos para tu {vehiculo}\n\nVolvé y obtené un 15% de descuento en tu próxima compra.`
  };

  const plantillasEmail = {
    newsletter: {
      asunto: 'Novedades Ventas Boxer - {mes}',
      mensaje: `Estimado/a {nombre},\n\nTe compartimos las últimas novedades en repuestos para tu {vehiculo}...`
    },
    promocion: {
      asunto: 'Oferta Especial - {descuento}% OFF',
      mensaje: `¡Hola {nombre}!\n\nTenemos una oferta especial para vos...`
    }
  };

  const handlePlantillaChange = (plantilla) => {
    if (campaignType === 'whatsapp') {
      setCampaignData({...campaignData, mensaje: plantillasWhatsApp[plantilla], plantilla});
    } else {
      const template = plantillasEmail[plantilla];
      setCampaignData({...campaignData, asunto: template.asunto, mensaje: template.mensaje, plantilla});
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCampaignData({
          ...campaignData, 
          imagen: file,
          imagenUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMessageWithAI = async () => {
    if (!campaignData.nombre) {
      alert('Por favor, ingresa un nombre para la campaña primero');
      return;
    }
    
    setGeneratingMessage(true);
    
    try {
      const generatedMessage = await geminiService.generateCampaignMessage(
        campaignData.nombre, 
        campaignType
      );
      
      setCampaignData({...campaignData, mensaje: generatedMessage});
    } catch (error) {
      console.error('Error generando mensaje:', error);
      alert('Error al generar el mensaje. Inténtalo de nuevo.');
    } finally {
      setGeneratingMessage(false);
    }
  };

  const generateImageWithAI = async () => {
    if (!campaignData.nombre) {
      alert('Por favor, ingresa un nombre para la campaña primero');
      return;
    }
    
    setGeneratingImage(true);
    
    try {
      const imageUrl = await geminiService.generateCampaignImage(
        campaignData.nombre,
        campaignData.mensaje
      );
      
      setCampaignData({...campaignData, imagenUrl: imageUrl});
    } catch (error) {
      console.error('Error generando imagen:', error);
      alert('Error al generar la imagen. Inténtalo de nuevo.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const saveCampaign = () => {
    const newCampaign = {
      id: Date.now(),
      ...campaignData,
      fechaCreacion: new Date().toISOString().split('T')[0]
    };
    setSavedCampaigns(prev => [...prev, newCampaign]);
    alert('Campaña guardada exitosamente');
  };

  const loadSavedCampaign = (campaign) => {
    setCampaignData({
      ...campaignData,
      nombre: campaign.nombre,
      asunto: campaign.asunto || '',
      mensaje: campaign.mensaje,
      imagen: campaign.imagen,
      imagenUrl: campaign.imagenUrl || ''
    });
    setCampaignType(campaign.tipo);
    setShowSavedCampaigns(false);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Tipo de Campaña</FormLabel>
            <RadioGroup
              row
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value)}
            >
              <FormControlLabel value="whatsapp" control={<Radio />} label="WhatsApp" />
              <FormControlLabel value="email" control={<Radio />} label="Email" />
            </RadioGroup>
          </FormControl>
          {standalone && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Modo independiente: Las campañas se guardarán para uso futuro. Podrás aplicarlas a clientes específicos más tarde.
              </Typography>
            </Alert>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre de la Campaña"
            value={campaignData.nombre}
            onChange={(e) => setCampaignData({...campaignData, nombre: e.target.value})}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Plantilla</InputLabel>
            <Select
              value={campaignData.plantilla}
              label="Plantilla"
              onChange={(e) => handlePlantillaChange(e.target.value)}
            >
              {campaignType === 'whatsapp' ? (
                <>
                  <MenuItem value="mantenimiento">Recordatorio Mantenimiento</MenuItem>
                  <MenuItem value="oferta">Oferta Especial</MenuItem>
                  <MenuItem value="reactivacion">Reactivación Cliente</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem value="newsletter">Newsletter</MenuItem>
                  <MenuItem value="promocion">Promoción</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
        </Grid>
        
        {campaignType === 'email' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Asunto"
              value={campaignData.asunto}
              onChange={(e) => setCampaignData({...campaignData, asunto: e.target.value})}
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={generateMessageWithAI}
              disabled={generatingMessage || !campaignData.nombre}
              startIcon={generatingMessage ? <Schedule /> : <Build />}
            >
              {generatingMessage ? 'Generando...' : 'Generar con IA'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowSavedCampaigns(true)}
            >
              Campañas Guardadas
            </Button>
          </Box>
          <TextField
            fullWidth
            label="Mensaje"
            multiline
            rows={6}
            value={campaignData.mensaje}
            onChange={(e) => setCampaignData({...campaignData, mensaje: e.target.value})}
            helperText="Variables disponibles: {nombre}, {vehiculo}, {descuento}, {fecha}"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Imagen de la Campaña</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button variant="outlined" component="span" sx={{ mr: 1 }}>
                  Subir Imagen
                </Button>
              </label>
            </Box>
            {campaignData.imagenUrl && (
              <Box sx={{ ml: 2 }}>
                <img 
                  src={campaignData.imagenUrl} 
                  alt="Preview" 
                  style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={campaignData.programada}
                onChange={(e) => setCampaignData({...campaignData, programada: e.target.checked})}
              />
            }
            label="Programar envío"
          />
        </Grid>
        
        {campaignData.programada && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Envío"
                type="date"
                value={campaignData.fechaEnvio}
                onChange={(e) => setCampaignData({...campaignData, fechaEnvio: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hora de Envío"
                type="time"
                value={campaignData.horaEnvio}
                onChange={(e) => setCampaignData({...campaignData, horaEnvio: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        )}
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>Vista Previa</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {campaignData.mensaje.replace('{nombre}', 'Juan Pérez').replace('{vehiculo}', 'Ford Focus 2018')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button 
          variant="outlined"
          onClick={saveCampaign}
          disabled={!campaignData.nombre || !campaignData.mensaje}
        >
          Guardar Campaña
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          {!standalone && (
          <Button 
            variant="contained" 
            startIcon={<Send />}
            onClick={() => onSend(campaignType)}
            disabled={!campaignData.nombre || !campaignData.mensaje}
          >
            {campaignData.programada ? 'Programar Campaña' : 'Enviar Ahora'}
          </Button>
        )}
        {standalone && (
          <Button 
            variant="contained" 
            color="success"
            onClick={() => {
              saveCampaign();
              onClose();
            }}
            disabled={!campaignData.nombre || !campaignData.mensaje}
          >
            Crear y Guardar Campaña
          </Button>
        )}
        </Box>
      </Box>
      
      {/* Dialog para campañas guardadas */}
      <Dialog open={showSavedCampaigns} onClose={() => setShowSavedCampaigns(false)} maxWidth="md" fullWidth>
        <DialogTitle>Campañas Guardadas</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {savedCampaigns.map((campaign) => (
              <Grid item xs={12} key={campaign.id}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => loadSavedCampaign(campaign)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{campaign.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {campaign.tipo === 'whatsapp' ? 'WhatsApp' : 'Email'} • {campaign.fechaCreacion}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {campaign.mensaje.substring(0, 100)}...
                        </Typography>
                      </Box>
                      {campaign.imagenUrl && (
                        <img 
                          src={campaign.imagenUrl} 
                          alt="Preview" 
                          style={{ width: 60, height: 40, borderRadius: 4 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSavedCampaigns(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Particulares;
