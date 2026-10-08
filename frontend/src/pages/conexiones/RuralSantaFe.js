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
  Collapse,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Visibility,
  Add
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
  const [expandedDocuments, setExpandedDocuments] = useState(new Set());
  const [documentDetails, setDocumentDetails] = useState({});
  
  // Estados para crear pedido
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [orderProducts, setOrderProducts] = useState([]);
  const [orderComment, setOrderComment] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  
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
      setLoadingOrders(false);
    }
  };

  const toggleOrderExpansion = (orderNumber) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderNumber)) {
      newExpanded.delete(orderNumber);
    } else {
      newExpanded.add(orderNumber);
    }
    setExpandedOrders(newExpanded);
  };

  // Funciones para crear pedido
  const addProductToOrder = () => {
    if (!selectedProduct || productQuantity <= 0) {
      alert('Selecciona un producto y cantidad válida');
      return;
    }

    const existingIndex = orderProducts.findIndex(p => p.codigo_rsf === selectedProduct.codigo_rsf);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updatedProducts = [...orderProducts];
      updatedProducts[existingIndex].cantidad += productQuantity;
      setOrderProducts(updatedProducts);
    } else {
      // Agregar nuevo producto
      setOrderProducts([...orderProducts, {
        codigo_rsf: selectedProduct.codigo_rsf,
        articulo: selectedProduct.articulo,
        marca_rsf: selectedProduct.marca_rsf,
        marca_original: selectedProduct.marca_original,
        fabrica: selectedProduct.fabrica,
        descripcion: selectedProduct.descripcion,
        cantidad: productQuantity,
        precio_neto: selectedProduct.precio_neto
      }]);
    }

    setSelectedProduct(null);
    setProductQuantity(1);
  };

  const removeProductFromOrder = (index) => {
    const updatedProducts = orderProducts.filter((_, i) => i !== index);
    setOrderProducts(updatedProducts);
  };

  const createOrder = async () => {
    if (orderProducts.length === 0) {
      alert('Agrega al menos un producto al pedido');
      return;
    }

    setCreatingOrder(true);
    try {
      const orderData = {
        test: true, // Siempre en modo TEST
        comentario: orderComment || 'Pedido creado desde Ventas Boxer',
        email: orderEmail || '',
        products: orderProducts.map(p => ({
          cantidad: p.cantidad,
          codigo_rsf: p.codigo_rsf,
          articulo: p.articulo,
          marca_rsf: p.marca_rsf,
          marca_original: p.marca_original,
          fabrica: p.fabrica
        }))
      };

      const response = await fetch('/api/rsf/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Pedido enviado exitosamente!\n\nTransacción: ${result.data.trasaccion}\nProductos confirmados: ${result.data.productosConfirmados?.length || 0}\nProductos sin confirmar: ${result.data.productosSinConfirmar?.length || 0}`);
        
        // Limpiar formulario
        setOrderProducts([]);
        setOrderComment('');
        setOrderEmail('');
        setShowCreateOrder(false);
        
        // Recargar órdenes
        loadOrders();
      } else {
        alert('Error enviando pedido: ' + result.message);
      }
    } catch (error) {
      console.error('Error enviando pedido:', error);
      alert('Error de conexión al enviar pedido');
    } finally {
      setCreatingOrder(false);
    }
  };

  const toggleDocumentExpansion = async (docNumber) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(docNumber)) {
      newExpanded.delete(docNumber);
    } else {
      newExpanded.add(docNumber);
      // Cargar detalles del documento si no los tenemos
      if (!documentDetails[docNumber]) {
        try {
          const response = await fetch(`/api/rsf/documents/${docNumber}`);
          const data = await response.json();
          if (data.success) {
            setDocumentDetails(prev => ({
              ...prev,
              [docNumber]: data.data
            }));
          }
        } catch (error) {
          console.error('Error cargando detalles del documento:', error);
        }
      }
    }
    setExpandedDocuments(newExpanded);
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
                        <TableCell>Acciones</TableCell>
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
                        <React.Fragment key={index}>
                          <TableRow>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleDocumentExpansion(doc.numero)}
                                color="primary"
                              >
                                {expandedDocuments.has(doc.numero) ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </TableCell>
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
                          {expandedDocuments.has(doc.numero) && (
                            <TableRow>
                              <TableCell colSpan={10} sx={{ py: 0 }}>
                                <Box sx={{ margin: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Detalles del Documento: {doc.numero}
                                  </Typography>
                                  
                                  {documentDetails[doc.numero] ? (
                                    <Box>
                                      {/* Información General */}
                                      <Card variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent>
                                          <Typography variant="h6" gutterBottom>
                                            Información General
                                          </Typography>
                                          <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                              <Typography variant="body2">
                                                <strong>Número:</strong> {documentDetails[doc.numero].numero}
                                              </Typography>
                                              <Typography variant="body2">
                                                <strong>Tipo:</strong> {documentDetails[doc.numero].tipo_descripcion || documentDetails[doc.numero].tipo}
                                              </Typography>
                                              <Typography variant="body2">
                                                <strong>Fecha:</strong> {documentDetails[doc.numero].fecha ? new Date(documentDetails[doc.numero].fecha).toLocaleDateString() : 'N/A'}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                              <Typography variant="body2">
                                                <strong>Código Arca:</strong> {documentDetails[doc.numero].codigo_arca || 'N/A'}
                                              </Typography>
                                              <Typography variant="body2">
                                                <strong>Estado:</strong> {documentDetails[doc.numero].estado || 'Procesado'}
                                              </Typography>
                                            </Grid>
                                          </Grid>
                                        </CardContent>
                                      </Card>

                                      {/* Totales */}
                                      <Card variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent>
                                          <Typography variant="h6" gutterBottom>
                                            Totales
                                          </Typography>
                                          <Grid container spacing={2}>
                                            <Grid item xs={6} md={3}>
                                              <Typography variant="body2">
                                                <strong>Subtotal:</strong> ${documentDetails[doc.numero].subtotal?.toFixed(2) || '0.00'}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                              <Typography variant="body2">
                                                <strong>IVA:</strong> ${documentDetails[doc.numero].iva?.toFixed(2) || '0.00'}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                              <Typography variant="body2">
                                                <strong>Total:</strong> ${documentDetails[doc.numero].total?.toFixed(2) || '0.00'}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                              <Typography variant="body2" color={documentDetails[doc.numero].saldo > 0 ? 'warning.main' : 'success.main'}>
                                                <strong>Saldo:</strong> ${documentDetails[doc.numero].saldo?.toFixed(2) || '0.00'}
                                              </Typography>
                                            </Grid>
                                          </Grid>
                                          {documentDetails[doc.numero].total_percepciones > 0 && (
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                              <strong>Total Percepciones:</strong> ${documentDetails[doc.numero].total_percepciones?.toFixed(2) || '0.00'}
                                            </Typography>
                                          )}
                                        </CardContent>
                                      </Card>

                                      {/* Detalles de Percepciones */}
                                      {documentDetails[doc.numero].percepcion_detalles && documentDetails[doc.numero].percepcion_detalles.length > 0 && (
                                        <Card variant="outlined" sx={{ mb: 2 }}>
                                          <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                              Percepciones
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                              <Table size="small">
                                                <TableHead>
                                                  <TableRow>
                                                    <TableCell>Tipo</TableCell>
                                                    <TableCell>Descripción</TableCell>
                                                    <TableCell align="right">Importe</TableCell>
                                                  </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                  {documentDetails[doc.numero].percepcion_detalles.map((percepcion, pIndex) => (
                                                    <TableRow key={pIndex}>
                                                      <TableCell>{percepcion.tipo}</TableCell>
                                                      <TableCell>{percepcion.descripcion}</TableCell>
                                                      <TableCell align="right">${percepcion.importe?.toFixed(2) || '0.00'}</TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </TableContainer>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {/* Detalles de Productos */}
                                      {documentDetails[doc.numero].producto_detalles && documentDetails[doc.numero].producto_detalles.length > 0 && (
                                        <Card variant="outlined">
                                          <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                              Productos
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                              <Table size="small">
                                                <TableHead>
                                                  <TableRow>
                                                    <TableCell>Código</TableCell>
                                                    <TableCell>Descripción</TableCell>
                                                    <TableCell>Marca</TableCell>
                                                    <TableCell align="right">Cantidad</TableCell>
                                                    <TableCell align="right">Precio Unit.</TableCell>
                                                    <TableCell align="right">Subtotal</TableCell>
                                                  </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                  {documentDetails[doc.numero].producto_detalles.map((producto, prodIndex) => (
                                                    <TableRow key={prodIndex}>
                                                      <TableCell>
                                                        <Typography variant="caption" fontFamily="monospace">
                                                          {producto.codigo}
                                                        </Typography>
                                                      </TableCell>
                                                      <TableCell>{producto.descripcion}</TableCell>
                                                      <TableCell>
                                                        <Chip 
                                                          label={producto.marca}
                                                          size="small"
                                                          variant="outlined"
                                                        />
                                                      </TableCell>
                                                      <TableCell align="right">{producto.cantidad}</TableCell>
                                                      <TableCell align="right">${producto.precio_unitario?.toFixed(2) || '0.00'}</TableCell>
                                                      <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                                          ${producto.subtotal?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </TableContainer>
                                          </CardContent>
                                        </Card>
                                      )}
                                    </Box>
                                  ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                      <CircularProgress size={24} />
                                      <Typography variant="body2" sx={{ ml: 2 }}>
                                        Cargando detalles del documento...
                                      </Typography>
                                    </Box>
                                  )}
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
            </Box>
          )}

          {/* Tab 4: Orders */}
          {tabValue === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Órdenes ({orders.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined"
                    onClick={() => setShowCreateOrder(true)}
                    disabled={!isConnected}
                    startIcon={<Add />}
                    color="success"
                  >
                    Crear Pedido
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={loadOrders}
                    disabled={loadingOrders || !isConnected}
                    startIcon={loadingOrders ? <CircularProgress size={20} /> : <Refresh />}
                  >
                    {loadingOrders ? 'Cargando...' : 'Cargar Órdenes'}
                  </Button>
                </Box>
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

      {/* Dialog para crear pedido */}
      <Dialog 
        open={showCreateOrder} 
        onClose={() => setShowCreateOrder(false)} 
        maxWidth="md" 
        fullWidth
        onEntering={() => {
          // Cargar productos si no están cargados cuando se abre el diálogo
          if (allProducts.length === 0 && isConnected) {
            loadProducts(1);
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart />
            <Typography variant="h6">Crear Nuevo Pedido (Modo TEST)</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Información del pedido */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Comentario (opcional)"
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  placeholder="Comentario sobre el pedido"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email (opcional)"
                  value={orderEmail}
                  onChange={(e) => setOrderEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  type="email"
                />
              </Grid>
            </Grid>

            {/* Selector de productos */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Agregar Productos 
                {allProducts.length > 0 && (
                  <Chip 
                    label={`${allProducts.length} productos disponibles`} 
                    size="small" 
                    color="info" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
              
              {allProducts.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No hay productos cargados. Ve a la pestaña "Productos" y haz clic en "Cargar Productos" primero.
                </Alert>
              ) : (
                <Grid container spacing={2} alignItems="end">
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={allProducts}
                      getOptionLabel={(option) => `${option.codigo_rsf} - ${option.descripcion} (${option.marca_rsf})`}
                      value={selectedProduct}
                      onChange={(event, newValue) => setSelectedProduct(newValue)}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Buscar producto" 
                          placeholder="Busca por código, descripción o marca"
                          helperText={`${allProducts.length} productos disponibles para búsqueda`}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {option.codigo_rsf} - {option.articulo}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.descripcion} | {option.marca_rsf} | Stock: {option.stock_status}
                            </Typography>
                            <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                              ${option.precio_neto?.toLocaleString('es-AR')}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option =>
                          option.codigo_rsf.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.descripcion.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.marca_rsf.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.articulo.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      noOptionsText="No se encontraron productos. Prueba con otros términos de búsqueda."
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={addProductToOrder}
                    disabled={!selectedProduct}
                    startIcon={<Add />}
                  >
                    Agregar
                  </Button>
                </Grid>
              </Grid>
              )}
            </Box>

            {/* Lista de productos en el pedido */}
            {orderProducts.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Productos en el Pedido ({orderProducts.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código RSF</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Marca</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {product.codigo_rsf}
                            </Typography>
                          </TableCell>
                          <TableCell>{product.descripcion}</TableCell>
                          <TableCell>{product.marca_rsf}</TableCell>
                          <TableCell align="center">
                            <Chip label={product.cantidad} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            ${product.precio_neto?.toLocaleString('es-AR') || '0'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ${((product.precio_neto || 0) * product.cantidad).toLocaleString('es-AR')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeProductFromOrder(index)}
                            >
                              <Error />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="h6">
                    Total: ${orderProducts.reduce((sum, p) => sum + ((p.precio_neto || 0) * p.cantidad), 0).toLocaleString('es-AR')}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateOrder(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={createOrder}
            disabled={creatingOrder || orderProducts.length === 0}
            startIcon={creatingOrder ? <CircularProgress size={20} /> : <ShoppingCart />}
          >
            {creatingOrder ? 'Enviando...' : 'Enviar Pedido (TEST)'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuralSantaFe;
