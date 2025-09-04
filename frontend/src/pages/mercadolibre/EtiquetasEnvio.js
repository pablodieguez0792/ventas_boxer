import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import {
  Print,
  FilterList,
  LocalShipping,
} from '@mui/icons-material';
import { useMercadoLibreContext } from '../MercadoLibreContainer';
import ShippingLabel from '../../components/ShippingLabel';

const EtiquetasEnvio = () => {
  const { sales, updateSaleStatus } = useMercadoLibreContext();
  const [filters, setFilters] = useState({
    logisticsStatus: '',
    shippingType: '',
    searchText: ''
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatusChange = (saleId, newStatus) => {
    updateSaleStatus(saleId, newStatus);
  };

  const handleViewDetail = (sale) => {
    console.log('Ver detalle:', sale);
    // Aquí se podría abrir un modal con más detalles
  };

  const handleAddNote = (sale) => {
    console.log('Agregar nota:', sale);
    // Aquí se podría abrir un modal para agregar notas
  };

  const handlePrint = (sale) => {
    console.log('Imprimir etiqueta:', sale);
    // Aquí se implementaría la lógica de impresión
    window.print();
  };

  const handlePrintAll = () => {
    console.log('Imprimir todas las etiquetas filtradas');
    window.print();
  };

  // Filter sales based on current filters
  const filteredSales = sales.filter(sale => {
    if (filters.logisticsStatus && sale.logisticsStatus !== filters.logisticsStatus) return false;
    if (filters.shippingType && sale.shippingType !== filters.shippingType) return false;
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      return (
        sale.mla?.toLowerCase().includes(searchLower) ||
        sale.sku?.toLowerCase().includes(searchLower) ||
        sale.title?.toLowerCase().includes(searchLower) ||
        sale.customer?.name?.toLowerCase().includes(searchLower) ||
        sale.shippingNumber?.toLowerCase().includes(searchLower) ||
        sale.saleNumber?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getLogisticsStatusText = (status) => {
    switch (status) {
      case 'para_preparar': return 'Para Preparar';
      case 'etiqueta_impresa': return 'Etiqueta Impresa';
      case 'para_entregar': return 'Para Entregar';
      case 'en_camino': return 'En Camino';
      case 'entregada': return 'Entregada';
      case 'facturada': return 'Facturada';
      case 'controlada': return 'Controlada';
      case 'lista_para_enviar': return 'Lista para Enviar';
      default: return status;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🏷️ Etiquetas de Envío
      </Typography>
      
      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              placeholder="N° Venta, MLA, SKU, Cliente..."
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.logisticsStatus}
                onChange={(e) => handleFilterChange('logisticsStatus', e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="para_preparar">Para Preparar</MenuItem>
                <MenuItem value="etiqueta_impresa">Etiqueta Impresa</MenuItem>
                <MenuItem value="para_entregar">Para Entregar</MenuItem>
                <MenuItem value="en_camino">En Camino</MenuItem>
                <MenuItem value="entregada">Entregada</MenuItem>
                <MenuItem value="facturada">Facturada</MenuItem>
                <MenuItem value="controlada">Controlada</MenuItem>
                <MenuItem value="lista_para_enviar">Lista para Enviar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Envío</InputLabel>
              <Select
                value={filters.shippingType}
                onChange={(e) => handleFilterChange('shippingType', e.target.value)}
                label="Tipo de Envío"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Flex">Flex</MenuItem>
                <MenuItem value="Colecta">Colecta</MenuItem>
                <MenuItem value="Turbo">Turbo</MenuItem>
                <MenuItem value="Full">Full</MenuItem>
                <MenuItem value="A convenir">A convenir</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrintAll}
              disabled={filteredSales.length === 0}
            >
              Imprimir Todas ({filteredSales.length})
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Info */}
      {filteredSales.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No se encontraron ventas con los filtros aplicados.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 3 }}>
          <strong>{filteredSales.length}</strong> etiquetas encontradas
        </Alert>
      )}

      {/* Labels Grid */}
      <Grid container spacing={3}>
        {filteredSales.map((sale) => (
          <Grid item xs={12} key={sale.id}>
            <ShippingLabel
              sale={sale}
              onStatusChange={handleStatusChange}
              onViewDetail={handleViewDetail}
              onAddNote={handleAddNote}
              onPrint={handlePrint}
            />
          </Grid>
        ))}
      </Grid>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .MuiPaper-root {
            box-shadow: none !important;
            border: 2px solid #000 !important;
            page-break-after: always;
            margin-bottom: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default EtiquetasEnvio;
