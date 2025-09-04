import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Divider,
  OutlinedInput,
} from '@mui/material';
import {
  DataGrid,
} from '@mui/x-data-grid';
import {
  Dashboard,
  LocalShipping,
  MoreVert,
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  Print,
  Message,
  Inventory,
  Receipt,
  Description,
  CreditCard,
  Note,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import { useMercadoLibreContext } from '../MercadoLibreContainer';

const GestionVentas = () => {
  const { sales, updateSaleStatus } = useMercadoLibreContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    shippingType: '',
    logisticsStatus: [],
    status: '',
    searchText: ''
  });

  const handleSendToLogistics = (saleId) => {
    updateSaleStatus(saleId, 'etiqueta_impresa');
  };

  const handleActionClick = (event, sale) => {
    setAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatsCardClick = (filterType, filterValue) => {
    if (filterType === 'logisticsStatus') {
      setFilters(prev => ({
        ...prev,
        logisticsStatus: filterValue ? [filterValue] : []
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: filterValue
      }));
    }
  };

  // Filter sales based on current filters
  const filteredSales = sales.filter(sale => {
    if (filters.shippingType && sale.shippingType !== filters.shippingType) return false;
    if (filters.logisticsStatus.length > 0 && !filters.logisticsStatus.includes(sale.logisticsStatus)) return false;
    if (filters.status && sale.status !== filters.status) return false;
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      return (
        sale.mla?.toLowerCase().includes(searchLower) ||
        sale.sku?.toLowerCase().includes(searchLower) ||
        sale.title?.toLowerCase().includes(searchLower) ||
        sale.customer?.name?.toLowerCase().includes(searchLower) ||
        sale.shippingNumber?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleCreateQuote = (saleId) => {
    // Placeholder for quote creation
    console.log('Creating quote for sale:', saleId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogisticsStatusColor = (status) => {
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

  const columns = [
    {
      field: 'saleNumber',
      headerName: 'N° Venta',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'mla',
      headerName: 'MLA',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'sku',
      headerName: 'SKU',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'title',
      headerName: 'Título',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" title={params.value}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'shippingNumber',
      headerName: 'N° Envío',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customer',
      headerName: 'Cliente',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.customer.name}
        </Typography>
      ),
    },
    {
      field: 'shippingType',
      headerName: 'Tipo Envío',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getShippingTypeColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'logisticsStatus',
      headerName: 'Estado Logística',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={getLogisticsStatusText(params.value)}
          color={getLogisticsStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          ${params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'date',
      headerName: 'Fecha',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleActionClick(e, params.row)}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  // Calculate stats
  const totalSales = sales.length;
  const pendingSales = sales.filter(sale => sale.logisticsStatus === 'pending').length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const deliveredSales = sales.filter(sale => sale.logisticsStatus === 'delivered').length;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📊 Gestión de Ventas
      </Typography>
      
      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              placeholder="MLA, SKU, Título, Cliente..."
              size="small"
            />
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
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                multiple
                value={filters.logisticsStatus}
                onChange={(e) => handleFilterChange('logisticsStatus', e.target.value)}
                input={<OutlinedInput label="Estado" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={getLogisticsStatusText(value)} 
                        size="small"
                        color={getLogisticsStatusColor(value)}
                      />
                    ))}
                  </Box>
                )}
              >
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
              <InputLabel>Estado Venta</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Estado Venta"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Pagado">Pagado</MenuItem>
                <MenuItem value="Entregado">Entregado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => handleStatsCardClick('logisticsStatus', '')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCart color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {filteredSales.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ventas Filtradas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => handleStatsCardClick('logisticsStatus', 'para_preparar')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <LocalShipping color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {filteredSales.filter(sale => sale.logisticsStatus === 'para_preparar').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Para Preparar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => handleStatsCardClick('logisticsStatus', 'etiqueta_impresa')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Print color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {filteredSales.filter(sale => sale.logisticsStatus === 'etiqueta_impresa').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Etiqueta Impresa
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => handleStatsCardClick('logisticsStatus', 'facturada')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Receipt color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {filteredSales.filter(sale => sale.logisticsStatus === 'facturada').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Facturadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales DataGrid */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Ventas ({filteredSales.length} resultados)
          </Typography>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredSales}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => { console.log('Imprimir Etiqueta:', selectedSale?.id); handleActionClose(); }}>
          <Print sx={{ mr: 1 }} />
          Imprimir Etiqueta
        </MenuItem>
        <MenuItem onClick={() => { console.log('Mensajería:', selectedSale?.id); handleActionClose(); }}>
          <Message sx={{ mr: 1 }} />
          Mensajería
        </MenuItem>
        <MenuItem onClick={() => { console.log('Armar Paquete:', selectedSale?.id); handleActionClose(); }}>
          <Inventory sx={{ mr: 1 }} />
          Armar Paquete
        </MenuItem>
        <MenuItem onClick={() => { console.log('Imprimir Recibo:', selectedSale?.id); handleActionClose(); }}>
          <Receipt sx={{ mr: 1 }} />
          Imprimir Recibo
        </MenuItem>
        <MenuItem onClick={() => { console.log('Generar Remito:', selectedSale?.id); handleActionClose(); }}>
          <Description sx={{ mr: 1 }} />
          Generar Remito
        </MenuItem>
        <MenuItem onClick={() => { console.log('Ver Factura:', selectedSale?.id); handleActionClose(); }}>
          <Visibility sx={{ mr: 1 }} />
          Ver Factura
        </MenuItem>
        <MenuItem onClick={() => { console.log('Emitir Nota de Crédito:', selectedSale?.id); handleActionClose(); }}>
          <CreditCard sx={{ mr: 1 }} />
          Emitir Nota de Crédito
        </MenuItem>
        <MenuItem onClick={() => { console.log('Ver Detalle:', selectedSale?.id); handleActionClose(); }}>
          <Visibility sx={{ mr: 1 }} />
          Ver Detalle
        </MenuItem>
        <MenuItem onClick={() => { console.log('Agregar Nota:', selectedSale?.id); handleActionClose(); }}>
          <Note sx={{ mr: 1 }} />
          Agregar Nota
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default GestionVentas;
