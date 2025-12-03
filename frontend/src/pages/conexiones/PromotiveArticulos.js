import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Checkbox,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Popover,
} from '@mui/material';
import {
  Search,
  Refresh,
  Assignment,
  Print,
  LocalShipping,
  Label,
  ExpandMore,
  Add,
  FilterList,
  DirectionsCar,
  CheckCircle,
  Error,
  Info,
  Close,
} from '@mui/icons-material';

const PromotiveArticulos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAutopartes, setFilterAutopartes] = useState('Autopartes');
  const [filterTodas, setFilterTodas] = useState('Todas');
  const [filterModelo, setFilterModelo] = useState('');
  
  // Estados para conexión y búsqueda de vehículos
  const [isConnected, setIsConnected] = useState(false);
  const [searchType, setSearchType] = useState('plate'); // 'plate' o 'vin'
  const [searchValue, setSearchValue] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [includePartes, setIncludePartes] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [autoConnecting, setAutoConnecting] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const showVehicleSearch = Boolean(anchorEl);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);

  // Generar 100 artículos de ejemplo
  const generateArticles = () => {
    const marcas = ['Bosch', 'NGK', 'Mann Filter', 'Mahle', 'SKF', 'Gates', 'Valeo', 'Denso', 'Brembo', 'Monroe'];
    const rubros = ['Motor', 'Frenos', 'Suspensión', 'Transmisión', 'Eléctrico', 'Filtros', 'Refrigeración'];
    const subrubros = ['Repuestos', 'Accesorios', 'Consumibles', 'Originales', 'Alternativos'];
    const proveedores = ['Proveedor A', 'Proveedor B', 'Proveedor C', 'Distribuidora XYZ', 'Importadora ABC'];
    const ubicaciones = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2'];
    const descripciones = [
      'Filtro de aceite', 'Pastillas de freno', 'Amortiguador', 'Bujía', 'Correa de distribución',
      'Bomba de agua', 'Alternador', 'Motor de arranque', 'Radiador', 'Termostato',
      'Filtro de aire', 'Filtro de combustible', 'Disco de freno', 'Rotula', 'Bieleta',
      'Kit de embrague', 'Volante motor', 'Sensor de oxígeno', 'Bobina de encendido', 'Batería'
    ];

    const articles = [];
    for (let i = 1; i <= 100; i++) {
      const marca = marcas[Math.floor(Math.random() * marcas.length)];
      const desc = descripciones[Math.floor(Math.random() * descripciones.length)];
      const costo = (Math.random() * 50000 + 5000).toFixed(2);
      const lista = (parseFloat(costo) * 1.3).toFixed(2);
      const venta = (parseFloat(costo) * 1.5).toFixed(2);
      
      articles.push({
        id: i,
        repuestoAgrupado: `Grupo ${Math.floor(Math.random() * 20) + 1}`,
        imagen: '🔧',
        articulo: `ART${String(i).padStart(5, '0')}`,
        original: `OEM${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
        auxiliar: `AUX${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
        descripcion: `${desc} ${marca}`,
        marca: marca,
        rubro: rubros[Math.floor(Math.random() * rubros.length)],
        subrubro: subrubros[Math.floor(Math.random() * subrubros.length)],
        listaPrecios: `Lista ${Math.floor(Math.random() * 5) + 1}`,
        pCosto: `$${costo}`,
        pLista: `$${lista}`,
        pVenta: `$${venta}`,
        stock: Math.floor(Math.random() * 50),
        stockDeseado: Math.floor(Math.random() * 100) + 20,
        proveedor: proveedores[Math.floor(Math.random() * proveedores.length)],
        ubicacion: ubicaciones[Math.floor(Math.random() * ubicaciones.length)]
      });
    }
    return articles;
  };

  const [articles] = useState(generateArticles());

  const handleFilterArticles = () => {
    if (!vehicleData) {
      alert('Primero debes buscar un vehículo');
      return;
    }
    
    if (isFiltered) {
      // Si ya está filtrado, mostrar todos
      setIsFiltered(false);
      setFilteredArticles([]);
    } else {
      // Filtrar y mostrar solo 10 artículos
      const filtered = articles.slice(0, 10);
      setFilteredArticles(filtered);
      setIsFiltered(true);
    }
  };

  const displayedArticles = isFiltered ? filteredArticles : articles;

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/promotive/status');
      const data = await response.json();
      setConnectionStatus(data);
      setIsConnected(data.connected && data.token_valid);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleConnect = async () => {
    setAutoConnecting(true);
    try {
      const response = await fetch('/api/promotive/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: '8e4aa28708151c851ddceb70bd5cc8be',
          client_secret: '45bd24d82eba8b8194d2c7fff2db027eb006768fc8241c2810f51daa716f8895',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsConnected(true);
        await checkConnectionStatus();
      } else {
        alert('Error al conectar: ' + data.message);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Error al conectar con la API');
    } finally {
      setAutoConnecting(false);
    }
  };

  const handleSearchVehicle = async () => {
    if (!searchValue.trim()) {
      alert('Por favor ingresa una patente o VIN');
      return;
    }

    // Si no está conectado, conectar automáticamente
    if (!isConnected) {
      await handleConnect();
    }

    setLoadingVehicle(true);
    setVehicleData(null);

    try {
      const params = new URLSearchParams({
        [searchType]: searchValue.trim(),
        include_parts: includePartes,
      });

      const response = await fetch(`/api/promotive/vehicle/complete?${params}`);
      const data = await response.json();

      if (data.success) {
        setVehicleData(data.data);
      } else {
        alert('Vehículo no encontrado: ' + data.message);
      }
    } catch (error) {
      console.error('Error searching vehicle:', error);
      alert('Error en la búsqueda');
    } finally {
      setLoadingVehicle(false);
    }
  };

  const columns = [
    { id: 'repuestoAgrupado', label: 'Repuesto Agrupado', width: '140px' },
    { id: 'articulo', label: 'Artículo', width: '100px' },
    { id: 'original', label: 'Original', width: '100px' },
    { id: 'auxiliar', label: 'Auxiliar', width: '90px' },
    { id: 'descripcion', label: 'Descripción', width: '150px' },
    { id: 'marca', label: 'Marca', width: '90px' },
    { id: 'rubro', label: 'Rubro', width: '90px' },
    { id: 'subrubro', label: 'Subrubro', width: '100px' },
    { id: 'pCosto', label: 'P. Costo', width: '90px' },
    { id: 'pLista', label: 'P. Lista', width: '90px' },
    { id: 'pVenta', label: 'P. Venta', width: '90px' },
    { id: 'stock', label: 'Stock', width: '80px' },
    { id: 'proveedor', label: 'Proveedor', width: '110px' },
    { id: 'ubicacion', label: 'Ubicación', width: '100px' },
    { id: 'opciones', label: 'Opciones', width: '100px' },
  ];

  return (
    <Box sx={{ p: 2.5, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '18px', color: '#333', fontWeight: 600 }}>
          Artículos
        </Typography>
      </Box>

      {/* Modal con detalles completos */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCar color="primary" />
              <Typography variant="h6">Detalles Completos del Vehículo</Typography>
            </Box>
            <IconButton onClick={() => setOpenModal(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {/* Información General */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            📋 Información General
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {vehicleData?.basic_info?.brand && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Marca</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.brand}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.model || vehicleData?.basic_info?.master_model) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Modelo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.model || vehicleData.basic_info.master_model}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.version && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Versión</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.version}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.reference_year || vehicleData?.basic_info?.year) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Año</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.reference_year || vehicleData.basic_info.year}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.segment || vehicleData?.basic_info?.grouped_segment) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Segmento</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.segment || vehicleData.basic_info.grouped_segment}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.familia || vehicleData?.basic_info?.family) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Familia</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.familia || vehicleData.basic_info.family}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.sold_from_year || vehicleData?.basic_info?.sold_until_year) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Años de Venta</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {vehicleData.basic_info.sold_from_year || '?'} - {vehicleData.basic_info.sold_until_year || 'Presente'}
                </Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.code || vehicleData?.basic_info?.vehicle_code) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Código del Vehículo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{vehicleData.basic_info.code || vehicleData.basic_info.vehicle_code}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.market_name && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Nombre de Mercado</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.market_name}</Typography>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Motor y Transmisión */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            🔧 Motor y Transmisión
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {(vehicleData?.basic_info?.engine_displacement_liters || vehicleData?.basic_info?.engine || vehicleData?.basic_info?.motor) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Cilindrada</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {vehicleData.basic_info.engine_displacement_liters ? `${vehicleData.basic_info.engine_displacement_liters}L` : vehicleData.basic_info.engine || vehicleData.basic_info.motor}
                </Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.engine_code && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Código Motor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.engine_code}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.engine_family && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Familia Motor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.engine_family}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.fuel_type && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Combustible</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.fuel_type}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.turbo !== undefined && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Turbo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.turbo ? 'Sí' : 'No'}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.distribucion || vehicleData?.basic_info?.distribution) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Distribución</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.distribucion || vehicleData.basic_info.distribution}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.transmision || vehicleData?.basic_info?.transmission) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Transmisión</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.transmision || vehicleData.basic_info.transmission}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.pasos_caja || vehicleData?.basic_info?.gears) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Marchas</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.pasos_caja || vehicleData.basic_info.gears}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.traccion || vehicleData?.basic_info?.drive) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Tracción</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.traccion || vehicleData.basic_info.drive}</Typography>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Chasis y Suspensión */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            🚗 Chasis y Suspensión
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {vehicleData?.basic_info?.vin && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" display="block">VIN/Chasis</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '1.1rem' }}>{vehicleData.basic_info.vin}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.frenos_del || vehicleData?.basic_info?.front_brakes) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Frenos Delanteros</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.frenos_del || vehicleData.basic_info.front_brakes}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.frenos_tras || vehicleData?.basic_info?.rear_brakes) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Frenos Traseros</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.frenos_tras || vehicleData.basic_info.rear_brakes}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.direccion || vehicleData?.basic_info?.steering) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Dirección</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.direccion || vehicleData.basic_info.steering}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.suspension_del || vehicleData?.basic_info?.front_suspension) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Suspensión Delantera</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.suspension_del || vehicleData.basic_info.front_suspension}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.suspension_tras || vehicleData?.basic_info?.rear_suspension) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Suspensión Trasera</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.suspension_tras || vehicleData.basic_info.rear_suspension}</Typography>
              </Grid>
            )}
          </Grid>

          {/* Partes Compatibles */}
          {vehicleData?.compatible_parts && vehicleData.compatible_parts.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                🔩 Partes Compatibles ({vehicleData.compatible_parts.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Se encontraron {vehicleData.compatible_parts.length} partes compatibles con este vehículo.
              </Typography>
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para guardar en cliente */}
      <Dialog 
        open={openClientModal} 
        onClose={() => setOpenClientModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Guardar Vehículo en Cliente</Typography>
            <IconButton onClick={() => setOpenClientModal(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona el cliente al que deseas asociar este vehículo:
          </Typography>
          <Typography variant="subtitle2" sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <strong>Vehículo:</strong> {vehicleData?.basic_info?.brand} {vehicleData?.basic_info?.model} - {vehicleData?.basic_info?.year}
          </Typography>
          <FormControl fullWidth>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Cliente
            </Typography>
            <Select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              displayEmpty
              size="small"
            >
              <MenuItem value="" disabled>
                Seleccionar cliente...
              </MenuItem>
              <MenuItem value="cliente1">Juan Pérez - DNI: 12345678</MenuItem>
              <MenuItem value="cliente2">María García - DNI: 87654321</MenuItem>
              <MenuItem value="cliente3">Carlos López - DNI: 11223344</MenuItem>
              <MenuItem value="cliente4">Ana Martínez - DNI: 55667788</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setOpenClientModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (!selectedClient) {
                alert('Por favor selecciona un cliente');
                return;
              }
              // Aquí iría la lógica para guardar
              alert('Vehículo guardado en cliente exitosamente');
              setOpenClientModal(false);
              setSelectedClient('');
            }} 
            variant="contained"
            disabled={!selectedClient}
            sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#45a049' } }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
            <TextField
              placeholder='Buscar por código o descripción'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size='small'
              sx={{ width: '260px', '& .MuiOutlinedInput-root': { fontSize: '12px', height: '34px', backgroundColor: 'white' }, '& .MuiOutlinedInput-input': { padding: '8px 12px' } }}
              InputProps={{ startAdornment: (<InputAdornment position='start'><Search sx={{ fontSize: 16, color: '#666' }} /></InputAdornment>) }}
            />
            <IconButton sx={{ width: '34px', height: '34px', border: '1px solid #d0d0d0', borderRadius: '4px', color: '#666', '&:hover': { backgroundColor: '#f5f5f5' } }}>
              <Search sx={{ fontSize: 16 }} />
            </IconButton>
            <FormControl size='small' sx={{ minWidth: 120 }}>
              <Select value={filterAutopartes} onChange={(e) => setFilterAutopartes(e.target.value)} sx={{ fontSize: '12px', height: '34px', backgroundColor: 'white', '& .MuiSelect-select': { padding: '7px 12px' } }}>
                <MenuItem value='Autopartes' sx={{ fontSize: '12px' }}>Autopartes</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 120 }}>
              <Select value={filterTodas} onChange={(e) => setFilterTodas(e.target.value)} sx={{ fontSize: '12px', height: '34px', backgroundColor: 'white', '& .MuiSelect-select': { padding: '7px 12px' } }}>
                <MenuItem value='Todas' sx={{ fontSize: '12px' }}>Todas</MenuItem>
              </Select>
            </FormControl>
            <TextField placeholder='Modelo (sin selección)' value={filterModelo} onChange={(e) => setFilterModelo(e.target.value)} size='small' sx={{ width: '160px', '& .MuiOutlinedInput-root': { fontSize: '12px', height: '34px', backgroundColor: 'white' }, '& .MuiOutlinedInput-input': { padding: '8px 12px' } }} />
            <Box sx={{ ml: 'auto' }}>
              <Button variant='text' endIcon={<FilterList sx={{ fontSize: 14 }} />} sx={{ fontSize: '10px', textTransform: 'uppercase', color: '#1976d2', fontWeight: 600, height: '34px', px: 1.5, letterSpacing: '0.3px', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>
                FILTROS AVANZADOS
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, flexWrap: 'wrap' }}>
            <Button variant='contained' startIcon={<Refresh sx={{ fontSize: 13 }} />} sx={{ backgroundColor: '#757575', color: 'white', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, height: '28px', px: 1.2, minWidth: 'auto', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#616161' } }}>STOCK RESERVADO</Button>
            <Button variant='contained' startIcon={<Assignment sx={{ fontSize: 13 }} />} sx={{ backgroundColor: '#757575', color: 'white', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, height: '28px', px: 1.2, minWidth: 'auto', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#616161' } }}>DESCARGAR ARTÍCULOS</Button>
            <Button variant='contained' startIcon={<Print sx={{ fontSize: 13 }} />} sx={{ backgroundColor: '#757575', color: 'white', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, height: '28px', px: 1.2, minWidth: 'auto', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#616161' } }}>IMPRIMIR</Button>
            <Button variant='contained' startIcon={<LocalShipping sx={{ fontSize: 13 }} />} sx={{ backgroundColor: '#757575', color: 'white', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, height: '28px', px: 1.2, minWidth: 'auto', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#616161' } }}>CARGA MASIVA STOCK</Button>
            <Button variant='contained' startIcon={<Label sx={{ fontSize: 13 }} />} sx={{ backgroundColor: '#757575', color: 'white', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, height: '28px', px: 1.2, minWidth: 'auto', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#616161' } }}>IMPRESIÓN ETIQUETAS</Button>
            <Button variant='contained' startIcon={<DirectionsCar sx={{ fontSize: 13 }} />} onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)} sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, height: '28px', px: 1.2, minWidth: 'auto', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#1565c0' } }}>BUSCAR VEHÍCULO</Button>
            {showVehicleSearch && (
              <>
                <TextField
                  select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  SelectProps={{ native: true }}
                  size="small"
                  sx={{ width: '100px', '& .MuiOutlinedInput-root': { fontSize: '12px', height: '28px', backgroundColor: 'white' } }}
                >
                  <option value="plate">Patente</option>
                  <option value="vin">VIN</option>
                </TextField>
                <TextField
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'plate' ? 'AB123CD' : 'VIN'}
                  size="small"
                  sx={{ width: '150px', '& .MuiOutlinedInput-root': { fontSize: '12px', height: '28px', backgroundColor: 'white' } }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchVehicle();
                    }
                  }}
                />
                <IconButton
                  onClick={handleSearchVehicle}
                  disabled={loadingVehicle || !isConnected}
                  sx={{ width: '28px', height: '28px', backgroundColor: '#1976d2', color: 'white', '&:hover': { backgroundColor: '#1565c0' }, '&:disabled': { backgroundColor: '#ccc' } }}
                >
                  {loadingVehicle ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Search sx={{ fontSize: 16 }} />}
                </IconButton>
              </>
            )}
          </Box>
          
          {/* Resultados del vehículo - Versión compacta inline */}
          {vehicleData && (
            <Box sx={{ mt: 1 }}>
              <Alert 
                severity="success" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  py: 0.5,
                  px: 1.5,
                  '& .MuiAlert-message': { width: '100%', py: 0 },
                  '& .MuiAlert-icon': { fontSize: 18, mr: 1 }
                }}
                action={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button
                      size="small"
                      startIcon={<Info sx={{ fontSize: 14 }} />}
                      onClick={() => setOpenModal(true)}
                      sx={{ 
                        whiteSpace: 'nowrap',
                        fontSize: '10px',
                        height: '24px',
                        px: 1
                      }}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setOpenClientModal(true)}
                      sx={{ 
                        whiteSpace: 'nowrap',
                        fontSize: '10px',
                        height: '24px',
                        px: 1,
                        backgroundColor: '#4caf50',
                        '&:hover': { backgroundColor: '#45a049' }
                      }}
                    >
                      Guardar en Cliente
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleFilterArticles}
                      sx={{ 
                        whiteSpace: 'nowrap',
                        fontSize: '10px',
                        height: '24px',
                        px: 1,
                        backgroundColor: isFiltered ? '#ff9800' : '#9c27b0',
                        '&:hover': { backgroundColor: isFiltered ? '#f57c00' : '#7b1fa2' }
                      }}
                    >
                      {isFiltered ? 'Mostrar Todos' : 'Filtrar Artículos'}
                    </Button>
                  </Box>
                }
              >
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '11px' }}>
                  {vehicleData.basic_info?.brand || 'N/A'} {vehicleData.basic_info?.model || vehicleData.basic_info?.master_model || 'N/A'}
                  {' - '}
                  {vehicleData.basic_info?.reference_year || vehicleData.basic_info?.year || 'N/A'}
                  {' '}
                  {vehicleData.basic_info?.version || 'N/A'}
                  {' - '}
                  Motor: {vehicleData.basic_info?.engine_displacement_liters 
                    ? `${vehicleData.basic_info.engine_displacement_liters}L`
                    : vehicleData.basic_info?.engine || vehicleData.basic_info?.motor || 'N/A'}
                  {vehicleData.basic_info?.engine_code && ` (${vehicleData.basic_info.engine_code})`}
                  {' - '}
                  Combustible: {vehicleData.basic_info?.fuel_type || 'N/A'}
                </Typography>
              </Alert>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mt: vehicleData ? 1.5 : 0 }}>
            <Button variant='outlined' startIcon={<Checkbox size='small' sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 14 } }} />} endIcon={<ExpandMore sx={{ fontSize: 14 }} />} sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600, height: '28px', px: 1, borderColor: '#d0d0d0', color: '#555', minWidth: 'auto', letterSpacing: '0.2px', '&:hover': { borderColor: '#999', backgroundColor: '#fafafa' } }}>GUARDAR COMBINACIÓN DE ARTÍCULOS</Button>
            <Button variant='outlined' startIcon={<Checkbox size='small' sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 14 } }} />} endIcon={<ExpandMore sx={{ fontSize: 14 }} />} sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600, height: '28px', px: 1, borderColor: '#d0d0d0', color: '#555', minWidth: 'auto', letterSpacing: '0.2px', '&:hover': { borderColor: '#999', backgroundColor: '#fafafa' } }}>ARTÍCULO LISTADO ANTERIOR</Button>
            <Button variant='outlined' startIcon={<Checkbox size='small' sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 14 } }} />} endIcon={<ExpandMore sx={{ fontSize: 14 }} />} sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600, height: '28px', px: 1, borderColor: '#d0d0d0', color: '#555', minWidth: 'auto', letterSpacing: '0.2px', '&:hover': { borderColor: '#999', backgroundColor: '#fafafa' } }}>GUARDAR CÓDIGO</Button>
            <Button variant='outlined' startIcon={<Checkbox size='small' sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 14 } }} />} endIcon={<ExpandMore sx={{ fontSize: 14 }} />} sx={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600, height: '28px', px: 1, borderColor: '#d0d0d0', color: '#555', minWidth: 'auto', letterSpacing: '0.2px', '&:hover': { borderColor: '#999', backgroundColor: '#fafafa' } }}>GUARDAR DOCUMENTO</Button>
            <Button variant='contained' sx={{ backgroundColor: '#9e9e9e', color: 'white', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, height: '28px', px: 1.5, ml: 'auto', minWidth: 'auto', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#757575' } }}>LIMPIAR</Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Button variant='contained' startIcon={<Add sx={{ fontSize: 16 }} />} sx={{ backgroundColor: '#9c27b0', color: 'white', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, height: '32px', px: 2, borderRadius: '20px', letterSpacing: '0.3px', '&:hover': { backgroundColor: '#7b1fa2' } }}>NUEVO ARTÍCULO</Button>
        </Box>
        <TableContainer>
          <Table stickyHeader size='small'>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 700, fontSize: '10px', padding: '10px 8px', width: column.width, minWidth: column.width, borderRight: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.2px', '&:last-child': { borderRight: 'none' } }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedArticles.map((article) => (
                <TableRow key={article.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{article.repuestoAgrupado}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>{article.articulo}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{article.original}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{article.auxiliar}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'left', borderRight: '1px solid #e0e0e0' }}>{article.descripcion}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{article.marca}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{article.rubro}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{article.subrubro}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'right', borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>{article.pCosto}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'right', borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>{article.pLista}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'right', borderRight: '1px solid #e0e0e0', fontWeight: 600, color: '#1976d2' }}>{article.pVenta}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0', fontWeight: 600, color: article.stock < 10 ? '#f44336' : '#4caf50' }}>{article.stock}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{article.proveedor}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center', borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>{article.ubicacion}</TableCell>
                  <TableCell sx={{ fontSize: '11px', padding: '8px', textAlign: 'center' }}>
                    <IconButton size="small" sx={{ color: '#1976d2' }}>
                      <Search sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PromotiveArticulos;
