import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
} from '@mui/material';
import {
  Store,
  TrendingUp,
  Inventory,
  Assessment,
  Settings,
  Add,
} from '@mui/icons-material';

const MercadoLibre = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🛒 MercadoLibre Dashboard
        </Typography>
        <Chip
          label="Módulo en Desarrollo"
          color="warning"
          variant="outlined"
          size="large"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Store color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Productos ML</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Productos publicados
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Ventas</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ventas del mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Stock</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Productos sin stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Ingresos</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                $--
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresos del mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Store sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Módulo MercadoLibre
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Este módulo estará dedicado a la integración con MercadoLibre para gestionar:
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2, mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>📦 Gestión de Productos</Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Sincronización de inventario<br/>
                    • Publicación automática<br/>
                    • Actualización de precios<br/>
                    • Gestión de categorías
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>📊 Ventas y Reportes</Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Órdenes de MercadoLibre<br/>
                    • Seguimiento de envíos<br/>
                    • Reportes de ventas<br/>
                    • Análisis de performance
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Settings />}
                disabled
              >
                Configurar API
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                disabled
              >
                Sincronizar Productos
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MercadoLibre;
