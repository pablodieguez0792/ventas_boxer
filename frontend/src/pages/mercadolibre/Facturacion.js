import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Receipt,
  Construction,
} from '@mui/icons-material';

const Facturacion = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🧾 Facturación
      </Typography>
      
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Construction sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Módulo en Desarrollo
          </Typography>
          <Alert severity="info" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="body1">
              <strong>Funcionalidad en desarrollo.</strong><br/>
              Este módulo incluirá la gestión completa de facturación para las ventas de MercadoLibre, 
              incluyendo generación automática de facturas, control de AFIP, y reportes fiscales.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Facturacion;
