import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import {
  Business,
  Settings,
  CheckCircle,
  Error,
  CloudSync,
  Search,
  DirectionsCar,
  Build,
  ExpandMore,
  Api,
  Article,
} from '@mui/icons-material';

const Promotive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState('8e4aa28708151c851ddceb70bd5cc8be');
  const [clientSecret, setClientSecret] = useState('45bd24d82eba8b8194d2c7fff2db027eb006768fc8241c2810f51daa716f8895');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  // Estados para búsqueda de vehículos
  const [searchType, setSearchType] = useState('plate'); // 'plate' o 'vin'
  const [searchValue, setSearchValue] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [includePartes, setIncludePartes] = useState(false);
  
  // Estados para búsqueda de artículos
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

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
    if (!clientId || !clientSecret) {
      alert('Por favor ingresa Client ID y Client Secret');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/promotive/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        setConnectionStatus(data.data);
        alert('Conexión exitosa con Promotive');
      } else {
        alert('Error de conexión: ' + data.message);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSearch = async () => {
    if (!searchValue.trim()) {
      alert('Por favor ingresa una patente o VIN');
      return;
    }

    setLoadingVehicle(true);
    setVehicleData(null);

    try {
      const params = new URLSearchParams({
        [searchType]: searchValue.trim(),
        include_parts: includePartes
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchArticles = async () => {
    if (!searchTerm.trim()) {
      alert('Por favor ingresa un término de búsqueda');
      return;
    }

    setLoadingArticles(true);
    setArticles([]);

    try {
      const params = new URLSearchParams({
        search: searchTerm.trim(),
        page: 1,
        limit: 100
      });

      const response = await fetch(`/api/promotive/search/parts?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
      } else {
        alert('Error en la búsqueda: ' + data.message);
      }
    } catch (error) {
      console.error('Error searching articles:', error);
      alert('Error en la búsqueda');
    } finally {
      setLoadingArticles(false);
    }
  };

  // Endpoints disponibles
  const endpoints = [
    { name: 'Login', path: '/api/promotive/login', method: 'POST', status: 'active', description: 'Autenticación OAuth con SpecParts' },
    { name: 'Status', path: '/api/promotive/status', method: 'GET', status: 'active', description: 'Estado de conexión y token' },
    { name: 'Vehicle Identify', path: '/api/promotive/vehicle/identify', method: 'GET', status: 'active', description: 'Identificación por patente/VIN' },
    { name: 'Vehicle Complete', path: '/api/promotive/vehicle/complete', method: 'GET', status: 'active', description: 'Información completa del vehículo' },
    { name: 'Parts', path: '/api/promotive/parts', method: 'GET', status: 'active', description: 'Partes compatibles por vehículo' },
    { name: 'Search Parts', path: '/api/promotive/search/parts', method: 'GET', status: 'active', description: 'Búsqueda de partes por término' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Business sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Promotive / SpecParts
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            API para consulta de vehículos por patente/VIN y búsqueda de partes
          </Typography>
        </Box>
      </Box>

      {/* Conexión y Credenciales */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Settings sx={{ mr: 1 }} />
            <Typography variant="h6">Configuración de Conexión</Typography>
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                margin="normal"
                variant="outlined"
                disabled
                helperText="Credenciales precargadas para SpecParts API"
              />
              <TextField
                fullWidth
                label="Client Secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                margin="normal"
                variant="outlined"
                disabled
                helperText="Configuración automática"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleConnect}
                disabled={loading || (!clientId || !clientSecret)}
                startIcon={loading ? <CircularProgress size={20} /> : <CloudSync />}
                size="large"
                sx={{ mt: 2, height: 'fit-content', minHeight: '56px' }}
              >
                {loading ? 'Conectando...' : (isConnected ? 'Conectado ✓' : 'Conectar a SpecParts')}
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  icon={isConnected ? <CheckCircle /> : <Error />}
                  label={isConnected ? 'Conectado' : 'Desconectado'}
                  color={isConnected ? 'success' : 'error'}
                  size="small"
                  sx={{ mr: 2 }}
                />
                {connectionStatus && connectionStatus.token_expires_at && (
                  <Typography variant="body2" color="text.secondary">
                    Token expira: {new Date(connectionStatus.token_expires_at).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pestañas principales */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            icon={<Api />} 
            label="Endpoints" 
            iconPosition="start"
          />
          <Tab 
            icon={<DirectionsCar />} 
            label="Patente / Chasis" 
            iconPosition="start"
          />
          <Tab 
            icon={<Article />} 
            label="Artículos" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab 0: Endpoints */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Endpoints Disponibles
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Ruta</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {endpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell>{endpoint.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={endpoint.method} 
                        color={endpoint.method === 'GET' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {endpoint.path}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={endpoint.status} 
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{endpoint.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 1: Patente / Chasis */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Consulta de Vehículos por Patente/VIN
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    SelectProps={{ native: true }}
                    size="small"
                  >
                    <option value="plate">Patente</option>
                    <option value="vin">VIN</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={searchType === 'plate' ? 'Patente' : 'VIN'}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={searchType === 'plate' ? 'AB123CD' : '1HGBH41JXMN109186'}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includePartes}
                        onChange={(e) => setIncludePartes(e.target.checked)}
                      />
                    }
                    label="Incluir partes compatibles"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleVehicleSearch}
                    disabled={loadingVehicle || !isConnected}
                    startIcon={loadingVehicle ? <CircularProgress size={20} /> : <Search />}
                  >
                    {loadingVehicle ? 'Buscando...' : 'Buscar Vehículo'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Resultados de la búsqueda */}
          {vehicleData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Información del Vehículo
              </Typography>
              
              {/* Información básica */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Datos Básicos</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Marca:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.brand || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Modelo:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.model || vehicleData.basic_info?.master_model || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Versión:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.version || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Año:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.reference_year || vehicleData.basic_info?.year || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Motor:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.engine_displacement_liters ? `${vehicleData.basic_info.engine_displacement_liters}L` : vehicleData.basic_info?.engine || vehicleData.basic_info?.motor || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Código Motor:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.engine_code || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Combustible:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.fuel_type || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">VIN/Chasis:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.vin || vehicleData.basic_info?.chassis || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Segmento:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.segment || vehicleData.basic_info?.grouped_segment || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Código del Vehículo:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.code || vehicleData.basic_info?.vehicle_code || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Años de Venta:</Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.sold_from_year ? 
                          `${vehicleData.basic_info.sold_from_year}${vehicleData.basic_info.sold_until_year ? ` - ${vehicleData.basic_info.sold_until_year}` : ' - Presente'}` 
                          : 'No disponible'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Familia Motor:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.engine_family || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Transmisión:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.transmision || vehicleData.basic_info?.transmission || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Tracción:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.traccion || vehicleData.basic_info?.drive || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Familia:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.familia || vehicleData.basic_info?.family || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Distribución:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.distribucion || vehicleData.basic_info?.distribution || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Turbo:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.turbo ? 'Sí' : 'No'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Pasos de Caja:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.pasos_caja || vehicleData.basic_info?.gears || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Frenos Delanteros:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.frenos_del || vehicleData.basic_info?.front_brakes || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Frenos Traseros:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.frenos_tras || vehicleData.basic_info?.rear_brakes || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Dirección:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.direccion || vehicleData.basic_info?.steering || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Suspensión Delantera:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.suspension_del || vehicleData.basic_info?.front_suspension || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Suspensión Trasera:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.suspension_tras || vehicleData.basic_info?.rear_suspension || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Neumáticos:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.neumaticos || vehicleData.basic_info?.tires || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Llantas:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.llantas || vehicleData.basic_info?.wheels || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Peso:</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.pesos || vehicleData.basic_info?.weight || 'No disponible'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Años de venta</Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.sold_from_year || 'N/A'} - {vehicleData.basic_info?.sold_until_year || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Kilometraje</Typography>
                      <Typography variant="body1">{vehicleData.basic_info?.mileage || 'No disponible'}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Información técnica detallada */}
              {vehicleData.technical_details && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Información técnica adicional del vehículo</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Mostrar solo información relevante y legible */}
                      {vehicleData.technical_details.market_name && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Mercado:</Typography>
                          <Typography variant="body1">{vehicleData.technical_details.market_name}</Typography>
                        </Grid>
                      )}
                      
                      {vehicleData.technical_details.vehicle_ids && vehicleData.technical_details.vehicle_ids.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Vehículos compatibles:</Typography>
                          <Typography variant="body1">{vehicleData.technical_details.vehicle_ids.length} modelos encontrados</Typography>
                        </Grid>
                      )}
                      
                      {/* Mostrar otros campos relevantes si existen */}
                      {Object.entries(vehicleData.technical_details).map(([key, value]) => {
                        // Filtrar campos que no queremos mostrar o que ya mostramos
                        if (key === 'vehicle_ids' || key === 'market_id' || key === 'market_name') return null;
                        
                        // Solo mostrar valores que no sean arrays largos o objetos complejos
                        if (Array.isArray(value) && value.length > 10) return null;
                        if (typeof value === 'object' && value !== null) return null;
                        
                        return (
                          <Grid item xs={12} sm={6} key={key}>
                            <Typography variant="body2" color="text.secondary">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </Typography>
                            <Typography variant="body1">{String(value)}</Typography>
                          </Grid>
                        );
                      })}
                      
                      {/* Si no hay información útil, mostrar mensaje */}
                      {(!vehicleData.technical_details.market_name && 
                        !vehicleData.technical_details.vehicle_ids && 
                        Object.keys(vehicleData.technical_details).length <= 2) && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" style={{ fontStyle: 'italic' }}>
                            No hay información técnica adicional disponible para este vehículo.
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Partes compatibles */}
              {vehicleData.compatible_parts && vehicleData.compatible_parts.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">
                      Partes Compatibles ({vehicleData.compatible_parts.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Categoría</TableCell>
                            <TableCell>Producto</TableCell>
                            <TableCell>Marca</TableCell>
                            <TableCell>Código</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {vehicleData.compatible_parts.slice(0, 10).map((part, index) => (
                            <TableRow key={index}>
                              <TableCell>{part.category || 'N/A'}</TableCell>
                              <TableCell>{part.product || 'N/A'}</TableCell>
                              <TableCell>{part.brand || 'N/A'}</TableCell>
                              <TableCell>{part.code || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {vehicleData.compatible_parts.length > 10 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Mostrando 10 de {vehicleData.compatible_parts.length} partes
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Tab 2: Artículos */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Búsqueda de Artículos/Partes
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Término de búsqueda"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ej: filtro aceite, pastillas freno, bomba agua"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearchArticles}
                    disabled={loadingArticles || !isConnected}
                    startIcon={loadingArticles ? <CircularProgress size={20} /> : <Search />}
                  >
                    {loadingArticles ? 'Buscando...' : 'Buscar Artículos'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Resultados de artículos */}
          {articles.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resultados de la Búsqueda ({articles.length} artículos)
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Marca</TableCell>
                      <TableCell>Código</TableCell>
                      <TableCell>Descripción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {articles.slice(0, 50).map((article, index) => (
                      <TableRow key={index}>
                        <TableCell>{article.category || 'N/A'}</TableCell>
                        <TableCell>{article.product || 'N/A'}</TableCell>
                        <TableCell>{article.brand || 'N/A'}</TableCell>
                        <TableCell>{article.code || 'N/A'}</TableCell>
                        <TableCell>{article.description || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {articles.length > 50 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Mostrando 50 de {articles.length} artículos
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Promotive;
