import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  TextField,
  Divider,
  Paper,
  Chip,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
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

const CartSidebar = ({ 
  open,
  onClose,
  cartItems, 
  onUpdateItem, 
  onRemoveItem,
  selectedCustomer,
  onCustomerChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  subtotal, 
  discountAmount, 
  taxAmount, 
  total,
  onClearCart 
}) => {
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
  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity > 0) {
      onUpdateItem(id, { quantity: parseInt(newQuantity) });
    }
  };

  const handlePriceChange = (id, newPrice) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      onUpdateItem(id, { price });
    }
  };

  const increaseQuantity = (id, currentQuantity) => {
    onUpdateItem(id, { quantity: currentQuantity + 1 });
  };

  const decreaseQuantity = (id, currentQuantity) => {
    if (currentQuantity > 1) {
      onUpdateItem(id, { quantity: currentQuantity - 1 });
    }
  };

  // Search customers
  React.useEffect(() => {
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
      onCustomerChange(customer);
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
        top: 48, // Further reduced AppBar height
        width: 450, // Increased width for better data display
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
        <IconButton size="small" onClick={onClose}>
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
              <ListItem 
                key={item.id} 
                sx={{ 
                  borderBottom: 1,
                  borderColor: 'divider',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {/* Product Image */}
                {item.image_url && (
                  <Avatar
                    src={`http://localhost:8000${item.image_url}`}
                    alt={item.name}
                    variant="rounded"
                    sx={{ width: 40, height: 40, flexShrink: 0 }}
                  />
                )}
                
                {/* Product Info - Compact */}
                <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                    {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.brand}
                    </Typography>
                    <Chip 
                      label={item.internal_code} 
                      size="small" 
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.7rem' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                      <Inventory sx={{ fontSize: 12, mr: 0.25, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {item.stock}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Quantity Controls - Compact */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => decreaseQuantity(item.id, item.quantity)}
                    disabled={item.quantity <= 1}
                    sx={{ p: 0.25 }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <TextField
                    size="small"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    inputProps={{ 
                      style: { textAlign: 'center', width: 30, padding: '2px' },
                      min: 1,
                      type: 'number'
                    }}
                    sx={{ mx: 0.5, '& .MuiOutlinedInput-root': { height: 28 } }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => increaseQuantity(item.id, item.quantity)}
                    sx={{ p: 0.25 }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>

                {/* Price - Compact */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, minWidth: 80 }}>
                  <TextField
                    size="small"
                    value={item.price}
                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                    inputProps={{ 
                      style: { textAlign: 'right', width: 60, padding: '2px', fontSize: '0.8rem' },
                      step: 0.01,
                      type: 'number'
                    }}
                    InputProps={{
                      startAdornment: '$',
                    }}
                    sx={{ mb: 0.5, '& .MuiOutlinedInput-root': { height: 28 } }}
                  />
                  <Typography variant="caption" color="primary" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                    ${(item.price * item.quantity).toLocaleString('es-AR')}
                  </Typography>
                </Box>

                {/* Delete Button */}
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemoveItem(item.id)}
                  sx={{ p: 0.25, flexShrink: 0 }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>



      {/* Discount Section - Compact */}
      {cartItems.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.25' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 0.5 }}>
            Descuento/Recargo
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={discountType}
              exclusive
              onChange={(e, value) => value && onDiscountTypeChange(value)}
              size="small"
              sx={{ height: 28 }}
            >
              <ToggleButton value="percentage" sx={{ px: 1, minWidth: 32 }}>
                <Percent sx={{ fontSize: 12 }} />
              </ToggleButton>
              <ToggleButton value="amount" sx={{ px: 1, minWidth: 32 }}>
                <AttachMoney sx={{ fontSize: 12 }} />
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              size="small"
              placeholder={discountType === 'percentage' ? "%" : "$"}
              type="number"
              value={discountValue}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onDiscountValueChange(value);
              }}
              inputProps={{ 
                style: { textAlign: 'center', width: 60, padding: '4px', fontSize: '0.8rem' },
              }}
              sx={{ '& .MuiOutlinedInput-root': { height: 28 } }}
            />
          </Box>
        </Box>
      )}

      {/* Totals Footer */}
      {cartItems.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">
                ${subtotal.toLocaleString('es-AR')}
              </Typography>
            </Box>
            
            {discountAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="success.main">Descuento:</Typography>
                <Typography variant="body2" color="success.main">
                  -${discountAmount.toLocaleString('es-AR')}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">IVA (21%):</Typography>
              <Typography variant="body2">
                ${taxAmount.toLocaleString('es-AR')}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              TOTAL:
            </Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              ${total.toLocaleString('es-AR')}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Action Buttons Section */}
      {cartItems.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, fontSize: '0.9rem' }}>
            💼 Acciones
          </Typography>
          
          {/* Action Buttons as Icons */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            <IconButton
              color="warning"
              size="small"
              onClick={() => setSendToCajaOpen(true)}
              sx={{ 
                bgcolor: 'warning.main', 
                color: 'white',
                '&:hover': { bgcolor: 'warning.dark' },
                width: 32,
                height: 32
              }}
              title="Enviar a Caja"
            >
              <AccountBalanceWallet sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              color="info"
              size="small"
              onClick={() => setSaveQuoteOpen(true)}
              sx={{ 
                bgcolor: 'info.main', 
                color: 'white',
                '&:hover': { bgcolor: 'info.dark' },
                width: 32,
                height: 32
              }}
              title="Presupuesto"
            >
              <Save sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              color="secondary"
              size="small"
              onClick={() => setGenerateRemitoOpen(true)}
              sx={{ 
                bgcolor: 'secondary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'secondary.dark' },
                width: 32,
                height: 32
              }}
              title="Remito"
            >
              <Receipt sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              color="success"
              size="small"
              onClick={() => setInvoiceOpen(true)}
              sx={{ 
                bgcolor: 'success.main', 
                color: 'white',
                '&:hover': { bgcolor: 'success.dark' },
                width: 32,
                height: 32
              }}
              title="Facturar"
            >
              <Payment sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={onClearCart}
              sx={{ 
                bgcolor: 'error.main', 
                color: 'white',
                '&:hover': { bgcolor: 'error.dark' },
                width: 32,
                height: 32,
                ml: 'auto'
              }}
              title="Limpiar Carrito"
            >
              <Clear sx={{ fontSize: 16 }} />
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
        <DialogTitle>Enviar a Caja</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Confirmas enviar esta venta a la caja para procesamiento?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: ${total.toLocaleString('es-AR')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendToCajaOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained"
            color="warning"
            onClick={() => {
              console.log('Enviando a caja:', { cartItems, total, selectedCustomer });
              setSendToCajaOpen(false);
            }}
          >
            Enviar a Caja
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Quote Modal */}
      <Dialog open={saveQuoteOpen} onClose={() => setSaveQuoteOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Guardar Presupuesto</DialogTitle>
              <DialogContent>
                <Typography variant="body1" gutterBottom>
                  ¿Deseas guardar esta venta como presupuesto?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total: ${total.toLocaleString('es-AR')}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSaveQuoteOpen(false)}>Cancelar</Button>
                <Button 
                  variant="contained"
                  color="info"
                  onClick={() => {
                    console.log('Guardando presupuesto:', { cartItems, total, selectedCustomer });
                    setSaveQuoteOpen(false);
                  }}
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
              <DialogTitle>Facturar</DialogTitle>
              <DialogContent>
                <Typography variant="body1" gutterBottom>
                  ¿Confirmas facturar esta venta?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Total: ${total.toLocaleString('es-AR')}
                </Typography>
                {!selectedCustomer && (
                  <Typography variant="body2" color="warning.main">
                    ⚠️ No hay cliente seleccionado. Se facturará como consumidor final.
                  </Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setInvoiceOpen(false)}>Cancelar</Button>
                <Button 
                  variant="contained"
                  color="success"
                  onClick={() => {
                    console.log('Facturando:', { cartItems, total, selectedCustomer });
                    setInvoiceOpen(false);
                  }}
                >
                  Facturar
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        );
      });
    </Box>
  );
};

export default CartSidebar;
