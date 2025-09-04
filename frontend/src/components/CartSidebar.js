import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Button,
  Divider,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  ButtonGroup,
  Switch,
  FormControlLabel,
  Autocomplete,
  Paper,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import {
  Delete,
  Remove,
  Add,
  ShoppingCart,
  Inventory,
  Close,
  Person,
  Percent,
  AttachMoney,
  AccountBalanceWallet,
  Save,
  Receipt,
  Payment,
  Clear,
} from '@mui/icons-material';
import { apiService } from '../utils/api';
import { useCart } from '../contexts/CartContext';

const CartSidebar = ({ open, onClose }) => {
  const {
    cartItems,
    selectedCustomer,
    discountType,
    discountValue,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    updateCartItem,
    removeFromCart,
    clearCart,
    setSelectedCustomer,
    setDiscountType,
    setDiscountValue,
  } = useCart();
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  
  // Action modals state
  const [sendToCajaOpen, setSendToCajaOpen] = useState(false);
  const [saveQuoteOpen, setSaveQuoteOpen] = useState(false);
  const [generateRemitoOpen, setGenerateRemitoOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  
  // Send to Caja form data
  const [cajaData, setCajaData] = useState({
    clientName: '',
    note: ''
  });
  
  // Quote form data
  const [quoteData, setQuoteData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    vehicleChasis: '',
    vehicleEngine: '',
    vehiclePlate: '',
    validUntil: ''
  });
  const [showTotalsInQuote, setShowTotalsInQuote] = useState(true);
  
  // Invoice form data
  const [invoiceData, setInvoiceData] = useState({
    selectedClient: null,
    paymentMethod: 'efectivo',
    invoiceType: 'B',
    printInvoice: true
  });

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity > 0) {
      updateCartItem(id, { quantity: parseInt(newQuantity) });
    }
  };

  const handlePriceChange = (id, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    updateCartItem(id, { price });
  };

  const increaseQuantity = (id, currentQuantity) => {
    updateCartItem(id, { quantity: currentQuantity + 1 });
  };

  const decreaseQuantity = (id, currentQuantity) => {
    if (currentQuantity > 1) {
      updateCartItem(id, { quantity: currentQuantity - 1 });
    }
  };

  // Search customers
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerOptions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiService.searchCustomers(customerSearch);
        setCustomerOptions(data);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomerOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  const handleCreateCustomer = async () => {
    try {
      const customer = await apiService.createCustomer(newCustomer);
      setSelectedCustomer(customer);
      setCustomerDialogOpen(false);
      setNewCustomer({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        top: 48,
        width: 450,
        height: 'calc(100vh - 48px)',
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShoppingCart sx={{ mr: 1, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
              Carrito
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cartItems.length} artículo{cartItems.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Cart Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {cartItems.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <ShoppingCart sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Carrito vacío
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Agrega artículos para comenzar
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {cartItems.map((item) => (
              <ListItem key={item.id} sx={{ p: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 0.75, minHeight: 48 }}>
                  {/* Product Image */}
                  <Avatar
                    src={item.image_url ? `http://localhost:8000${item.image_url}` : '/api/placeholder/32/32'}
                    alt={item.name}
                    sx={{ width: 32, height: 32, flexShrink: 0, mt: 0.25 }}
                  />
                  
                  {/* Product Info - Two Lines */}
                  <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                    {/* First Line: Name and Code */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                      <Typography variant="caption" fontWeight="600" noWrap sx={{ maxWidth: 140, fontSize: '0.75rem' }}>
                        {item.name}
                      </Typography>
                      <Chip 
                        label={item.internal_code} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.6rem', minWidth: 'auto' }}
                        onClick={() => window.dispatchEvent(new CustomEvent('searchByPartNumber', { detail: item.internal_code }))}
                        style={{ cursor: 'pointer' }}
                      />
                    </Box>
                    
                    {/* Second Line: Brand and Original Code */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {item.brand}
                      </Typography>
                      {item.original_code && (
                        <Chip 
                          label={item.original_code} 
                          size="small" 
                          variant="filled"
                          color="secondary"
                          sx={{ height: 14, fontSize: '0.55rem', minWidth: 'auto' }}
                          onClick={() => window.dispatchEvent(new CustomEvent('searchByPartNumber', { detail: item.original_code }))}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  {/* Controls Column */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, flexShrink: 0 }}>
                    {/* Top Row: Quantity Controls and Price */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {/* Quantity Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: 'grey.100', borderRadius: 0.5, p: 0.25 }}>
                        <IconButton
                          size="small"
                          onClick={() => decreaseQuantity(item.id, item.quantity)}
                          sx={{ width: 18, height: 18, p: 0 }}
                        >
                          <Remove sx={{ fontSize: 10 }} />
                        </IconButton>
                        <Typography variant="caption" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => increaseQuantity(item.id, item.quantity)}
                          sx={{ width: 18, height: 18, p: 0 }}
                        >
                          <Add sx={{ fontSize: 10 }} />
                        </IconButton>
                      </Box>
                      
                      {/* Unit Price */}
                      <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right', fontSize: '0.65rem' }}>
                        ${item.price.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    {/* Bottom Row: Subtotal and Delete */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold" color="primary" sx={{ minWidth: 50, textAlign: 'right', fontSize: '0.75rem' }}>
                        ${(item.price * item.quantity).toLocaleString()}
                      </Typography>
                      
                      <IconButton
                        size="small"
                        onClick={() => removeFromCart(item.id)}
                        color="error"
                        sx={{ width: 18, height: 18, p: 0 }}
                      >
                        <Delete sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Ultra-Compact Discounts Section */}
      <Box sx={{ px: 1, py: 0.5, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
            Desc/Rec:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={discountType}
              exclusive
              onChange={(e, newType) => newType && setDiscountType(newType)}
              size="small"
              sx={{ height: 20, '& .MuiToggleButton-root': { px: 0.5, minWidth: 20, fontSize: '0.6rem' } }}
            >
              <ToggleButton value="percentage">%</ToggleButton>
              <ToggleButton value="amount">$</ToggleButton>
            </ToggleButtonGroup>
            
            <TextField
              size="small"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              placeholder="0"
              sx={{ 
                width: 50,
                '& .MuiInputBase-root': { height: 20, fontSize: '0.65rem' },
                '& .MuiInputBase-input': { textAlign: 'center', p: 0.25 }
              }}
              inputProps={{ min: 0, step: discountType === 'percentage' ? 1 : 100 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Compact Totals Footer */}
      {cartItems.length > 0 && (
        <Box sx={{ px: 1, py: 0.5, borderTop: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Subtotal:</Typography>
            <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.65rem' }}>
              ${subtotal.toLocaleString()}
            </Typography>
          </Box>
          
          {discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
              <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.6rem' }}>
                {discountType === 'percentage' ? `Desc (${discountValue}%):` : 'Descuento:'}
              </Typography>
              <Typography variant="caption" color="warning.main" fontWeight="600" sx={{ fontSize: '0.6rem' }}>
                -${discountAmount.toLocaleString()}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>IVA (21%):</Typography>
            <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.65rem' }}>
              ${taxAmount.toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, pt: 0.5, borderTop: '1px solid #ddd' }}>
            <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '0.8rem' }}>
              TOTAL:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '0.8rem' }}>
              ${total.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Compact Action Buttons Section */}
      {cartItems.length > 0 && (
        <Box sx={{ px: 1, py: 0.5, borderTop: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'space-between' }}>
            <IconButton
              onClick={() => setSendToCajaOpen(true)}
              color="warning"
              size="small"
              sx={{ 
                bgcolor: 'warning.main', 
                color: 'white',
                '&:hover': { bgcolor: 'warning.dark' },
                width: 28,
                height: 28
              }}
              title="Enviar a Caja"
            >
              <AccountBalanceWallet sx={{ fontSize: 14 }} />
            </IconButton>
            
            <IconButton
              onClick={() => setSaveQuoteOpen(true)}
              color="info"
              size="small"
              sx={{ 
                bgcolor: 'info.main', 
                color: 'white',
                '&:hover': { bgcolor: 'info.dark' },
                width: 28,
                height: 28
              }}
              title="Presupuesto"
            >
              <Save sx={{ fontSize: 14 }} />
            </IconButton>
            
            <IconButton
              onClick={() => setGenerateRemitoOpen(true)}
              color="secondary"
              size="small"
              sx={{ 
                bgcolor: 'secondary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'secondary.dark' },
                width: 28,
                height: 28
              }}
              title="Remito"
            >
              <Receipt sx={{ fontSize: 14 }} />
            </IconButton>
            
            <IconButton
              onClick={() => setInvoiceOpen(true)}
              color="success"
              size="small"
              sx={{ 
                bgcolor: 'success.main', 
                color: 'white',
                '&:hover': { bgcolor: 'success.dark' },
                width: 28,
                height: 28
              }}
              title="Facturar"
            >
              <Payment sx={{ fontSize: 14 }} />
            </IconButton>
            
            <IconButton
              onClick={clearCart}
              color="error"
              size="small"
              sx={{ 
                bgcolor: 'error.main', 
                color: 'white',
                '&:hover': { bgcolor: 'error.dark' },
                width: 28,
                height: 28
              }}
              title="Limpiar Carrito"
            >
              <Clear sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Customer Creation Dialog */}
      <Dialog open={customerDialogOpen} onClose={() => setCustomerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Teléfono"
            fullWidth
            variant="outlined"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateCustomer} 
            variant="contained"
            disabled={!newCustomer.name.trim()}
          >
            Crear Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send to Caja Modal */}
      <Dialog open={sendToCajaOpen} onClose={() => setSendToCajaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet color="warning" />
            Enviar a Caja
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            Completa los datos para enviar esta venta a la caja:
          </Typography>
          
          <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              📋 Resumen de Venta
            </Typography>
            <Typography variant="body2">
              {cartItems.length} artículo{cartItems.length !== 1 ? 's' : ''} • Total: <strong>${total.toLocaleString('es-AR')}</strong>
            </Typography>
          </Box>
          
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del Cliente"
            fullWidth
            variant="outlined"
            value={cajaData.clientName}
            onChange={(e) => setCajaData({ ...cajaData, clientName: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Ej: Juan Pérez"
            helperText="Nombre del cliente para identificar la venta"
          />
          
          <TextField
            margin="dense"
            label="Nota para el Cajero"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={cajaData.note}
            onChange={(e) => setCajaData({ ...cajaData, note: e.target.value })}
            placeholder="Ej: Cliente solicita factura A, descuento especial aplicado..."
            helperText="Información adicional para el cajero (opcional)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSendToCajaOpen(false);
            setCajaData({ clientName: '', note: '' });
          }}>Cancelar</Button>
          <Button 
            variant="contained"
            color="warning"
            onClick={async () => {
              try {
                const saleData = {
                  cartItems,
                  total,
                  subtotal,
                  discountAmount,
                  taxAmount,
                  selectedCustomer,
                  clientName: cajaData.clientName,
                  note: cajaData.note,
                  timestamp: new Date().toISOString()
                };
                
                console.log('[DEBUG] Sending to caja:', JSON.stringify(saleData, null, 2));
                console.log('[DEBUG] Cart items:', cartItems);
                
                const response = await apiService.sendToCaja(saleData);
                console.log('Venta enviada a caja:', response);
                
                // Clear cart and close modal
                clearCart();
                setSendToCajaOpen(false);
                setCajaData({ clientName: '', note: '' });
                
                // Show success message
                alert(`Venta enviada a caja exitosamente. Referencia: ${response.reference}`);
              } catch (error) {
                console.error('Error enviando a caja:', error);
                alert('Error al enviar la venta a caja. Intenta nuevamente.');
              }
            }}
            disabled={!cajaData.clientName.trim()}
          >
            Enviar a Caja
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Quote Modal */}
      <Dialog open={saveQuoteOpen} onClose={() => setSaveQuoteOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Save color="info" />
            Guardar Presupuesto
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            Completa los datos del cliente y vehículo para el presupuesto:
          </Typography>
          
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                💰 Resumen del Presupuesto
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showTotalsInQuote}
                    onChange={(e) => setShowTotalsInQuote(e.target.checked)}
                    size="small"
                  />
                }
                label="Mostrar totales"
                sx={{ m: 0 }}
              />
            </Box>
            <Typography variant="body2">
              {cartItems.length} artículo{cartItems.length !== 1 ? 's' : ''}
              {showTotalsInQuote && (
                <> • Total: <strong>${total.toLocaleString('es-AR')}</strong></>
              )}
            </Typography>
            {showTotalsInQuote && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Subtotal: ${subtotal.toLocaleString('es-AR')}
                </Typography>
                {discountAmount > 0 && (
                  <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                    Descuento: -${discountAmount.toLocaleString('es-AR')}
                  </Typography>
                )}
                {taxAmount > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Impuestos: ${taxAmount.toLocaleString('es-AR')}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              autoFocus
              label="Nombre del Cliente"
              fullWidth
              variant="outlined"
              value={quoteData.clientName}
              onChange={(e) => setQuoteData({ ...quoteData, clientName: e.target.value })}
              placeholder="Ej: Juan Pérez"
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={quoteData.clientEmail}
              onChange={(e) => setQuoteData({ ...quoteData, clientEmail: e.target.value })}
              placeholder="cliente@email.com"
            />
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              label="Teléfono"
              fullWidth
              variant="outlined"
              value={quoteData.clientPhone}
              onChange={(e) => setQuoteData({ ...quoteData, clientPhone: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
            <TextField
              label="Válido Hasta"
              type="date"
              fullWidth
              variant="outlined"
              value={quoteData.validUntil}
              onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
            🚗 Datos del Vehículo
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <TextField
              label="Número de Chasis"
              fullWidth
              variant="outlined"
              value={quoteData.vehicleChasis}
              onChange={(e) => setQuoteData({ ...quoteData, vehicleChasis: e.target.value })}
              placeholder="Ej: 9BWZZZ377VT004251"
              helperText="VIN del vehículo"
            />
            <TextField
              label="Número de Motor"
              fullWidth
              variant="outlined"
              value={quoteData.vehicleEngine}
              onChange={(e) => setQuoteData({ ...quoteData, vehicleEngine: e.target.value })}
              placeholder="Ej: CBZ123456"
              helperText="Código del motor"
            />
            <TextField
              label="Patente"
              fullWidth
              variant="outlined"
              value={quoteData.vehiclePlate}
              onChange={(e) => setQuoteData({ ...quoteData, vehiclePlate: e.target.value.toUpperCase() })}
              placeholder="Ej: ABC123"
              helperText="Patente del vehículo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSaveQuoteOpen(false);
            setQuoteData({
              clientName: '', clientEmail: '', clientPhone: '',
              vehicleChasis: '', vehicleEngine: '', vehiclePlate: '', validUntil: ''
            });
          }}>Cancelar</Button>
          <Button 
            variant="contained"
            color="info"
onClick={async () => {
              try {
                const quoteFullData = {
                  cartItems,
                  total,
                  subtotal,
                  discountAmount,
                  taxAmount,
                  selectedCustomer,
                  ...quoteData,
                  timestamp: new Date().toISOString()
                };
                console.log('Guardando presupuesto:', quoteFullData);
                
                await apiService.createQuote(quoteFullData);
                
                // Clear cart and close modal
                clearCart();
                setSaveQuoteOpen(false);
                setQuoteData({
                  clientName: '', clientEmail: '', clientPhone: '',
                  vehicleChasis: '', vehicleEngine: '', vehiclePlate: '', validUntil: ''
                });
                
                alert('Presupuesto guardado exitosamente');
              } catch (error) {
                console.error('Error guardando presupuesto:', error);
                alert('Error al guardar el presupuesto');
              }
            }}
            disabled={!quoteData.clientName.trim()}
          >
            Guardar Presupuesto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Remito Modal */}
      <Dialog open={generateRemitoOpen} onClose={() => setGenerateRemitoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Remito</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Confirmas generar el remito para esta venta?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: ${total.toLocaleString('es-AR')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateRemitoOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained"
            color="secondary"
            onClick={() => {
              console.log('Generando remito:', { cartItems, total, selectedCustomer });
              setGenerateRemitoOpen(false);
            }}
          >
            Generar Remito
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={invoiceOpen} onClose={() => setInvoiceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="success" />
            Facturar Venta
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            Completa los datos para facturar esta venta:
          </Typography>
          
          <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              🧾 Resumen de Facturación
            </Typography>
            <Typography variant="body2">
              {cartItems.length} artículo{cartItems.length !== 1 ? 's' : ''} • Total: <strong>${total.toLocaleString('es-AR')}</strong>
            </Typography>
          </Box>
          
          <Autocomplete
            options={customerOptions}
            getOptionLabel={(option) => `${option.name} (${option.document})`}
            value={invoiceData.selectedClient}
            onChange={(event, newValue) => {
              setInvoiceData({ ...invoiceData, selectedClient: newValue });
            }}
            onInputChange={(event, newInputValue) => {
              setCustomerSearch(newInputValue);
            }}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente"
                placeholder="Buscar cliente..."
                variant="outlined"
                sx={{ mb: 2 }}
                helperText="Selecciona un cliente o deja vacío para consumidor final"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body2" fontWeight="600">
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.document} • {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
          />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Tipo de Factura"
              value={invoiceData.invoiceType}
              onChange={(e) => setInvoiceData({ ...invoiceData, invoiceType: e.target.value })}
              variant="outlined"
              helperText="Tipo de comprobante fiscal"
            >
              <MenuItem value="A">Factura A (Responsable Inscripto)</MenuItem>
              <MenuItem value="B">Factura B (Consumidor Final)</MenuItem>
              <MenuItem value="C">Factura C (Exento)</MenuItem>
            </TextField>
            
            <TextField
              select
              label="Forma de Pago"
              value={invoiceData.paymentMethod}
              onChange={(e) => setInvoiceData({ ...invoiceData, paymentMethod: e.target.value })}
              variant="outlined"
              helperText="Método de pago utilizado"
            >
              <MenuItem value="efectivo">💵 Efectivo</MenuItem>
              <MenuItem value="tarjeta_debito">💳 Tarjeta Débito</MenuItem>
              <MenuItem value="tarjeta_credito">💳 Tarjeta Crédito</MenuItem>
              <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
              <MenuItem value="cheque">📄 Cheque</MenuItem>
              <MenuItem value="cuenta_corriente">📊 Cuenta Corriente</MenuItem>
            </TextField>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <input
              type="checkbox"
              id="printInvoice"
              checked={invoiceData.printInvoice}
              onChange={(e) => setInvoiceData({ ...invoiceData, printInvoice: e.target.checked })}
            />
            <label htmlFor="printInvoice">
              <Typography variant="body2">
                🖨️ Imprimir factura automáticamente
              </Typography>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setInvoiceOpen(false);
            setInvoiceData({
              selectedClient: null,
              paymentMethod: 'efectivo',
              invoiceType: 'B',
              printInvoice: true
            });
          }}>Cancelar</Button>
          <Button 
            variant="contained"
            color="success"
            onClick={() => {
              const invoiceFullData = {
                cartItems,
                total,
                selectedCustomer: invoiceData.selectedClient || selectedCustomer,
                ...invoiceData,
                timestamp: new Date().toISOString()
              };
              console.log('Facturando:', invoiceFullData);
              // TODO: Implement API call to create invoice
              if (invoiceData.printInvoice) {
                console.log('Imprimiendo factura...');
                // TODO: Implement print functionality
              }
              setInvoiceOpen(false);
              setInvoiceData({
                selectedClient: null,
                paymentMethod: 'efectivo',
                invoiceType: 'B',
                printInvoice: true
              });
            }}
          >
            {invoiceData.printInvoice ? 'Facturar e Imprimir' : 'Facturar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CartSidebar;
