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
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Agriculture,
  Settings,
  Sync,
  CheckCircle,
  Error,
  Info,
  CloudSync,
  Storage,
  Refresh,
  AccessTime,
  Api,
  Inventory,
  Receipt,
  LocalOffer,
  Timeline,
  Warning,
} from '@mui/icons-material';

const RuralSantaFe = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [cuentaRSF, setCuentaRSF] = useState('5482');
  const [password, setPassword] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [lastSync, setLastSync] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [syncStats, setSyncStats] = useState({
    products_synced: 0,
    success_rate: 0,
    last_sync: ''
  });
  const [tabValue, setTabValue] = useState(0);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [endpoints, setEndpoints] = useState([
    { name: 'Login', path: '/api/rsf/login', method: 'POST', status: 'active', description: 'Autenticación con RSF' },
    { name: 'Status', path: '/api/rsf/status', method: 'GET', status: 'active', description: 'Estado de conexión' },
    { name: 'Products', path: '/api/rsf/products', method: 'GET', status: 'active', description: 'Lista de productos' },
    { name: 'Search', path: '/api/rsf/products/search', method: 'GET', status: 'active', description: 'Búsqueda de productos' },
    { name: 'Discounts', path: '/api/rsf/discounts', method: 'GET', status: 'active', description: 'Descuentos por marca' },
    { name: 'Orders', path: '/api/rsf/orders', method: 'POST', status: 'active', description: 'Envío de pedidos' },
    { name: 'Documents', path: '/api/rsf/documents', method: 'GET', status: 'active', description: 'Facturas y documentos' },
    { name: 'Sync Status', path: '/api/rsf/sync/status', method: 'GET', status: 'active', description: 'Estado de sincronización' }
  ]);

  const handleConnect = async () => {
    if (!cuentaRSF || !password) {
      alert('Por favor ingresa cuenta RSF y contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/rsf/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cuenta_rsf: cuentaRSF,
          password: password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        setRazonSocial(data.data.razon_social);
        setTokenExpiry(data.data.expires_at);
        setLastSync(new Date().toLocaleString());
        await loadProducts();
        await loadSyncStatus();
        await loadDiscounts();
        await loadDocuments();
      } else {
        alert('Error de autenticación: ' + data.message);
      }
    } catch (error) {
      console.error('Error conectando:', error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await loadProducts();
      await loadSyncStatus();
      await loadDiscounts();
      await loadDocuments();
      setLastSync(new Date().toLocaleString());
    } catch (error) {
      console.error('Error sincronizando:', error);
      alert('Error de sincronización');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!cuentaRSF || !password) {
      alert('Necesitas ingresar credenciales para renovar el token');
      return;
    }
    await handleConnect();
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/rsf/products?limit=10');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/rsf/sync/status');
      const data = await response.json();
      if (data.success) {
        setSyncStats(data.data.sync);
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/rsf/status');
      const data = await response.json();
      if (data.success && data.data.connected) {
        setIsConnected(true);
        setRazonSocial(data.data.razon_social);
        setCuentaRSF(data.data.cuenta_rsf);
        await loadProducts();
        await loadSyncStatus();
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Agriculture sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Rural Santa Fe
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Conexión API para sincronización de productos agropecuarios
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Estado de Conexión */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1 }} />
                <Typography variant="h6">Estado de Conexión</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  icon={isConnected ? <CheckCircle /> : <Error />}
                  label={isConnected ? 'Conectado' : 'Desconectado'}
                  color={isConnected ? 'success' : 'error'}
                  sx={{ mr: 2 }}
                />
                {isConnected && (
                  <Typography variant="body2" color="text.secondary">
                    Última sincronización: {lastSync}
                  </Typography>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {syncStats.products_synced || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Productos sincronizados
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {syncStats.success_rate || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasa de éxito
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Cuenta RSF"
                value={cuentaRSF}
                onChange={(e) => setCuentaRSF(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Número de cuenta RSF"
              />

              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Contraseña de tu cuenta RSF"
              />

              {razonSocial && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Razón Social:</strong> {razonSocial}
                </Typography>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                  />
                }
                label="Sincronización automática"
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleConnect}
                  disabled={loading || (!cuentaRSF || !password) && !isConnected}
                  startIcon={<CloudSync />}
                >
                  {loading ? 'Conectando...' : (isConnected ? 'Conectado' : 'Conectar')}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleSync}
                  disabled={!isConnected || loading}
                  startIcon={<Sync />}
                >
                  {loading ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de la API */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info sx={{ mr: 1 }} />
                <Typography variant="h6">Información de la API</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Storage />
                  </ListItemIcon>
                  <ListItemText
                    primary="Productos disponibles"
                    secondary="Repuestos agrícolas, herramientas, insumos"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Sync />
                  </ListItemIcon>
                  <ListItemText
                    primary="Frecuencia de actualización"
                    secondary="Cada 4 horas o manual"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle />
                  </ListItemIcon>
                  <ListItemText
                    primary="Datos sincronizados"
                    secondary="Precios, stock, descripciones, códigos"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuración Avanzada */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración Avanzada
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Intervalo de sincronización (horas)"
                    type="number"
                    defaultValue={4}
                    inputProps={{ min: 1, max: 24 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Margen de precio (%)"
                    type="number"
                    defaultValue={15}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Stock mínimo"
                    type="number"
                    defaultValue={5}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Nota:</strong> La sincronización con Rural Santa Fe permite mantener 
                actualizados los precios y stock de productos agropecuarios automáticamente.
              </Alert>

              <Button variant="outlined" color="primary">
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RuralSantaFe;
