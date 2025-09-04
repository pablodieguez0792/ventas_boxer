import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Analytics,
  Construction,
} from '@mui/icons-material';

const Analisis = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📈 Análisis
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
              Este módulo incluirá análisis avanzados de ventas, reportes de performance, 
              métricas de conversión, análisis de productos más vendidos, y dashboards interactivos.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analisis;
