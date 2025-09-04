import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  TextField,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Refresh,
  MoreVert,
  Payment,
  Edit,
  Delete,
  Print,
  Description,
  Search,
  FilterList,
} from '@mui/icons-material';
import { apiService } from '../utils/api';

const Presupuestos = () => {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const data = await apiService.getQuotes();
      setQuotes(data);
      setFilteredQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter quotes based on search criteria
  useEffect(() => {
    let filtered = quotes;

    // Text search (cliente, vendedor, ID)
    if (searchText) {
      filtered = filtered.filter(quote => 
        (quote.customer_name && quote.customer_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (quote.seller && quote.seller.toLowerCase().includes(searchText.toLowerCase())) ||
        quote.id.toString().includes(searchText)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(quote => {
        const quoteDate = new Date(quote.created_at).toISOString().split('T')[0];
        return quoteDate === dateFilter;
      });
    }

    // Seller filter
    if (sellerFilter) {
      filtered = filtered.filter(quote => 
        quote.seller && quote.seller.toLowerCase().includes(sellerFilter.toLowerCase())
      );
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(quote => 
        quote.customer_name && quote.customer_name.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchText, dateFilter, sellerFilter, clientFilter]);

  const handleActionClick = (event, quote) => {
    event.stopPropagation();
    setSelectedQuote(quote);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedQuote(null);
  };

  const handleInvoiceQuote = () => {
    if (!selectedQuote) return;
    
    // TODO: Implement API call to convert quote to sale
    console.log('Converting quote to invoice:', selectedQuote.id);
    
    // Update quote status
    setQuotes(quotes.map(quote => 
      quote.id === selectedQuote.id 
        ? { ...quote, status: 'converted' }
        : quote
    ));
    
    handleActionClose();
    alert('Presupuesto convertido a venta exitosamente');
  };

  const handleEditQuote = () => {
    if (!selectedQuote) return;
    
    // TODO: Implement navigation to edit quote in main sale screen
    console.log('Editing quote:', selectedQuote.id);
    handleActionClose();
    alert('Funcionalidad de edición en desarrollo');
  };

  const handleDeleteQuote = () => {
    setConfirmAction('delete');
    setConfirmDialogOpen(true);
    handleActionClose();
  };

  const handlePrintQuote = () => {
    if (!selectedQuote) return;
    
    // TODO: Implement quote printing
    console.log('Printing quote:', selectedQuote.id);
    handleActionClose();
    alert('Imprimiendo presupuesto...');
  };

  const confirmDelete = async () => {
    if (!selectedQuote) return;
    
    try {
      // TODO: Implement API call to delete quote
      console.log('Deleting quote:', selectedQuote.id);
      
      // Remove from list
      const updatedQuotes = quotes.filter(quote => quote.id !== selectedQuote.id);
      setQuotes(updatedQuotes);
      setFilteredQuotes(updatedQuotes);
      
      setConfirmDialogOpen(false);
      setSelectedQuote(null);
      alert('Presupuesto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Error al eliminar el presupuesto');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'converted':
        return 'info';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'converted':
        return 'Convertido';
      case 'expired':
        return 'Vencido';
      default:
        return status;
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'customer_name',
      headerName: 'Cliente',
      flex: 1,
      renderCell: (params) => {
        const customerName = params.row.customer_name || params.row.clientName || 'Sin Cliente';
        const vehicleInfo = params.row.vehicle_info || 
          (params.row.vehicleChasis || params.row.vehicleEngine || params.row.vehiclePlate ? 
            `Chasis: ${params.row.vehicleChasis || 'N/A'}, Motor: ${params.row.vehicleEngine || 'N/A'}, Patente: ${params.row.vehiclePlate || 'N/A'}` : 
            null);
        
        return (
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {customerName}
            </Typography>
            {vehicleInfo && (
              <Typography variant="caption" color="text.secondary">
                🚗 {vehicleInfo}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'seller',
      headerName: 'Vendedor',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'ADMIN'}
        </Typography>
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          ${params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Fecha',
      width: 120,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Typography variant="body2">
            {date.toLocaleDateString()}
          </Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 80,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleActionClick(e, params.row)}
          size="small"
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📋 Presupuestos
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadQuotes}
        >
          Actualizar
        </Button>
      </Box>

      {quotes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No hay presupuestos guardados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los presupuestos guardados desde la pantalla de ventas aparecerán aquí.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          {/* Filtros de búsqueda */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar"
                  placeholder="Cliente, vendedor, ID..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Vendedor"
                  placeholder="Filtrar por vendedor"
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cliente"
                  placeholder="Filtrar por cliente"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                />
              </Grid>
            </Grid>
            {(searchText || dateFilter || sellerFilter || clientFilter) && (
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setSearchText('');
                    setDateFilter('');
                    setSellerFilter('');
                    setClientFilter('');
                  }}
                >
                  Limpiar Filtros
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Presupuestos Guardados
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${filteredQuotes.length} de ${quotes.length} presupuestos`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
          
          <DataGrid
            rows={filteredQuotes}
            columns={columns}
            autoHeight
            loading={loading}
            onRowClick={(params) => {
              setSelectedQuote(params.row);
              setDetailDialogOpen(true);
            }}
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          />
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleInvoiceQuote} disabled={selectedQuote?.status === 'converted'}>
          <Payment sx={{ mr: 1 }} />
          Facturar
        </MenuItem>
        <MenuItem onClick={handleEditQuote} disabled={selectedQuote?.status === 'converted'}>
          <Edit sx={{ mr: 1 }} />
          Actualizar
        </MenuItem>
        <MenuItem onClick={handlePrintQuote}>
          <Print sx={{ mr: 1 }} />
          Re-imprimir
        </MenuItem>
        <MenuItem onClick={handleDeleteQuote} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Borrar
        </MenuItem>
      </Menu>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            ¿Está seguro que desea eliminar este presupuesto? Esta acción no se puede deshacer.
          </Alert>
          {selectedQuote && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Presupuesto:</strong> #{selectedQuote.id}
              </Typography>
              <Typography variant="body2">
                <strong>Cliente:</strong> {selectedQuote.customer_name || 'Sin Cliente'}
              </Typography>
              <Typography variant="body2">
                <strong>Total:</strong> ${selectedQuote.total.toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            Detalle de Presupuesto #{selectedQuote?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedQuote && (
            <Box>
              {/* Información General */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📋 Información General
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">ID de Presupuesto:</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedQuote.id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Cliente:</Typography>
                    <Typography variant="body1">{selectedQuote.customer_name || selectedQuote.clientName || 'Sin Cliente'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">{selectedQuote.customer_email || selectedQuote.clientEmail || 'No especificado'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Teléfono:</Typography>
                    <Typography variant="body1">{selectedQuote.customer_phone || selectedQuote.clientPhone || 'No especificado'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Vendedor:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">{selectedQuote.seller || 'ADMIN'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Fecha:</Typography>
                    <Typography variant="body1">{new Date(selectedQuote.created_at).toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Información del Vehículo */}
              {(selectedQuote.vehicleChasis || selectedQuote.vehicleEngine || selectedQuote.vehiclePlate) && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    🚗 Información del Vehículo
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Chasis:</Typography>
                      <Typography variant="body1">{selectedQuote.vehicleChasis || 'No especificado'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Motor:</Typography>
                      <Typography variant="body1">{selectedQuote.vehicleEngine || 'No especificado'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Patente:</Typography>
                      <Typography variant="body1">{selectedQuote.vehiclePlate || 'No especificado'}</Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Artículos */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  🛒 Artículos del Presupuesto
                </Typography>
                {selectedQuote.quote_items && selectedQuote.quote_items.length > 0 ? (
                  <List>
                    {selectedQuote.quote_items.map((item, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="bold">
                                  {item.product?.name || item.name || `Producto ID: ${item.product_id}`}
                                </Typography>
                                <Typography variant="h6" color="primary">
                                  ${((item.quantity || 1) * (item.unit_price || item.price || 0)).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Cantidad: {item.quantity || 1} × ${(item.unit_price || item.price || 0).toLocaleString()} c/u
                                </Typography>
                                {(item.product?.brand || item.brand) && (
                                  <Typography variant="caption" color="text.secondary">
                                    Marca: {item.product?.brand || item.brand} | Código: {item.product?.internal_code || item.internal_code}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < selectedQuote.quote_items.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay información detallada de artículos disponible
                  </Typography>
                )}
              </Paper>

              {/* Totales */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  💰 Resumen de Totales
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">${selectedQuote.subtotal?.toLocaleString() || '0'}</Typography>
                  
                  <Typography variant="body1">Descuento:</Typography>
                  <Typography variant="body1" color="error">-${selectedQuote.discount_amount?.toLocaleString() || '0'}</Typography>
                  
                  <Typography variant="body1">Impuestos:</Typography>
                  <Typography variant="body1">${selectedQuote.tax_amount?.toLocaleString() || '0'}</Typography>
                  
                  <Divider sx={{ gridColumn: '1 / -1', my: 1 }} />
                  
                  <Typography variant="h6" fontWeight="bold">TOTAL:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${selectedQuote.total?.toLocaleString() || '0'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
          <Button 
            onClick={() => {
              setDetailDialogOpen(false);
              setSelectedQuote(selectedQuote);
              setActionMenuAnchor(null); // This will trigger the action menu
            }}
            variant="contained"
            color="primary"
            startIcon={<Payment />}
          >
            Acciones
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Presupuestos;
