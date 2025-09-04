import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import {
  Visibility,
  Note,
  LocalShipping,
  Print,
} from '@mui/icons-material';

const ShippingLabel = ({ sale, onStatusChange, onViewDetail, onAddNote, onPrint }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getShippingTypeColor = (type) => {
    switch (type) {
      case 'Flex': return 'primary';
      case 'Colecta': return 'secondary';
      case 'Turbo': return 'error';
      case 'Full': return 'success';
      case 'A convenir': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'para_preparar': return 'warning';
      case 'etiqueta_impresa': return 'info';
      case 'para_entregar': return 'primary';
      case 'en_camino': return 'secondary';
      case 'entregada': return 'success';
      case 'facturada': return 'success';
      case 'controlada': return 'info';
      case 'lista_para_enviar': return 'primary';
      default: return 'default';
    }
  };

  const statusSteps = [
    { key: 'para_preparar', label: 'PREPARAR' },
    { key: 'etiqueta_impresa', label: 'IMPRIMIR ETIQUETA' },
    { key: 'controlada', label: 'MENSAJERÍA' },
    { key: 'lista_para_enviar', label: 'ARMAR PAQUETE' },
    { key: 'facturada', label: 'GENERAR REMITO' },
    { key: 'entregada', label: 'VER FACTURA' },
  ];

  const isStepCompleted = (stepKey) => {
    const currentIndex = statusSteps.findIndex(step => step.key === sale.logisticsStatus);
    const stepIndex = statusSteps.findIndex(step => step.key === stepKey);
    return stepIndex <= currentIndex;
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        border: '2px solid #ff6b35',
        borderRadius: 2,
        backgroundColor: '#fff',
        maxWidth: 800,
        margin: 'auto'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        backgroundColor: '#f5f5f5',
        p: 1,
        borderRadius: 1
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" fontWeight="bold">ML</Typography>
          <Typography variant="body2">{sale.saleNumber}</Typography>
          <Typography variant="body2">{formatDate(sale.date)}</Typography>
          <Typography variant="body2">{formatTime(sale.date)}</Typography>
          <Chip 
            label={sale.status} 
            color={getStatusColor(sale.logisticsStatus)} 
            size="small" 
          />
          <Typography variant="body2">API</Typography>
          <Chip 
            label={sale.shippingType} 
            color={getShippingTypeColor(sale.shippingType)} 
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Product Info */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Product Image */}
            <Box sx={{ 
              width: 80, 
              height: 60, 
              backgroundColor: '#f0f0f0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={sale.items[0]?.imageUrl || '/static/images/placeholder.jpg'} 
                alt={sale.title}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: 4
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div style="color: #999; font-size: 12px;">IMG</div>';
                }}
              />
            </Box>

            {/* Product Details */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                {sale.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Typography variant="body2">
                  <strong>MLA:</strong> {sale.mla}
                </Typography>
                <Typography variant="body2">
                  <strong>SKU:</strong> {sale.sku}
                </Typography>
              </Box>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                ${sale.total.toLocaleString('es-AR')} x{sale.items[0]?.quantity || 1}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Cliente:</strong> {sale.customer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>N° Envío:</strong> {sale.shippingNumber}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Status Checklist */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            border: '1px solid #ddd',
            borderRadius: 1,
            p: 2,
            backgroundColor: '#fafafa'
          }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              ESTADO DEL PROCESO
            </Typography>
            
            {statusSteps.map((step, index) => (
              <FormControlLabel
                key={step.key}
                control={
                  <Checkbox
                    checked={isStepCompleted(step.key)}
                    onChange={() => onStatusChange && onStatusChange(sale.id, step.key)}
                    size="small"
                    color="success"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    {step.label}
                  </Typography>
                }
                sx={{ 
                  display: 'block',
                  mb: 0.5,
                  '& .MuiFormControlLabel-label': {
                    fontWeight: isStepCompleted(step.key) ? 'bold' : 'normal',
                    color: isStepCompleted(step.key) ? 'success.main' : 'text.secondary'
                  }
                }}
              />
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                size="small"
                startIcon={<Visibility />}
                onClick={() => onViewDetail && onViewDetail(sale)}
                sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
              >
                Ver detalle
              </Button>
              <Button
                size="small"
                startIcon={<Note />}
                onClick={() => onAddNote && onAddNote(sale)}
                sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
              >
                Agregar nota
              </Button>
              <Button
                size="small"
                startIcon={<Print />}
                onClick={() => onPrint && onPrint(sale)}
                sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
                variant="outlined"
                color="primary"
              >
                Imprimir
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ShippingLabel;
