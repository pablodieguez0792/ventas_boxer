import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
} from '@mui/material';
import {
  Send,
  Save,
  Receipt,
  Payment,
  AccountBalanceWallet,
  Clear,
} from '@mui/icons-material';

const ActionButtons = ({
  cartItems,
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
  onClearCart,
}) => {
  const [sendToCajaOpen, setSendToCajaOpen] = useState(false);
  const [saveQuoteOpen, setSaveQuoteOpen] = useState(false);
  const [generateRemitoOpen, setGenerateRemitoOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Send to Caja modal state
  const [cajaReference, setCajaReference] = useState('');
  const [cajaComments, setCajaComments] = useState('');

  // Quote modal state
  const [quoteCustomer, setQuoteCustomer] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  // Invoice modal state
  const [paymentMethod, setPaymentMethod] = useState('');

  const isCartEmpty = cartItems.length === 0;

  const handleSendToCaja = () => {
    // TODO: Implement API call to send sale to caja
    console.log('Sending to Caja:', {
      reference: cajaReference,
      comments: cajaComments,
      items: cartItems,
      total,
    });
    
    // Clear form and close modal
    setCajaReference('');
    setCajaComments('');
    setSendToCajaOpen(false);
    onClearCart();
    
    // Show success message (you might want to use a snackbar)
    alert('Venta enviada a Caja exitosamente');
  };

  const handleSaveQuote = () => {
    // TODO: Implement API call to save quote
    console.log('Saving Quote:', {
      customer: quoteCustomer,
      vehicleInfo,
      notes: quoteNotes,
      items: cartItems,
      total,
    });
    
    // Clear form and close modal
    setQuoteCustomer('');
    setVehicleInfo('');
    setQuoteNotes('');
    setSaveQuoteOpen(false);
    onClearCart();
    
    alert('Presupuesto guardado exitosamente');
  };

  const handleGenerateRemito = () => {
    // TODO: Implement API call to generate remito
    console.log('Generating Remito:', {
      customer: selectedCustomer,
      items: cartItems,
      total,
    });
    
    setGenerateRemitoOpen(false);
    onClearCart();
    
    alert('Remito generado exitosamente');
  };

  const handleInvoice = () => {
    // TODO: Implement API call to create invoice
    console.log('Creating Invoice:', {
      customer: selectedCustomer,
      paymentMethod,
      items: cartItems,
      total,
      discount: discountType,
      discountValue,
    });
    
    setPaymentMethod('');
    setInvoiceOpen(false);
    onClearCart();
    
    alert('Factura generada exitosamente');
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Paper sx={{ p: 1.5 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          💼 Acciones de Venta
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6} sm={3}>
            <Button
              variant="contained"
              color="warning"
              fullWidth
              size="small"
              startIcon={<AccountBalanceWallet />}
              onClick={() => setSendToCajaOpen(true)}
              disabled={cartItems.length === 0}
            >
              Enviar a Caja
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="contained"
              color="info"
              fullWidth
              size="small"
              startIcon={<Save />}
              onClick={() => setSaveQuoteOpen(true)}
              disabled={cartItems.length === 0}
            >
              Presupuesto
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              size="small"
              startIcon={<Receipt />}
              onClick={() => setGenerateRemitoOpen(true)}
              disabled={cartItems.length === 0}
            >
              Remito
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="small"
              startIcon={<Payment />}
              onClick={() => setInvoiceOpen(true)}
              disabled={cartItems.length === 0}
            >
              Facturar
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary" sx={{ fontSize: '1.1rem' }}>
            Total: ${total.toLocaleString('es-AR')}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<Clear sx={{ fontSize: 16 }} />}
            onClick={onClearCart}
            disabled={cartItems.length === 0}
            sx={{ height: 28, fontSize: '0.75rem' }}
          >
            Limpiar
          </Button>
        </Box>
      </Paper>

      {/* Send to Caja Modal */}
      <Dialog open={sendToCajaOpen} onClose={() => setSendToCajaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar a Caja</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            La venta será enviada a la cola de Caja para facturación posterior.
          </Typography>
          
          <TextField
            label="Referencia/Nombre"
            placeholder="Ej: Juan Pérez - Hilux azul"
            value={cajaReference}
            onChange={(e) => setCajaReference(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            label="Comentarios (opcional)"
            placeholder="Información adicional..."
            value={cajaComments}
            onChange={(e) => setCajaComments(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            Esta acción NO descuenta stock. La venta quedará pendiente de facturación.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendToCajaOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSendToCaja} 
            variant="contained"
            disabled={!cajaReference.trim()}
          >
            Enviar a Caja
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Quote Modal */}
      <Dialog open={saveQuoteOpen} onClose={() => setSaveQuoteOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Guardar Presupuesto</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Cliente"
                value={quoteCustomer}
                onChange={(e) => setQuoteCustomer(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Información del Vehículo"
                placeholder="Patente, Modelo, Año..."
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notas adicionales"
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            El presupuesto se guardará sin descontar stock y podrá ser convertido en venta posteriormente.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveQuoteOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveQuote} 
            variant="contained"
            disabled={!quoteCustomer.trim()}
          >
            Guardar Presupuesto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Remito Modal */}
      <Dialog open={generateRemitoOpen} onClose={() => setGenerateRemitoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Remito</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Se generará un remito (orden de venta) sin descontar stock.
          </Typography>
          
          {selectedCustomer ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Cliente: {selectedCustomer.name}
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No hay cliente seleccionado. Se generará como "Cliente Genérico".
            </Alert>
          )}

          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: ${total.toLocaleString()}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateRemitoOpen(false)}>Cancelar</Button>
          <Button onClick={handleGenerateRemito} variant="contained">
            Generar Remito
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={invoiceOpen} onClose={() => setInvoiceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Facturar Venta</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Se generará la factura fiscal y se descontará el stock.
          </Typography>
          
          {selectedCustomer ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Cliente: {selectedCustomer.name}
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              Debe seleccionar un cliente para facturar.
            </Alert>
          )}

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

          <Typography variant="h6" sx={{ mt: 2 }}>
            Total a Facturar: ${total.toLocaleString()}
          </Typography>

          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción es irreversible y descontará el stock automáticamente.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleInvoice} 
            variant="contained"
            color="success"
            disabled={!selectedCustomer || !paymentMethod}
          >
            Facturar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActionButtons;
