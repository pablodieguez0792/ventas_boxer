import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Chip,
  TextField,
  Grid,
  Autocomplete,
  IconButton,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Payment,
  Refresh,
  CheckCircle,
  Add,
  Person,
  Receipt,
  CreditCard,
  AccountBalance,
  Visibility,
  Note,
  Undo,
  SwapHoriz,
} from '@mui/icons-material';
import { apiService } from '../utils/api';

const Caja = () => {
  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnType, setReturnType] = useState('refund');
  const [originalSaleItems, setOriginalSaleItems] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  const [exchangeItems, setExchangeItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [returnNotes, setReturnNotes] = useState('');
  const [manualReturnItem, setManualReturnItem] = useState({ name: '', code: '', price: '' });
  const [manualExchangeItem, setManualExchangeItem] = useState({ name: '', code: '', price: '' });

  useEffect(() => {
    loadPendingSales();
  }, []);

  const loadPendingSales = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPendingSales();
      setPendingSales(data);
    } catch (error) {
      console.error('Error loading pending sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSale = async () => {
    if (!selectedSale || !paymentMethod) return;

    try {
      // TODO: Implement API call to invoice the sale
      console.log('Invoicing sale:', selectedSale.id, 'with payment method:', paymentMethod);
      
      // Remove from pending list
      setPendingSales(pendingSales.filter(sale => sale.id !== selectedSale.id));
      
      // Close modal and reset state
      setInvoiceOpen(false);
      setSelectedSale(null);
      setPaymentMethod('');
      
      alert('Venta facturada exitosamente');
    } catch (error) {
      console.error('Error invoicing sale:', error);
      alert('Error al facturar la venta');
    }
  };

  // Return/Exchange functions
  const handleOpenReturn = async () => {
    setReturnOpen(true);
    setReturnItems([]);
    setExchangeItems([]);
    setSearchResults([]);
    setSearchQuery('');
    setReturnNotes('');
    setReturnType('refund');
    setManualReturnItem({ name: '', code: '', price: '' });
    setManualExchangeItem({ name: '', code: '', price: '' });
  };

  const loadSaleItems = async (saleId) => {
    try {
      const saleData = await apiService.getSaleItems(saleId);
      setOriginalSaleItems(saleData.items || []);
      return saleData;
    } catch (error) {
      console.error('Error loading sale items:', error);
      alert('Error al cargar los artículos de la venta');
      return null;
    }
  };

  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiService.searchProducts(query, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const addToReturnItems = (item) => {
    const existingIndex = returnItems.findIndex(ri => ri.product_id === item.product_id);
    if (existingIndex >= 0) {
      const updated = [...returnItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setReturnItems(updated);
    } else {
      setReturnItems([...returnItems, {
        ...item,
        quantity: 1,
        subtotal: item.unit_price,
        reason: ''
      }]);
    }
  };

  const addToExchangeItems = (product) => {
    const existingIndex = exchangeItems.findIndex(ei => ei.product_id === product.id);
    if (existingIndex >= 0) {
      const updated = [...exchangeItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setExchangeItems(updated);
    } else {
      setExchangeItems([...exchangeItems, {
        product_id: product.id,
        product_name: product.name,
        product_code: product.internal_code,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price
      }]);
    }
  };

  const addManualReturnItem = () => {
    if (!manualReturnItem.name || !manualReturnItem.price) {
      alert('Debe completar nombre y precio del artículo');
      return;
    }
    
    const price = parseFloat(manualReturnItem.price);
    if (isNaN(price) || price <= 0) {
      alert('El precio debe ser un número válido mayor a 0');
      return;
    }

    setReturnItems([...returnItems, {
      product_id: `manual_${Date.now()}`, // ID único para artículos manuales
      product_name: manualReturnItem.name,
      product_code: manualReturnItem.code || 'MANUAL',
      quantity: 1,
      unit_price: price,
      subtotal: price,
      reason: '',
      is_manual: true
    }]);

    // Reset manual form
    setManualReturnItem({ name: '', code: '', price: '' });
  };

  const addManualExchangeItem = () => {
    if (!manualExchangeItem.name || !manualExchangeItem.price) {
      alert('Debe completar nombre y precio del artículo');
      return;
    }
    
    const price = parseFloat(manualExchangeItem.price);
    if (isNaN(price) || price <= 0) {
      alert('El precio debe ser un número válido mayor a 0');
      return;
    }

    setExchangeItems([...exchangeItems, {
      product_id: `manual_${Date.now()}`, // ID único para artículos manuales
      product_name: manualExchangeItem.name,
      product_code: manualExchangeItem.code || 'MANUAL',
      quantity: 1,
      unit_price: price,
      subtotal: price,
      is_manual: true
    }]);

    // Reset manual form
    setManualExchangeItem({ name: '', code: '', price: '' });
  };

  const updateReturnItemQuantity = (index, quantity) => {
    const updated = [...returnItems];
    if (quantity <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = quantity;
      updated[index].subtotal = quantity * updated[index].unit_price;
    }
    setReturnItems(updated);
  };

  const updateExchangeItemQuantity = (index, quantity) => {
    const updated = [...exchangeItems];
    if (quantity <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = quantity;
      updated[index].subtotal = quantity * updated[index].unit_price;
    }
    setExchangeItems(updated);
  };

  const calculateReturnTotals = () => {
    const totalRefund = returnItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalExchange = exchangeItems.reduce((sum, item) => sum + item.subtotal, 0);
    const difference = totalExchange - totalRefund;
    return { totalRefund, totalExchange, difference };
  };

  const handleProcessReturn = async () => {
    if (returnItems.length === 0 && exchangeItems.length === 0) {
      alert('Debe agregar al menos un artículo para devolver o cambiar');
      return;
    }

    try {
      const { totalRefund, totalExchange, difference } = calculateReturnTotals();
      
      const returnData = {
        return_type: returnType,
        customer_name: 'Cliente de devolución',
        return_items: returnItems,
        exchange_items: exchangeItems,
        notes: returnNotes,
        processed_by: 'ADMIN'
      };

      const result = await apiService.createReturn(returnData);
      
      alert(`Devolución procesada exitosamente.\nID: ${result.id}\nDiferencia: $${difference.toLocaleString()}`);
      
      // Reset and close
      setReturnOpen(false);
      setReturnItems([]);
      setExchangeItems([]);
      setReturnNotes('');
      setManualReturnItem({ name: '', code: '', price: '' });
      setManualExchangeItem({ name: '', code: '', price: '' });
      setSearchQuery('');
      setSearchResults([]);
      
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Error al procesar la devolución');
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'reference',
      headerName: 'Referencia',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.row.reference || 'Sin referencia'}
        </Typography>
      ),
    },
    {
      field: 'customer_name',
      headerName: 'Cliente',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.customer_name || params.row.seller || 'Cliente no especificado'}
        </Typography>
      ),
    },
    {
      field: 'seller',
      headerName: 'Vendedor',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {params.row.actual_seller || 'ADMIN'}
        </Typography>
      ),
    },
    {
      field: 'comments',
      headerName: 'Nota',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {params.value ? (
            <Chip
              icon={<Note />}
              label="Sí"
              size="small"
              color="info"
              variant="outlined"
              onClick={() => {
                alert(`Nota: "${params.value}"`); // Simple alert for now
              }}
              sx={{ cursor: 'pointer' }}
            />
          ) : (
            <Chip
              label="No"
              size="small"
              color="default"
              variant="outlined"
            />
          )}
        </Box>
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          ${params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedSale(params.row);
              setDetailOpen(true);
            }}
            title="Ver detalle"
          >
            <Visibility />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedSale(params.row);
              setInvoiceOpen(true);
            }}
            title="Facturar"
            color="primary"
          >
            <Payment />
          </IconButton>
        </Box>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Hora',
      width: 120,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Typography variant="body2">
            {date.toLocaleTimeString()}
          </Typography>
        );
      },
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          💰 Caja - Ventas Pendientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Undo />}
            onClick={handleOpenReturn}
            sx={{ fontWeight: 'bold' }}
          >
            DEVOLUCIÓN
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPendingSales}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {pendingSales.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No hay ventas pendientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Todas las ventas han sido procesadas o no hay ventas enviadas a caja.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Ventas Pendientes de Facturación
            </Typography>
            <Chip
              label={`${pendingSales.length} ventas pendientes`}
              color="warning"
              variant="outlined"
            />
          </Box>
          
          <DataGrid
            rows={pendingSales}
            columns={columns}
            autoHeight
            loading={loading}
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
              },
            }}
          />
        </Paper>
      )}

      {/* Invoice Modal */}
      <Dialog open={invoiceOpen} onClose={() => setInvoiceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Facturar Venta</DialogTitle>
        <DialogContent>
          {selectedSale && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Venta #{selectedSale.id}</Typography>
                <Typography variant="body2">
                  Referencia: {selectedSale.reference || 'Sin referencia'}
                </Typography>
                <Typography variant="body2">
                  Cliente: {selectedSale.customer_name}
                </Typography>
                <Typography variant="body2">
                  Vendedor: {selectedSale.seller}
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Forma de Pago</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Forma de Pago"
                  required
                >
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                  <MenuItem value="tarjeta_debito">Tarjeta de Débito</MenuItem>
                  <MenuItem value="tarjeta_credito">Tarjeta de Crédito</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="cuenta_corriente">Cuenta Corriente</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="h5" sx={{ mt: 3, textAlign: 'center' }} color="primary">
                Total a Facturar: ${selectedSale.total.toLocaleString()}
              </Typography>

              <Alert severity="warning" sx={{ mt: 2 }}>
                Esta acción generará la factura fiscal y descontará el stock automáticamente.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleInvoiceSale} 
            variant="contained"
            color="success"
            disabled={!paymentMethod}
            startIcon={<Payment />}
          >
            Facturar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility />
            Detalle de Venta #{selectedSale?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box>
              {/* Información General */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📋 Información General
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">ID de Venta:</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedSale.id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Referencia:</Typography>
                    <Typography variant="body1">{selectedSale.reference || 'Sin referencia'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Cliente:</Typography>
                    <Typography variant="body1">{selectedSale.customer_name || selectedSale.seller || 'Cliente no especificado'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Vendedor:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">{selectedSale.actual_seller || 'ADMIN'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Fecha y Hora:</Typography>
                    <Typography variant="body1">{new Date(selectedSale.created_at).toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Estado:</Typography>
                    <Chip label={selectedSale.status || 'Pendiente'} color="warning" size="small" />
                  </Box>
                </Box>
              </Paper>

              {/* Nota */}
              {selectedSale.comments && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Note /> Nota del Pedido
                  </Typography>
                  <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    "{selectedSale.comments}"
                  </Typography>
                </Paper>
              )}

              {/* Artículos */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  🛒 Artículos del Pedido
                </Typography>
                {selectedSale.sale_items && selectedSale.sale_items.length > 0 ? (
                  <List>
                    {selectedSale.sale_items.map((item, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="bold">
                                  {item.product?.name || `Producto ID: ${item.product_id}`}
                                </Typography>
                                <Typography variant="h6" color="primary">
                                  ${(item.quantity * item.unit_price).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Cantidad: {item.quantity} × ${item.unit_price.toLocaleString()} c/u
                                </Typography>
                                {item.product?.brand && (
                                  <Typography variant="caption" color="text.secondary">
                                    Marca: {item.product.brand} | Código: {item.product.internal_code}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < selectedSale.sale_items.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay información detallada de artículos disponible
                  </Typography>
                )}
              </Paper>

              {/* Totales */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  💰 Resumen de Totales
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">${selectedSale.subtotal?.toLocaleString() || '0'}</Typography>
                  
                  <Typography variant="body1">Descuento:</Typography>
                  <Typography variant="body1" color="error">-${selectedSale.discount_amount?.toLocaleString() || '0'}</Typography>
                  
                  <Typography variant="body1">Impuestos:</Typography>
                  <Typography variant="body1">${selectedSale.tax_amount?.toLocaleString() || '0'}</Typography>
                  
                  <Divider sx={{ gridColumn: '1 / -1', my: 1 }} />
                  
                  <Typography variant="h6" fontWeight="bold">TOTAL:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${selectedSale.total?.toLocaleString() || '0'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
          <Button 
            onClick={() => {
              setDetailOpen(false);
              setInvoiceOpen(true);
            }}
            variant="contained"
            color="primary"
            startIcon={<Payment />}
          >
            Facturar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DEVOLUCION Modal */}
      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Undo color="warning" />
            <Typography variant="h6" fontWeight="bold">
              DEVOLUCIÓN / CAMBIO
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Return Type Selection */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Tipo de Devolución</FormLabel>
                <RadioGroup
                  row
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                >
                  <FormControlLabel value="refund" control={<Radio />} label="Solo Devolución (Dinero)" />
                  <FormControlLabel value="exchange" control={<Radio />} label="Cambio por Productos" />
                  <FormControlLabel value="mixed" control={<Radio />} label="Mixto (Devolución + Cambio)" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Product Search */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🔍 Buscar Productos en Base de Datos
              </Typography>
              <TextField
                fullWidth
                label="Buscar productos para devolver o cambiar"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchProducts(e.target.value);
                }}
                placeholder="Buscar por nombre, código, marca..."
              />
            </Grid>

            {/* Manual Entry Sections */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                ✏️ Agregar Artículos Manualmente
              </Typography>
              <Grid container spacing={2}>
                {/* Manual Return Item */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                    <Typography variant="subtitle1" color="error" gutterBottom fontWeight="bold">
                      📥 ARTÍCULO QUE INGRESA (Devolución)
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Nombre del artículo"
                          value={manualReturnItem.name}
                          onChange={(e) => setManualReturnItem({...manualReturnItem, name: e.target.value})}
                          placeholder="Ej: Filtro de aceite genérico"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Código (opcional)"
                          value={manualReturnItem.code}
                          onChange={(e) => setManualReturnItem({...manualReturnItem, code: e.target.value})}
                          placeholder="Ej: FLT001"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label="Precio"
                          value={manualReturnItem.price}
                          onChange={(e) => setManualReturnItem({...manualReturnItem, price: e.target.value})}
                          placeholder="0.00"
                          InputProps={{ startAdornment: '$' }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="error"
                          onClick={addManualReturnItem}
                          disabled={!manualReturnItem.name || !manualReturnItem.price}
                          startIcon={<Add />}
                        >
                          Agregar a Devolución
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Manual Exchange Item */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="bold">
                      📤 ARTÍCULO QUE EGRESA (Cambio)
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Nombre del artículo"
                          value={manualExchangeItem.name}
                          onChange={(e) => setManualExchangeItem({...manualExchangeItem, name: e.target.value})}
                          placeholder="Ej: Filtro de aceite premium"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Código (opcional)"
                          value={manualExchangeItem.code}
                          onChange={(e) => setManualExchangeItem({...manualExchangeItem, code: e.target.value})}
                          placeholder="Ej: FLT002"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label="Precio"
                          value={manualExchangeItem.price}
                          onChange={(e) => setManualExchangeItem({...manualExchangeItem, price: e.target.value})}
                          placeholder="0.00"
                          InputProps={{ startAdornment: '$' }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={addManualExchangeItem}
                          disabled={!manualExchangeItem.name || !manualExchangeItem.price}
                          startIcon={<Add />}
                        >
                          Agregar a Cambio
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Resultados de Búsqueda</Typography>
                <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                  <List dense>
                    {searchResults.map((product) => (
                      <ListItem
                        key={product.id}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => addToReturnItems({
                                product_id: product.id,
                                product_name: product.name,
                                product_code: product.internal_code,
                                unit_price: product.price
                              })}
                            >
                              Devolver
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => addToExchangeItems(product)}
                            >
                              Cambiar por
                            </Button>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={`${product.name} (${product.internal_code})`}
                          secondary={`$${product.price.toLocaleString()} - Stock: ${product.stock}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}

            {/* Return Items */}
            {returnItems.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="error" gutterBottom>
                  Artículos a Devolver
                </Typography>
                <Paper sx={{ p: 2 }}>
                  {returnItems.map((item, index) => (
                    <Box key={index} sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1, bgcolor: item.is_manual ? 'error.50' : 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {item.product_name} ({item.product_code})
                        </Typography>
                        {item.is_manual && (
                          <Chip size="small" label="MANUAL" color="error" variant="outlined" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Cantidad"
                          value={item.quantity}
                          onChange={(e) => updateReturnItemQuantity(index, parseInt(e.target.value) || 0)}
                          sx={{ width: 80 }}
                        />
                        <Typography variant="body2">
                          × ${item.unit_price.toLocaleString()} = ${item.subtotal.toLocaleString()}
                        </Typography>
                      </Box>
                      <TextField
                        size="small"
                        fullWidth
                        label="Motivo de devolución"
                        value={item.reason || ''}
                        onChange={(e) => {
                          const updated = [...returnItems];
                          updated[index].reason = e.target.value;
                          setReturnItems(updated);
                        }}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ))}
                </Paper>
              </Grid>
            )}

            {/* Exchange Items */}
            {exchangeItems.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Artículos de Cambio
                </Typography>
                <Paper sx={{ p: 2 }}>
                  {exchangeItems.map((item, index) => (
                    <Box key={index} sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1, bgcolor: item.is_manual ? 'primary.50' : 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {item.product_name} ({item.product_code})
                        </Typography>
                        {item.is_manual && (
                          <Chip size="small" label="MANUAL" color="primary" variant="outlined" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Cantidad"
                          value={item.quantity}
                          onChange={(e) => updateExchangeItemQuantity(index, parseInt(e.target.value) || 0)}
                          sx={{ width: 80 }}
                        />
                        <Typography variant="body2">
                          × ${item.unit_price.toLocaleString()} = ${item.subtotal.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            )}

            {/* Totals and Notes */}
            {(returnItems.length > 0 || exchangeItems.length > 0) && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notas adicionales"
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Observaciones sobre la devolución..."
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>Resumen</Typography>
                        <Typography color="error">
                          Total Devolución: ${calculateReturnTotals().totalRefund.toLocaleString()}
                        </Typography>
                        <Typography color="primary">
                          Total Cambio: ${calculateReturnTotals().totalExchange.toLocaleString()}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="h6" color={calculateReturnTotals().difference >= 0 ? 'success.main' : 'error.main'}>
                          Diferencia: ${calculateReturnTotals().difference.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {calculateReturnTotals().difference > 0 
                            ? 'Cliente debe pagar' 
                            : calculateReturnTotals().difference < 0 
                            ? 'Devolver al cliente' 
                            : 'Sin diferencia'
                          }
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleProcessReturn}
            variant="contained"
            color="warning"
            startIcon={<SwapHoriz />}
            disabled={returnItems.length === 0 && exchangeItems.length === 0}
          >
            Procesar Devolución
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Caja;
