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
  CircularProgress,
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
  ShoppingCart,
  Warning,
  NavigateBefore,
  NavigateNext,
  GetApp,
  ExpandMore,
  ExpandLess,
  Visibility
} from '@mui/icons-material';

const RuralSantaFe = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [cuentaRSF, setCuentaRSF] = useState('5482');
  const [password, setPassword] = useState('');
  const [lastSync, setLastSync] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [tokenMinutesRemaining, setTokenMinutesRemaining] = useState(0);
  const [isTokenExpired, setIsTokenExpired] = useState(true);
  const [discounts, setDiscounts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  
  // Filtros de productos
  const [filterMarca, setFilterMarca] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [filterOEM, setFilterOEM] = useState('');
  const [filterCodigo, setFilterCodigo] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 100;
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
        // Actualizar estado del token después del login
        await checkConnectionStatus();
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


  const handleRefreshToken = async () => {
    if (!cuentaRSF || !password) {
      alert('Necesitas ingresar credenciales para renovar el token');
      return;
    }
    await handleConnect();
  };

  const loadProducts = async (page = 1) => {
    setLoadingProducts(true);
    try {
      const url = `/api/rsf/products?page=${page}&page_size=1000`; // Cargar más productos para filtrar localmente
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          // Primera carga - reemplazar todos los productos
          setAllProducts(data.data);
          setFilteredProducts(data.data);
          setProducts(data.data.slice(0, pageSize));
        } else {
          // Cargas adicionales - agregar productos
          const newAllProducts = [...allProducts, ...data.data];
          setAllProducts(newAllProducts);
          setFilteredProducts(newAllProducts);
          setProducts(newAllProducts.slice(0, pageSize));
        }
        
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
        setTotalItems(data.pagination.total_items);
      } else {
        console.error('Error cargando productos:', data.message);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];
    
    if (filterMarca) {
      filtered = filtered.filter(p => 
        p.marca_rsf.toLowerCase().includes(filterMarca.toLowerCase()) ||
        p.marca_original.toLowerCase().includes(filterMarca.toLowerCase())
      );
    }
    
    if (filterRubro) {
      filtered = filtered.filter(p => 
        p.rubro.toLowerCase().includes(filterRubro.toLowerCase())
      );
    }
    
    if (filterOEM) {
      filtered = filtered.filter(p => 
        p.oem.toLowerCase().includes(filterOEM.toLowerCase())
      );
    }
    
    if (filterCodigo) {
      filtered = filtered.filter(p => 
        p.codigo_rsf.toLowerCase().includes(filterCodigo.toLowerCase()) ||
        p.articulo.toLowerCase().includes(filterCodigo.toLowerCase()) ||
        p.codigo_barra.toLowerCase().includes(filterCodigo.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
    
    // Actualizar paginación local
    const totalFiltered = filtered.length;
    const totalPagesFiltered = Math.ceil(totalFiltered / pageSize);
    setTotalItems(totalFiltered);
    setTotalPages(totalPagesFiltered);
    setCurrentPage(1);
    
    // Mostrar primera página de resultados filtrados
    setProducts(filtered.slice(0, pageSize));
  };

  const clearFilters = () => {
    setFilterMarca('');
    setFilterRubro('');
    setFilterOEM('');
    setFilterCodigo('');
    setFilteredProducts(allProducts);
    setProducts(allProducts.slice(0, pageSize));
    setTotalItems(allProducts.length);
    setTotalPages(Math.ceil(allProducts.length / pageSize));
    setCurrentPage(1);
  };

  const changePage = (newPage) => {
    const startIndex = (newPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setProducts(filteredProducts.slice(startIndex, endIndex));
    setCurrentPage(newPage);
  };

  const exportProductsToExcel = async () => {
    setLoadingExport(true);
    try {
      const response = await fetch('/api/rsf/products/export');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productos_rsf_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error exportando productos');
      }
    } catch (error) {
      console.error('Error exportando productos:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  const loadDiscounts = async () => {
    setLoadingDiscounts(true);
    try {
      const response = await fetch('/api/rsf/discounts');
      const data = await response.json();
      if (data.success) {
        setDiscounts(data.data);
      } else {
        alert('Error cargando descuentos: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando descuentos:', error);
      alert('Error de conexión al cargar descuentos');
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await fetch('/api/rsf/documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      } else {
        alert('Error cargando documentos: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
      alert('Error de conexión al cargar documentos');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch('/api/rsf/orders-history');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        alert('Error cargando órdenes: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      alert('Error de conexión al cargar órdenes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/rsf/status');
      const data = await response.json();
      
      setIsConnected(data.connected);
      setRazonSocial(data.razon_social || '');
      setTokenExpiry(data.token_expires_at);
      setTokenMinutesRemaining(data.minutes_remaining || 0);
      setIsTokenExpired(data.is_expired || false);
      
      if (data.connected) {
        setLastSync(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setIsConnected(false);
      setIsTokenExpired(true);
      setTokenMinutesRemaining(0);
    }
  };  

  useEffect(() => {
    checkConnectionStatus();
    
    // Actualizar estado del token cada minuto
    const interval = setInterval(() => {
      if (isConnected) {
        checkConnectionStatus();
      }
    }, 60000); // 60 segundos
    
    return () => clearInterval(interval);
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

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
        {/* Conexión y Autenticación */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Settings sx={{ mr: 1 }} />
                  <Typography variant="h6">Rural Santa Fe API</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    icon={isConnected ? <CheckCircle /> : <Error />}
                    label={isConnected ? 'Conectado' : 'Desconectado'}
                    color={isConnected ? 'success' : 'error'}
                    size="small"
                  />
                  {isConnected && (
                    <Chip
                      label={`${tokenMinutesRemaining} min restantes`}
                      color={tokenMinutesRemaining < 60 ? 'warning' : 'info'}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              
              <Grid container spacing={2} alignItems="end">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Cuenta RSF"
                    value={cuentaRSF}
                    onChange={(e) => setCuentaRSF(e.target.value)}
                    placeholder="Número de cuenta RSF"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña de acceso"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    onClick={handleConnect}
                    disabled={loading || !cuentaRSF || !password}
                    startIcon={<CloudSync />}
                    fullWidth
                  >
                    {loading ? 'Conectando...' : (isConnected ? 'Conectado' : 'Conectar')}
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  {isConnected && razonSocial && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      {razonSocial}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>


      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(event, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Api />} label="Endpoints" />
            <Tab icon={<Inventory />} label="Productos" />
            <Tab icon={<LocalOffer />} label="Descuentos" />
            <Tab icon={<Receipt />} label="Documentos" />
            <Tab icon={<ShoppingCart />} label="Órdenes" />
          </Tabs>
        </Box>

        <CardContent>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          {/* Tab 0: Endpoints */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Endpoints Disponibles
              </Typography>
              <Grid container spacing={2}>
                {endpoints.map((endpoint, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" component="div">
                            {endpoint.name}
                          </Typography>
                          <Chip 
                            label={endpoint.method} 
                            color={endpoint.method === 'GET' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {endpoint.path}
                        </Typography>
                        <Typography variant="body2">
                          {endpoint.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Tab 1: Products */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Productos ({products.length})
                </Typography>
              </Box>
              {/* Filtros */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Filtros de Búsqueda
                  </Typography>
                  <Grid container spacing={2} alignItems="end">
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Marca"
                        value={filterMarca}
                        onChange={(e) => setFilterMarca(e.target.value)}
                        placeholder="Ej: BOSCH, NGK, MANN"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Rubro"
                        value={filterRubro}
                        onChange={(e) => setFilterRubro(e.target.value)}
                        placeholder="Ej: FILTROS, FRENOS"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="OEM"
                        value={filterOEM}
                        onChange={(e) => setFilterOEM(e.target.value)}
                        placeholder="Código OEM"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Código"
                        value={filterCodigo}
                        onChange={(e) => setFilterCodigo(e.target.value)}
                        placeholder="Código RSF/Artículo"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={clearFilters}
                          size="small"
                        >
                          Limpiar
                        </Button>
                        <Button
                          variant="contained"
                          onClick={applyFilters}
                          size="small"
                        >
                          Filtrar
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  onClick={() => loadProducts(1)}
                  disabled={loadingProducts}
                  startIcon={loadingProducts ? <CircularProgress size={20} /> : <Refresh />}
                >
                  {loadingProducts ? 'Cargando...' : 'Cargar Productos'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={exportProductsToExcel}
                  disabled={loadingExport}
                  startIcon={loadingExport ? <CircularProgress size={20} /> : <GetApp />}
                  color="success"
                >
                  {loadingExport ? 'Exportando...' : 'Exportar Excel'}
                </Button>
              </Box>
              {loadingProducts && <LinearProgress sx={{ mb: 2 }} />}
              {products.length === 0 ? (
                <Alert severity="info">Haz clic en "Cargar Productos" para obtener la lista completa</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código RSF</TableCell>
                        <TableCell>Artículo</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Marca RSF</TableCell>
                        <TableCell>Marca Original</TableCell>
                        <TableCell>Precio Lista</TableCell>
                        <TableCell>Precio Neto</TableCell>
                        <TableCell>Stock</TableCell>
                        <TableCell>Rubro</TableCell>
                        <TableCell>Segmento</TableCell>
                        <TableCell>Módulo Venta</TableCell>
                        <TableCell>OEM</TableCell>
                        <TableCell>Código Barra</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.codigo_rsf}</TableCell>
                          <TableCell>{product.articulo}</TableCell>
                          <TableCell>{product.descripcion}</TableCell>
                          <TableCell>{product.marca_rsf}</TableCell>
                          <TableCell>{product.marca_original}</TableCell>
                          <TableCell>${product.precio_lista}</TableCell>
                          <TableCell>${product.precio_neto}</TableCell>
                          <TableCell>
                            <Chip 
                              label={product.stock_final === 1 ? 'Disponible' : product.stock_final === 2 ? 'Baja cantidad' : 'Sin stock'}
                              color={product.stock_final === 1 ? 'success' : product.stock_final === 2 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{product.rubro}</TableCell>
                          <TableCell>{product.segmento}</TableCell>
                          <TableCell>{product.modulo_venta}</TableCell>
                          <TableCell>{product.oem}</TableCell>
                          <TableCell>{product.codigo_barra}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Paginación */}
              {products.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
                  <Button 
                    disabled={currentPage === 1 || loadingProducts}
                    onClick={() => changePage(currentPage - 1)}
                    startIcon={<NavigateBefore />}
                  >
                    Anterior
                  </Button>
                  <Typography variant="body2">
                    Página {currentPage} de {totalPages} ({totalItems} productos)
                  </Typography>
                  <Button 
                    disabled={currentPage === totalPages || loadingProducts}
                    onClick={() => changePage(currentPage + 1)}
                    endIcon={<NavigateNext />}
                  >
                    Siguiente
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 2: Discounts */}
          {tabValue === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Descuentos por Marca ({discounts.length})
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={loadDiscounts}
                  disabled={loadingDiscounts || !isConnected}
                  startIcon={loadingDiscounts ? <CircularProgress size={20} /> : <Refresh />}
                >
                  {loadingDiscounts ? 'Cargando...' : 'Cargar Descuentos'}
                </Button>
              </Box>
              
              {loadingDiscounts && <LinearProgress sx={{ mb: 2 }} />}
              
              {discounts.length === 0 ? (
                <Alert severity="info">Haz clic en "Cargar Descuentos" para obtener la lista completa</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Marca RSF</TableCell>
                        <TableCell>Marca Original</TableCell>
                        <TableCell align="right">Descuento</TableCell>
                        <TableCell>Tipo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {discounts.map((discount, index) => (
                        <TableRow key={index}>
                          <TableCell>{discount.marca_rsf}</TableCell>
                          <TableCell>{discount.marca_original}</TableCell>
                          <TableCell align="right">{discount.descuento}%</TableCell>
                          <TableCell>
                            <Chip 
                              label={discount.tipo === 0 ? 'General' : 'Específico'} 
                              color={discount.tipo === 0 ? 'default' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Tab 3: Documents */}
          {tabValue === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Documentos Comerciales ({documents.length})
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={loadDocuments}
                  disabled={loadingDocuments || !isConnected}
                  startIcon={loadingDocuments ? <CircularProgress size={20} /> : <Refresh />}
                >
                  {loadingDocuments ? 'Actualizando...' : 'Actualizar Documentos'}
                </Button>
              </Box>
              
              {loadingDocuments && <LinearProgress sx={{ mb: 2 }} />}
              
              {documents.length === 0 ? (
                <Alert severity="info">Haz clic en "Actualizar Documentos" para obtener la lista completa</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Número</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="right">IVA</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Código Arca</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documents.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="caption" fontFamily="monospace">
                              {doc.numero}
                            </Typography>
                          </TableCell>
                          <TableCell>{doc.fecha ? new Date(doc.fecha).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={doc.tipo_descripcion || doc.tipo} 
                              color={doc.tipo === 'FC' ? 'success' : doc.tipo === 'NC' ? 'warning' : 'info'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">${doc.subtotal?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">${doc.iva?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ${doc.total?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={doc.saldo > 0 ? 'warning.main' : 'success.main'}
                            >
                              ${doc.saldo?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={doc.estado || 'Procesado'} 
                              color={doc.saldo > 0 ? 'warning' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {doc.codigo_arca || 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Tab 4: Orders */}
          {tabValue === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Órdenes ({orders.length})
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={loadOrders}
                  disabled={loadingOrders || !isConnected}
                  startIcon={loadingOrders ? <CircularProgress size={20} /> : <Refresh />}
                >
                  {loadingOrders ? 'Cargando...' : 'Cargar Órdenes'}
                </Button>
              </Box>
              
              {loadingOrders && <LinearProgress sx={{ mb: 2 }} />}
              
              {orders.length === 0 ? (
                <Alert severity="info">Haz clic en "Cargar Órdenes" para obtener el historial de órdenes</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Acciones</TableCell>
                        <TableCell>ID Orden</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Productos</TableCell>
                        <TableCell>Comentario</TableCell>
                        <TableCell>Tipo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order, index) => (
                        <React.Fragment key={index}>
                          <TableRow>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleOrderExpansion(order.id)}
                                color="primary"
                              >
                                {expandedOrders.has(order.id) ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" fontFamily="monospace">
                                {order.id}
                              </Typography>
                            </TableCell>
                            <TableCell>{new Date(order.fecha).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip 
                                label={order.estado} 
                                color={order.estado === 'Confirmado' ? 'success' : order.estado === 'Pendiente' ? 'warning' : order.estado === 'Entregado' ? 'info' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                ${order.total?.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`${order.productos_count} items`}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {order.comentario}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={order.test ? 'Test' : 'Real'}
                                color={order.test ? 'warning' : 'success'}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          {expandedOrders.has(order.id) && (
                            <TableRow>
                              <TableCell colSpan={8} sx={{ py: 0 }}>
                                <Box sx={{ margin: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Productos en la orden:
                                  </Typography>
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Código RSF</TableCell>
                                          <TableCell>Artículo</TableCell>
                                          <TableCell>Descripción</TableCell>
                                          <TableCell>Marca RSF</TableCell>
                                          <TableCell>Marca Original</TableCell>
                                          <TableCell align="right">Cantidad</TableCell>
                                          <TableCell align="right">Precio Unit.</TableCell>
                                          <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {order.productos?.map((producto, prodIndex) => (
                                          <TableRow key={prodIndex}>
                                            <TableCell>
                                              <Typography variant="caption" fontFamily="monospace">
                                                {producto.codigo_rsf}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography variant="body2" fontWeight="medium">
                                                {producto.articulo}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography variant="caption" color="text.secondary">
                                                {producto.descripcion}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Chip 
                                                label={producto.marca_rsf}
                                                size="small"
                                                variant="outlined"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Typography variant="caption">
                                                {producto.marca_original}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography variant="body2" fontWeight="medium">
                                                {producto.cantidad}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              ${producto.precio_unitario?.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography variant="body2" fontWeight="bold" color="primary">
                                                ${producto.subtotal?.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              <Alert severity="info" sx={{ mt: 3 }}>
                <strong>Órdenes RSF:</strong> Historial de pedidos enviados a Rural Santa Fe. 
                Incluye estado de confirmación y detalles de productos.
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RuralSantaFe;
