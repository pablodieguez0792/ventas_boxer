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
  Analytics, Timeline, Visibility, History, Business,
  AutoAwesome, Save, Folder
} from '@mui/icons-material';

const Talleres = () => {
  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: 'Taller Mecánico San Martín',
      nombreContacto: 'Roberto Fernández',
      telefono: '+54 11 4567-8901',
      email: 'info@tallersanmartin.com',
      direccion: 'Av. San Martín 1234, San Martín, Buenos Aires',
      cuit: '20-12345678-9',
      tipoCliente: 'Premium',
      especialidad: 'Mecánica General, Frenos, Suspensión',
      condicionPago: '30 días',
      estado: 'Activo',
      totalCompras: 45,
      montoTotal: 850000,
      descuentoActual: 20,
      ultimaCompra: '2024-01-18',
      vehiculos: [
        {
          id: 1,
          marca: 'Ford',
          modelo: 'Focus',
          año: 2020,
          patente: 'ABC123',
          kilometraje: 45000,
          vin: '1HGBH41JXMN109186',
          proximoService: '2024-03-15'
        },
        {
          id: 2,
          marca: 'Chevrolet',
          modelo: 'Onix',
          año: 2021,
          patente: 'DEF456',
          kilometraje: 32000,
          vin: '2HGBH41JXMN109187',
          proximoService: '2024-04-20'
        }
      ],
      historialCompras: [
        {
          id: 1,
          fecha: '2024-01-18',
          productos: [
            { nombre: 'Kit pastillas freno x10', cantidad: 10, precio: 8500 },
            { nombre: 'Discos freno delanteros x6', cantidad: 6, precio: 12000 },
            { nombre: 'Aceite 5W30 x20L', cantidad: 20, precio: 3200 }
          ],
          total: 149000
        }
      ],
      garantias: [
        {
          id: 1,
          producto: 'Kit pastillas freno',
          fechaCompra: '2024-01-18',
          fechaVencimiento: '2025-01-18',
          estado: 'Vigente'
        }
      ],
      alertas: [
        {
          id: 1,
          tipo: 'stock',
          mensaje: 'Nuevo stock disponible de pastillas de freno para Ford Focus',
          fecha: '2024-01-20',
          prioridad: 'media'
        }
      ],
      predicciones: {
        proximaCompra: '25 de Febrero, 2024',
        valorVidaCliente: 1200000,
        riesgoAbandono: 'Bajo',
        productosRecomendados: ['Amortiguadores', 'Kit embrague', 'Filtros de aire']
      }
    },
    {
      id: 2,
      nombre: 'AutoServicio Quilmes',
      nombreContacto: 'Ana Martínez',
      telefono: '+54 11 4321-9876',
      email: 'contacto@autoservicioquilmes.com',
      direccion: 'Rivadavia 567, Quilmes, Buenos Aires',
      cuit: '27-87654321-3',
      tipoCliente: 'Regular',
      especialidad: 'Electricidad Automotriz, Aire Acondicionado',
      condicionPago: '60 días',
      estado: 'Activo',
      totalCompras: 28,
      montoTotal: 420000,
      descuentoActual: 15,
      ultimaCompra: '2024-01-12',
      vehiculos: [
        {
          id: 3,
          marca: 'Volkswagen',
          modelo: 'Gol',
          año: 2019,
          patente: 'GHI789',
          kilometraje: 65000,
          vin: '3HGBH41JXMN109188',
          proximoService: '2024-03-25'
        }
      ],
      historialCompras: [
        {
          id: 2,
          fecha: '2024-01-12',
          productos: [
            { nombre: 'Alternador Gol', cantidad: 2, precio: 25000 },
            { nombre: 'Batería 12V 75Ah', cantidad: 3, precio: 18000 }
          ],
          total: 104000
        }
      ],
      garantias: [
        {
          id: 2,
          producto: 'Alternador Gol',
          fechaCompra: '2024-01-12',
          fechaVencimiento: '2025-07-12',
          estado: 'Vigente'
        }
      ],
      alertas: [
        {
          id: 2,
          tipo: 'oferta',
          mensaje: 'Promoción especial en baterías - 20% OFF hasta fin de mes',
          fecha: '2024-01-22',
          prioridad: 'alta'
        }
      ],
      predicciones: {
        proximaCompra: '15 de Marzo, 2024',
        valorVidaCliente: 650000,
        riesgoAbandono: 'Medio',
        productosRecomendados: ['Cables de bujía', 'Bobinas de encendido', 'Filtros de combustible']
      }
    },
    {
      id: 3,
      nombre: 'Taller Rodríguez Hnos.',
      nombreContacto: 'Miguel Rodríguez',
      telefono: '+54 11 5555-7890',
      email: 'tallerrodriguez@gmail.com',
      direccion: 'Belgrano 890, La Plata, Buenos Aires',
      cuit: '20-11223344-5',
      tipoCliente: 'Nuevo',
      especialidad: 'Chapa y Pintura, Mecánica Ligera',
      condicionPago: 'Contado',
      estado: 'Activo',
      totalCompras: 8,
      montoTotal: 95000,
      descuentoActual: 10,
      ultimaCompra: '2024-01-08',
      vehiculos: [
        {
          id: 4,
          marca: 'Fiat',
          modelo: 'Palio',
          año: 2017,
          patente: 'JKL012',
          kilometraje: 89000,
          vin: '4HGBH41JXMN109189',
          proximoService: '2024-04-15'
        },
        {
          id: 5,
          marca: 'Peugeot',
          modelo: '208',
          año: 2020,
          patente: 'MNO345',
          kilometraje: 42000,
          vin: '5HGBH41JXMN109190',
          proximoService: '2024-05-10'
        }
      ],
      historialCompras: [
        {
          id: 3,
          fecha: '2024-01-08',
          productos: [
            { nombre: 'Pintura automotriz x5L', cantidad: 5, precio: 8500 },
            { nombre: 'Masilla plástica x2kg', cantidad: 2, precio: 4200 },
            { nombre: 'Lijas varios granos x50', cantidad: 50, precio: 150 }
          ],
          total: 27000
        }
      ],
      garantias: [],
      alertas: [
        {
          id: 3,
          tipo: 'reactivacion',
          mensaje: 'Han pasado 15 días desde la última compra. ¿Necesitas más materiales?',
          fecha: '2024-01-23',
          prioridad: 'baja'
        }
      ],
      predicciones: {
        proximaCompra: '8 de Febrero, 2024',
        valorVidaCliente: 180000,
        riesgoAbandono: 'Alto',
        productosRecomendados: ['Barniz automotriz', 'Disolventes', 'Herramientas de chapa']
      }
    },
    {
      id: 4,
      nombre: 'Mecánica Integral Norte',
      nombreContacto: 'Laura Gómez',
      telefono: '+54 11 6789-0123',
      email: 'mecanicaintegral@hotmail.com',
      direccion: 'Panamericana Km 25, Tigre, Buenos Aires',
      cuit: '27-55667788-9',
      tipoCliente: 'Premium',
      especialidad: 'Motor, Transmisión, Inyección Electrónica',
      condicionPago: '90 días',
      estado: 'Activo',
      totalCompras: 62,
      montoTotal: 1250000,
      descuentoActual: 25,
      ultimaCompra: '2024-01-20',
      vehiculos: [
        {
          id: 6,
          marca: 'Toyota',
          modelo: 'Hilux',
          año: 2022,
          patente: 'PQR678',
          kilometraje: 28000,
          vin: '6HGBH41JXMN109191',
          proximoService: '2024-03-30'
        }
      ],
      historialCompras: [
        {
          id: 4,
          fecha: '2024-01-20',
          productos: [
            { nombre: 'Kit distribución Hilux', cantidad: 3, precio: 45000 },
            { nombre: 'Bomba agua x3', cantidad: 3, precio: 18000 },
            { nombre: 'Termostato x6', cantidad: 6, precio: 3500 }
          ],
          total: 198000
        }
      ],
      garantias: [
        {
          id: 3,
          producto: 'Kit distribución Hilux',
          fechaCompra: '2024-01-20',
          fechaVencimiento: '2026-01-20',
          estado: 'Vigente'
        }
      ],
      alertas: [
        {
          id: 4,
          tipo: 'mantenimiento',
          mensaje: 'Recordatorio: Próximo pedido programado para fin de mes',
          fecha: '2024-01-25',
          prioridad: 'media'
        }
      ],
      predicciones: {
        proximaCompra: '28 de Enero, 2024',
        valorVidaCliente: 2000000,
        riesgoAbandono: 'Muy Bajo',
        productosRecomendados: ['Juntas de motor', 'Sensores varios', 'Correas de distribución']
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
    condicionActivacion: 'compra'
  });
  const [filterUltimaCompra, setFilterUltimaCompra] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedTaller, setSelectedTaller] = useState(null);
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
    const nuevaAlerta = {
      id: Date.now(),
      ...newAlertData,
      activa: true,
      fechaCreacion: new Date().toISOString().split('T')[0],
      clientesAfectados: 0
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
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Talleres
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
                  <Business />
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
                  <Business />
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
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.filter(c => c.estado === 'Inactivo').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Talleres Inactivos
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
                    Vehículos Comerciales
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
              label="Buscar taller"
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
              Taller
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
              {selectedClients.length} taller(es) seleccionado(s)
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
              <TableCell>Taller</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Compras</TableCell>
              <TableCell>Total Facturado</TableCell>
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
                <TableCell>
                  <Chip
                    label={cliente.tipoCliente}
                    color={getTipoColor(cliente.tipoCliente)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold">
                    {cliente.totalCompras}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    ${cliente.montoTotal.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {cliente.ultimaCompra ? (
                    <Typography variant="body2">
                      {new Date(cliente.ultimaCompra).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin compras
                    </Typography>
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
                      <Badge badgeContent={cliente.alertas.length} color="error">
                        <Notifications fontSize="small" />
                      </Badge>
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

      {/* Dialog para crear/editar taller */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCliente ? 'Editar Taller' : 'Nuevo Taller'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Taller"
                value={formData.nombreTaller}
                onChange={(e) => setFormData({ ...formData, nombreTaller: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de Contacto"
                value={formData.nombreContacto}
                onChange={(e) => setFormData({ ...formData, nombreContacto: e.target.value })}
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
              <TextField
                fullWidth
                label="CUIT"
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Taller</InputLabel>
                <Select
                  value={formData.tipoTaller}
                  label="Tipo de Taller"
                  onChange={(e) => setFormData({ ...formData, tipoTaller: e.target.value })}
                >
                  <MenuItem value="Multimarca">Multimarca</MenuItem>
                  <MenuItem value="Especializado">Especializado</MenuItem>
                  <MenuItem value="Concesionario">Concesionario</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Especialidad"
                value={formData.especialidad}
                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Condición de Pago</InputLabel>
                <Select
                  value={formData.condicionPago}
                  label="Condición de Pago"
                  onChange={(e) => setFormData({ ...formData, condicionPago: e.target.value })}
                >
                  <MenuItem value="Contado">Contado</MenuItem>
                  <MenuItem value="Cuenta Corriente">Cuenta Corriente</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Descuento Acordado (%)"
                type="number"
                value={formData.descuentoAcordado}
                onChange={(e) => setFormData({ ...formData, descuentoAcordado: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100 }}
              />
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedCliente ? 'Guardar Cambios' : 'Crear Taller'}
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
                Modo independiente: Las campañas se guardarán para uso futuro. Podrás aplicarlas a talleres específicos más tarde.
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
                  <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                  <MenuItem value="oferta">Oferta</MenuItem>
                  <MenuItem value="reactivacion">Reactivación</MenuItem>
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
              label="Asunto del Email"
              value={campaignData.asunto}
              onChange={(e) => setCampaignData({...campaignData, asunto: e.target.value})}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesome />}
              onClick={generateMessageWithAI}
              disabled={generatingMessage}
            >
              {generatingMessage ? 'Generando...' : 'Generar con IA'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={saveCampaign}
              disabled={!campaignData.nombre || !campaignData.mensaje}
            >
              Guardar Campaña
            </Button>
            <Button
              variant="outlined"
              startIcon={<Folder />}
              onClick={() => setShowSavedCampaigns(!showSavedCampaigns)}
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
            placeholder="Escribe tu mensaje aquí..."
            helperText="Variables disponibles: {nombre}, {vehiculo}, {descuento}, {fecha}"
          />
        </Grid>

        {showSavedCampaigns && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Campañas Guardadas</Typography>
                <List>
                  {savedCampaigns.map((campaign) => (
                    <ListItem key={campaign.id} divider>
                      <ListItemText
                        primary={campaign.nombre}
                        secondary={`${campaign.tipo} - ${campaign.fechaCreacion}`}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          onClick={() => loadSavedCampaign(campaign)}
                        >
                          Cargar
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={() => onSend(campaignData)}
              disabled={!campaignData.mensaje}
            >
              {selectedClients.length > 0 ? `Enviar a ${selectedClients.length} talleres` : 'Enviar'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Talleres;
