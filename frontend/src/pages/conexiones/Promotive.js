import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Business,
  Settings,
  Sync,
  CheckCircle,
  Error,
  Info,
  CloudSync,
  Storage,
  TrendingUp,
  Inventory,
  LocalShipping,
} from '@mui/icons-material';

const Promotive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [lastSync, setLastSync] = useState('2024-01-15 16:45:00');
  const [tabValue, setTabValue] = useState(0);

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleSync = () => {
    setLastSync(new Date().toLocaleString());
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Datos de ejemplo para las tablas
  const recentProducts = [
    { id: 1, codigo: 'PM001', descripcion: 'Filtro de aceite premium', precio: 2500, stock: 15 },
    { id: 2, codigo: 'PM002', descripcion: 'Pastillas de freno delanteras', precio: 4200, stock: 8 },
    { id: 3, codigo: 'PM003', descripcion: 'Amortiguador trasero', precio: 12500, stock: 3 },
  ];

  const syncHistory = [
    { fecha: '2024-01-15 16:45', productos: 245, estado: 'Exitoso' },
    { fecha: '2024-01-15 12:30', productos: 238, estado: 'Exitoso' },
    { fecha: '2024-01-15 08:15', productos: 241, estado: 'Error parcial' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Business sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Promotive
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Conexión API para distribuidores de autopartes
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

              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Ingresa tu clave API de Promotive"
              />

              <TextField
                fullWidth
                label="ID de Distribuidor"
                value=""
                sx={{ mb: 2 }}
                placeholder="Tu ID de distribuidor Promotive"
              />

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
                  disabled={!apiKey || isConnected}
                  startIcon={<CloudSync />}
                >
                  {isConnected ? 'Conectado' : 'Conectar'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleSync}
                  disabled={!isConnected}
                  startIcon={<Sync />}
                >
                  Sincronizar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1 }} />
                <Typography variant="h6">Estadísticas</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      245
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Productos sincronizados
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      98.5%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasa de éxito
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Productos sin stock
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      4h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Próxima sincronización
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
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
                    primary="Catálogo disponible"
                    secondary="Más de 50,000 productos automotrices"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Sync />
                  </ListItemIcon>
                  <ListItemText
                    primary="Actualización en tiempo real"
                    secondary="Precios y stock actualizados cada hora"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocalShipping />
                  </ListItemIcon>
                  <ListItemText
                    primary="Gestión de pedidos"
                    secondary="Pedidos automáticos y seguimiento"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Inventory />
                  </ListItemIcon>
                  <ListItemText
                    primary="Control de inventario"
                    secondary="Alertas de stock mínimo"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuración Avanzada */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración de Precios
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Margen de ganancia (%)"
                    type="number"
                    defaultValue={25}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Descuento por volumen (%)"
                    type="number"
                    defaultValue={5}
                    inputProps={{ min: 0, max: 50 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Stock mínimo"
                    type="number"
                    defaultValue={10}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Actualización automática de precios"
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Datos y Historial */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Productos Recientes" />
                  <Tab label="Historial de Sincronización" />
                </Tabs>
              </Box>

              {tabValue === 0 && (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Precio</TableCell>
                        <TableCell align="right">Stock</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.codigo}</TableCell>
                          <TableCell>{product.descripcion}</TableCell>
                          <TableCell align="right">${product.precio}</TableCell>
                          <TableCell align="right">{product.stock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {tabValue === 1 && (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Productos</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {syncHistory.map((sync, index) => (
                        <TableRow key={index}>
                          <TableCell>{sync.fecha}</TableCell>
                          <TableCell align="right">{sync.productos}</TableCell>
                          <TableCell>
                            <Chip
                              label={sync.estado}
                              color={sync.estado === 'Exitoso' ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>Promotive API:</strong> Mantén tu inventario actualizado automáticamente 
        con los precios y disponibilidad más recientes de tu distribuidor de confianza.
      </Alert>
    </Box>
  );
};

export default Promotive;
