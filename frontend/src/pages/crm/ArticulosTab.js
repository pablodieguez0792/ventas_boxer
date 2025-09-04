import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, IconButton,
  ToggleButton, ToggleButtonGroup, Paper, TextField, InputAdornment,
  Autocomplete, Avatar, List, ListItem, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, ButtonGroup, Switch, FormControlLabel,
  MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, Fab
} from '@mui/material';
import {
  Add, ViewList, ViewModule, Search, Inventory, LocationOn, LocalOffer,
  Delete, Remove, ShoppingCart, Person, Percent, AttachMoney,
  AccountBalanceWallet, Save, Receipt, Payment, Clear, Close,
  CheckCircle, Circle, Cancel, ShoppingBag
} from '@mui/icons-material';

// Componente unificado de Artículos (copia exacta del Sistema de Ventas)
const ArticulosTab = ({ clientes }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [stockView, setStockView] = useState('mio'); // 'mio' | 'proveedor'
  const searchTimeoutRef = useRef(null);

  // Productos de muestra completos (simulando la base de datos real)
  const [productos] = useState([
    { id: 1, nombre: 'Filtro de aceite', codigo: 'FO-001', precio: 2500, stock: 25, categoria: 'Filtros', descripcion: 'Filtro de aceite universal', imagen: null, ubicacion: 'A1-B2' },
    { id: 2, nombre: 'Aceite 5W30', codigo: 'AC-002', precio: 3200, stock: 5, categoria: 'Lubricantes', descripcion: 'Aceite sintético 5W30', imagen: null, ubicacion: 'B3-C1' },
    { id: 3, nombre: 'Pastillas de freno', codigo: 'PF-003', precio: 8500, stock: 0, categoria: 'Frenos', descripcion: 'Pastillas de freno delanteras', imagen: null, ubicacion: 'C2-D1' },
    { id: 4, nombre: 'Filtro de aire', codigo: 'FA-004', precio: 1800, stock: 12, categoria: 'Filtros', descripcion: 'Filtro de aire motor', imagen: null, ubicacion: 'A2-B1' },
    { id: 5, nombre: 'Bujías', codigo: 'BU-005', precio: 1200, stock: 30, categoria: 'Encendido', descripcion: 'Bujías de encendido', imagen: null, ubicacion: 'D1-E2' },
    { id: 6, nombre: 'Correa de distribución', codigo: 'CD-006', precio: 4500, stock: 8, categoria: 'Motor', descripcion: 'Correa de distribución', imagen: null, ubicacion: 'E1-F2' },
    { id: 7, nombre: 'Amortiguadores', codigo: 'AM-007', precio: 12000, stock: 15, categoria: 'Suspensión', descripcion: 'Amortiguadores delanteros', imagen: null, ubicacion: 'F2-G1' },
    { id: 8, nombre: 'Batería 12V', codigo: 'BA-008', precio: 18000, stock: 6, categoria: 'Eléctrico', descripcion: 'Batería 12V 60Ah', imagen: null, ubicacion: 'G1-H2' }
  ]);

  // Catálogo extendido del proveedor (simulado)
  const [proveedorProductos] = useState(() => {
    const base = [...productos];
    // simular catálogo grande agregando variantes
    return base.concat(
      Array.from({ length: 12 }, (_, i) => ({
        id: 100 + i,
        nombre: `Artículo Proveedor ${i + 1}`,
        codigo: `PR-${(i + 1).toString().padStart(3, '0')}`,
        precio: 1000 + i * 250,
        stock: 50,
        categoria: i % 2 ? 'Motor' : 'Eléctrico',
        descripcion: 'Producto del catálogo del proveedor',
        imagen: null,
        ubicacion: '-'
      }))
    );
  });

  const handleSearch = (query = searchQuery) => {
    const searchTerm = typeof query === 'string' ? query : searchQuery;
    
    if (!searchTerm || !searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    
    // Fuente según vista
    const source = stockView === 'mio' ? productos : proveedorProductos;
    // Simular búsqueda en productos
    const results = source.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setTimeout(() => {
      setSearchResults(results);
      setIsLoading(false);
    }, 300);
  };

  const handleSearchInputChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const addToCart = (producto) => {
    const existingItem = cartItems.find(item => item.id === producto.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...producto, cantidad: 1 }]);
    }
  };

  const updateCartItem = (id, cantidad) => {
    if (cantidad <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, cantidad } : item
    ));
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscountType('none');
    setDiscountValue(0);
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'error.main';
    if (stock <= 10) return 'warning.main';
    return 'success.main';
  };

  const getStockIcon = (stock) => {
    if (stock === 0) return <Cancel sx={{ color: 'red' }} />;
    if (stock <= 10) return <Circle sx={{ color: 'orange' }} />;
    return <CheckCircle sx={{ color: 'green' }} />;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue / 100) 
    : discountType === 'fixed' ? discountValue : 0;
  const taxAmount = (subtotal - discountAmount) * 0.21; // IVA 21%
  const total = subtotal - discountAmount + taxAmount;

  // Inicializar con algunos productos mostrados
  useEffect(() => {
    setSearchResults((stockView === 'mio' ? productos : proveedorProductos).slice(0, 12));
  }, [stockView, productos, proveedorProductos]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', pt: 0 }}>
      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 1, 
        mr: cartOpen ? '450px' : '60px',
        transition: 'margin-right 0.3s ease'
      }}>
        {/* Search and Controls */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar por nombre, código o categoría..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleSearch()}
                disabled={isLoading}
                sx={{ height: 56 }}
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </Grid>
            <Grid item xs={6} md={2}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                fullWidth
              >
                <ToggleButton value="cards" aria-label="cards view">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={stockView === 'proveedor'}
                    onChange={(e) => setStockView(e.target.checked ? 'proveedor' : 'mio')}
                    color="primary"
                  />
                }
                label={stockView === 'mio' ? 'Mi Stock' : 'Stock Proveedor'}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Results */}
        <Box sx={{ minHeight: '60vh' }}>
          {searchResults.length === 0 && !isLoading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {searchQuery ? 'No se encontraron productos' : 'Ingresa un término de búsqueda'}
              </Typography>
            </Paper>
          )}

          {viewMode === 'cards' ? (
            <Grid container spacing={2}>
              {searchResults.map((producto) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={producto.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1rem' }}>
                          {producto.nombre}
                        </Typography>
                        {getStockIcon(producto.stock)}
                      </Box>

                      {/* Imagen del producto */}
                      <Box sx={{
                        width: '100%',
                        height: 140,
                        bgcolor: '#fafafa',
                        borderRadius: 1,
                        mb: 1,
                        backgroundImage: producto.imagen ? `url(${producto.imagen})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #eee'
                      }}>
                        {!producto.imagen && (
                          <Typography variant="caption" color="text.secondary">Sin imagen</Typography>
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Código: {producto.codigo}
                      </Typography>
                      
                      <Chip 
                        label={producto.categoria} 
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                      
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={getStockColor(producto.stock)}
                        gutterBottom
                      >
                        Stock: {producto.stock}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {producto.ubicacion}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        ${producto.precio.toLocaleString()}
                      </Typography>
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0 }}>
                      {producto.stock > 0 ? (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => addToCart(producto)}
                        >
                          Agregar
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="outlined"
                          color="warning"
                          startIcon={<ShoppingBag />}
                        >
                          Pedir al Local
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((producto) => (
                    <TableRow key={producto.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={producto.imagen || undefined}
                            variant="rounded"
                            sx={{ width: 40, height: 40 }}
                          >
                            {!producto.imagen && producto.nombre?.[0]}
                          </Avatar>
                          {getStockIcon(producto.stock)}
                          <Typography variant="subtitle2">{producto.nombre}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{producto.codigo}</TableCell>
                      <TableCell>
                        <Chip label={producto.categoria} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          fontWeight="bold"
                          color={getStockColor(producto.stock)}
                        >
                          {producto.stock}
                        </Typography>
                      </TableCell>
                      <TableCell>{producto.ubicacion}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                          ${producto.precio.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {producto.stock > 0 ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => addToCart(producto)}
                          >
                            Agregar
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            startIcon={<ShoppingBag />}
                          >
                            Pedir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Cart Toggle Button */}
      {!cartOpen && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1300,
          }}
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart />
          {cartItems.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                borderRadius: '50%',
                width: 20,
                height: 20,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {cartItems.length}
            </Box>
          )}
        </Fab>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: 450,
            height: '100vh',
            overflowY: 'auto',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCart />
              Carrito ({cartItems.length})
            </Typography>
            <IconButton onClick={() => setCartOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          {/* Customer Selection */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={selectedCustomer?.id || ''}
                label="Cliente"
                onChange={(e) => {
                  const cliente = clientes.find(c => c.id === e.target.value);
                  setSelectedCustomer(cliente);
                }}
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    <Box>
                      <Typography variant="subtitle2">{cliente.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">{cliente.telefono}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Cart Items */}
          <Box sx={{ flexGrow: 1, p: 2 }}>
            {cartItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                El carrito está vacío
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {cartItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ flexGrow: 1, pr: 1 }}>
                            {item.nombre}
                          </Typography>
                          <IconButton size="small" onClick={() => removeFromCart(item.id)} color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          ${item.precio.toLocaleString()} c/u
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <ButtonGroup size="small">
                            <Button onClick={() => updateCartItem(item.id, item.cantidad - 1)}>
                              <Remove fontSize="small" />
                            </Button>
                            <Button disabled>
                              {item.cantidad}
                            </Button>
                            <Button onClick={() => updateCartItem(item.id, item.cantidad + 1)}>
                              <Add fontSize="small" />
                            </Button>
                          </ButtonGroup>
                          
                          <Typography variant="subtitle1" fontWeight="bold">
                            ${(item.precio * item.cantidad).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < cartItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          {/* Summary and Actions */}
          {cartItems.length > 0 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              {/* Discount Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Descuento</Typography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <MenuItem value="none">Sin descuento</MenuItem>
                        <MenuItem value="percentage">Porcentaje</MenuItem>
                        <MenuItem value="fixed">Monto fijo</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      disabled={discountType === 'none'}
                      InputProps={{
                        startAdornment: discountType === 'percentage' ? <Percent fontSize="small" /> : <AttachMoney fontSize="small" />
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Totals */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">${subtotal.toLocaleString()}</Typography>
                </Box>
                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="success.main">Descuento:</Typography>
                    <Typography variant="body2" color="success.main">-${discountAmount.toLocaleString()}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">IVA (21%):</Typography>
                  <Typography variant="body2">${taxAmount.toLocaleString()}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight="bold">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    ${total.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearCart}
                    startIcon={<Clear />}
                  >
                    Limpiar
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!selectedCustomer}
                    startIcon={<Receipt />}
                  >
                    Presupuesto
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ArticulosTab;
