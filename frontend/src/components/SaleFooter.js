import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Typography,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Person,
  Add,
  Percent,
  AttachMoney,
} from '@mui/icons-material';
import { apiService } from '../utils/api';

const SaleFooter = ({
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
}) => {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <Grid container spacing={3}>
      {/* Customer Selection */}
      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom>
          👤 Cliente
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Autocomplete
            options={customerOptions}
            getOptionLabel={(option) => `${option.name} (${option.document || 'Sin documento'})`}
            loading={loading}
            value={selectedCustomer}
            onChange={(event, newValue) => onCustomerChange(newValue)}
            onInputChange={(event, newInputValue) => {
              setCustomerSearch(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar cliente..."
                placeholder="Nombre o documento"
                variant="outlined"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            )}
            sx={{ flex: 1 }}
            noOptionsText={
              customerSearch.length < 2 
                ? "Escriba para buscar..."
                : "No se encontraron clientes"
            }
            loadingText="Buscando clientes..."
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            sx={{ minWidth: 'auto', px: 2 }}
            title="Agregar cliente rápido"
          >
            +
          </Button>
        </Box>
      </Grid>

      {/* Discounts */}
      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom>
          💰 Descuentos
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <ToggleButtonGroup
              value={discountType}
              exclusive
              onChange={(e, value) => value && onDiscountTypeChange(value)}
              size="small"
            >
              <ToggleButton value="percentage">
                <Percent /> %
              </ToggleButton>
              <ToggleButton value="amount">
                <AttachMoney /> $
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={discountType === 'percentage' ? "Descuento (%)" : "Descuento ($)"}
              type="number"
              value={discountValue}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onDiscountValueChange(value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {discountType === 'percentage' ? <Percent /> : <AttachMoney />}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Totals */}
      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom>
          🧮 Totales
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Subtotal:</Typography>
            <Typography variant="body1" fontWeight="bold">
              ${subtotal.toLocaleString()}
            </Typography>
          </Box>
          {discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" color="success.main">Descuento:</Typography>
              <Typography variant="body1" color="success.main" fontWeight="bold">
                -${discountAmount.toLocaleString('es-AR')}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">IVA (21%):</Typography>
            <Typography variant="body1" fontWeight="bold">
              ${taxAmount.toLocaleString('es-AR')}
            </Typography>
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
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SaleFooter;
