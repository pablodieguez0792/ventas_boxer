import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Chip,
} from '@mui/material';
import {
  ShoppingCart,
  Add,
  Sync,
  Upload,
} from '@mui/icons-material';

const MercadoLibreProductos = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📦 Productos MercadoLibre
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            label="Próximamente"
            color="info"
            variant="outlined"
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            disabled
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ShoppingCart sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Gestión de Productos MercadoLibre
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Aquí podrás gestionar todos los productos sincronizados con MercadoLibre.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Sync />}
            disabled
          >
            Sincronizar Stock
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            disabled
          >
            Subir Productos
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default MercadoLibreProductos;
