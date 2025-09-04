import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Card,
  CardContent,
  Slider,
  Tooltip,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Refresh,
  Link,
  Edit,
  ExpandMore,
  ExpandLess,
  Launch,
  Calculate,
  Settings,
  Add,
  Delete,
  Save,
  Inventory
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { realPublications, defaultCalculationPercentages } from '../../data/realPublications';

const MisPublicaciones = () => {
  const [publications, setPublications] = useState(realPublications);
  const [filteredPublications, setFilteredPublications] = useState(realPublications);
  const [filters, setFilters] = useState({
    internalCode: '',
    mlaCode: '',
    title: '',
    publicationType: '',
    status: '',
  });
  const [selectedPublications, setSelectedPublications] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [selectedComboItems, setSelectedComboItems] = useState([]);
  const [priceCalculation, setPriceCalculation] = useState({
    cost: 0,
    finalPrice: 0,
  });
  const [percentages, setPercentages] = useState(defaultCalculationPercentages);
  
  // Configuraciones adicionales
  const [shippingConfig] = useState({
    cost: 7500,
    freeShippingThreshold: 50000
  });
  const [fixedCosts] = useState([
    { id: 1, name: 'Embalaje', cost: 500, enabled: true },
  ]);
  const [mlFixedCosts] = useState([
    { id: 1, minPrice: 0, maxPrice: 15000, cost: 2500 },
    { id: 2, minPrice: 15000, maxPrice: 33000, cost: 1000 },
  ]);

  // Filtrar publicaciones
  useEffect(() => {
    let filtered = publications.filter(pub => {
      return (
        (filters.internalCode === '' || pub.internalCode.toLowerCase().includes(filters.internalCode.toLowerCase())) &&
        (filters.mlaCode === '' || pub.mlaCode.toLowerCase().includes(filters.mlaCode.toLowerCase())) &&
        (filters.title === '' || pub.title.toLowerCase().includes(filters.title.toLowerCase())) &&
        (filters.publicationType === '' || pub.publicationType === filters.publicationType) &&
        (filters.status === '' || pub.status === filters.status)
      );
    });
    setFilteredPublications(filtered);
  }, [filters, publications]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = () => {
    console.log('Refrescando publicaciones...');
    // Aquí iría la lógica para refrescar desde la API
  };

  const handleInternalCodeClick = (code) => {
    setFilters(prev => ({ ...prev, internalCode: code }));
  };

  const handleMLACodeClick = (mlaCode) => {
    window.open(`https://articulo.mercadolibre.com.ar/${mlaCode}`, '_blank');
  };

  const handleEditPublication = (publication) => {
    setSelectedPublication(publication);
    setPriceCalculation({
      cost: publication.netPrice || 0,
      finalPrice: publication.regularPrice || 0,
    });
    setEditModalOpen(true);
  };

  const calculatePrice = () => {
    let totalPercentage = 0;
    let totalFixedCosts = 0;
    
    // Comisión ML basada en tipo de publicación
    const mlCommission = selectedPublication?.publicationType === 'Premium' ? 36 : 14;
    
    // Calcular precio base con porcentajes
    percentages.forEach(p => {
      if (p.enabled) {
        if (p.name === 'Comisión ML') {
          totalPercentage += mlCommission;
        } else if (p.name !== 'Envío') {
          totalPercentage += p.percentage;
        }
      }
    });
    
    let priceWithPercentages = priceCalculation.cost * (1 + totalPercentage / 100);
    
    // Agregar costos fijos habilitados (embalaje, etc.)
    fixedCosts.forEach(fc => {
      if (fc.enabled) {
        totalFixedCosts += fc.cost;
      }
    });
    
    // Determinar costo fijo de ML según rango de precio
    let mlFixedCost = 0;
    for (const range of mlFixedCosts) {
      if (priceWithPercentages >= range.minPrice && priceWithPercentages < range.maxPrice) {
        mlFixedCost = range.cost;
        break;
      }
    }
    totalFixedCosts += mlFixedCost;
    
    // Agregar envío solo si el precio final no supera el umbral de envío gratis
    let shippingCost = 0;
    const preliminaryPrice = priceWithPercentages + totalFixedCosts;
    if (preliminaryPrice < shippingConfig.freeShippingThreshold) {
      shippingCost = shippingConfig.cost;
    }
    
    const finalPrice = priceWithPercentages + totalFixedCosts + shippingCost;
    setPriceCalculation(prev => ({ ...prev, finalPrice }));
  };

  React.useEffect(() => {
    if (editModalOpen) {
      calculatePrice();
    }
  }, [percentages, priceCalculation.cost, editModalOpen, selectedPublication]);

  const handleVincularMasivamente = () => {
    console.log('Vinculando masivamente:', selectedPublications);
    // Aquí iría la lógica para vincular masivamente
  };

  const handleShowComboItems = (comboItems, publicationTitle) => {
    // Generar artículos de prueba más realistas
    const testArticles = comboItems.map((item, index) => ({
      id: `art-${index + 1}`,
      codigo: item.code,
      titulo: item.name,
      marca: 'BOXER',
      cantidad: item.quantity,
      stock: Math.floor(Math.random() * 50) + 5,
      precio: Math.floor(Math.random() * 15000) + 5000,
      ubicacion: `Estante ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 20) + 1}`
    }));
    
    setSelectedComboItems({
      title: publicationTitle,
      items: testArticles
    });
    setComboModalOpen(true);
  };

  const columns = [
    {
      field: 'select',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedPublications.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedPublications([...selectedPublications, params.row.id]);
            } else {
              setSelectedPublications(selectedPublications.filter(id => id !== params.row.id));
            }
          }}
        />
      ),
    },
    {
      field: 'imageUrl',
      headerName: 'Imagen',
      width: 80,
      renderCell: (params) => (
        <Avatar
          src={params.row.imageUrl}
          sx={{ width: 50, height: 50 }}
          variant="rounded"
        />
      ),
    },
    {
      field: 'internalCode',
      headerName: 'Código Interno',
      width: 120,
      renderCell: (params) => (
        <Button
          variant="text"
          color="primary"
          onClick={() => handleInternalCodeClick(params.row.internalCode)}
          sx={{ textTransform: 'none' }}
        >
          {params.row.internalCode}
        </Button>
      ),
    },
    {
      field: 'mlaInfo',
      headerName: 'MLA / Título',
      width: 300,
      renderCell: (params) => (
        <Box>
          <Button
            variant="text"
            color="primary"
            onClick={() => handleMLACodeClick(params.row.mlaCode)}
            startIcon={<Launch />}
            sx={{ textTransform: 'none', mb: 0.5 }}
          >
            {params.row.mlaCode}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {params.row.title}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'brand',
      headerName: 'Marca',
      width: 100,
    },
    {
      field: 'prices',
      headerName: 'Precios',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">
            <strong>Regular:</strong> ${params.row.regularPrice?.toLocaleString() || '0'}
          </Typography>
          {params.row.offerPrice && (
            <Typography variant="body2" color="error">
              <strong>Oferta:</strong> ${params.row.offerPrice.toLocaleString()}
            </Typography>
          )}
          <Typography variant="body2" color="success.main">
            <strong>Sugerido:</strong> ${params.row.suggestedPrice?.toLocaleString() || '0'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'publicationType',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Chip
            label={params.row.publicationType}
            color={params.row.publicationType === 'Premium' ? 'primary' : 'default'}
            size="small"
          />
          {params.row.quota && (
            <Typography variant="caption" display="block">
              {params.row.quota}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.row.stock}
          color={params.row.stock > 10 ? 'success' : params.row.stock > 0 ? 'warning' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          color={params.row.status === 'Activa' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'combo',
      headerName: 'Combo',
      width: 100,
      renderCell: (params) => (
        params.row.isCombo ? (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleShowComboItems(params.row.comboItems, params.row.title)}
          >
            Ver Items
          </Button>
        ) : null
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={() => handleEditPublication(params.row)}
        >
          <Edit />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
          <Inventory />
          Mis Publicaciones de MercadoLibre
        </Typography>

        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Código Interno"
              value={filters.internalCode}
              onChange={(e) => handleFilterChange('internalCode', e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Código MLA"
              value={filters.mlaCode}
              onChange={(e) => handleFilterChange('mlaCode', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Título"
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo Publicación</InputLabel>
              <Select
                value={filters.publicationType}
                onChange={(e) => handleFilterChange('publicationType', e.target.value)}
                label="Tipo Publicación"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Clásica">Clásica</MenuItem>
                <MenuItem value="Premium">Premium</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Activa">Activa</MenuItem>
                <MenuItem value="Pausada">Pausada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
      </Grid>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Link />}
          onClick={handleVincularMasivamente}
          disabled={selectedPublications.length === 0}
        >
          Vincular Masivamente ({selectedPublications.length})
        </Button>
      </Box>
    </Paper>

    {/* Tabla de publicaciones */}
    <Paper sx={{ height: 600 }}>
      <DataGrid
        rows={filteredPublications}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        checkboxSelection={false}
        disableSelectionOnClick
        sx={{
          '& .MuiDataGrid-row': {
            minHeight: '80px !important',
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          }
        }}
      />
    </Paper>

    {/* Modal de Edición */}
    <Dialog
      open={editModalOpen}
      onClose={() => setEditModalOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Editar Publicación - {selectedPublication?.mlaCode}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {selectedPublication && (
          <Grid container spacing={2}>
            {/* Información básica - Más compacta */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Avatar
                  src={selectedPublication.imageUrl}
                  sx={{ width: 80, height: 80 }}
                  variant="rounded"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedPublication.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Código Interno:</strong> {selectedPublication.internalCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>MLA:</strong> {selectedPublication.mlaCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Marca:</strong> {selectedPublication.brand}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Tipo:</strong> {selectedPublication.publicationType}
                    </Typography>
                    {selectedPublication.quota && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Cuotas:</strong> {selectedPublication.quota}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>Es Combo:</strong> {selectedPublication.isCombo ? 'Sí' : 'No'}
                    </Typography>
                  </Box>
                  
                  {/* Variantes en línea */}
                  {selectedPublication.variants && selectedPublication.variants.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Variantes:</strong> {selectedPublication.variants.map(v => `${v.attribute}: ${v.value}`).join(', ')}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Botón de estado en la esquina */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedPublication.ignoreStock}
                        onChange={(e) => {
                          setSelectedPublication({
                            ...selectedPublication,
                            ignoreStock: e.target.checked
                          });
                        }}
                        size="small"
                      />
                    }
                    label="Ignorar stock"
                    sx={{ m: 0 }}
                  />
                  <Button
                    variant={selectedPublication.status === 'Activa' ? 'outlined' : 'contained'}
                    color={selectedPublication.status === 'Activa' ? 'warning' : 'success'}
                    size="small"
                    onClick={() => {
                      const newStatus = selectedPublication.status === 'Activa' ? 'Pausada' : 'Activa';
                      setSelectedPublication({
                        ...selectedPublication,
                        status: newStatus
                      });
                      console.log('Cambiando estado a:', newStatus);
                    }}
                  >
                    {selectedPublication.status === 'Activa' ? 'Pausar' : 'Activar'}
                  </Button>
                </Box>
              </Box>
            </Grid>


            {/* Calculadora de precios integrada */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calculate />
                  Calculadora de Precios
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Costo Base"
                      type="number"
                      value={priceCalculation.cost.toFixed(2)}
                      onChange={(e) => setPriceCalculation({
                        ...priceCalculation,
                        cost: parseFloat(e.target.value) || 0
                      })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Precio Final Calculado"
                      type="number"
                      value={priceCalculation.finalPrice.toFixed(2)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        readOnly: true,
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontWeight: 'bold',
                          color: 'primary.main'
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" gutterBottom>
                  Costos Aplicados:
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {/* Porcentajes */}
                  {percentages.filter(p => p.enabled && p.name !== 'Envío').map((percentage) => {
                    let displayValue = '';
                    if (percentage.name === 'Comisión ML') {
                      const mlCommission = selectedPublication?.publicationType === 'Premium' ? 36 : 14;
                      displayValue = `${percentage.name}: +${mlCommission}%`;
                    } else {
                      displayValue = `${percentage.name}: +${percentage.percentage}%`;
                    }
                    
                    return (
                      <Chip
                        key={percentage.id}
                        label={displayValue}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    );
                  })}
                  
                  {/* Costos fijos habilitados */}
                  {fixedCosts.filter(fc => fc.enabled).map((cost) => (
                    <Chip
                      key={`fixed-${cost.id}`}
                      label={`${cost.name}: +$${cost.cost}`}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                  
                  {/* Costo fijo ML */}
                  {(() => {
                    const priceWithPercentages = priceCalculation.cost * (1 + percentages.filter(p => p.enabled && p.name !== 'Envío').reduce((acc, p) => {
                      if (p.name === 'Comisión ML') {
                        return acc + (selectedPublication?.publicationType === 'Premium' ? 36 : 14);
                      }
                      return acc + p.percentage;
                    }, 0) / 100);
                    
                    const mlRange = mlFixedCosts.find(range => 
                      priceWithPercentages >= range.minPrice && priceWithPercentages < range.maxPrice
                    );
                    
                    return mlRange ? (
                      <Chip
                        label={`ML Fijo: +$${mlRange.cost}`}
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    ) : null;
                  })()}
                  
                  {/* Envío (solo si aplica) */}
                  {(() => {
                    const preliminaryPrice = priceCalculation.finalPrice - (priceCalculation.finalPrice < shippingConfig.freeShippingThreshold ? shippingConfig.cost : 0);
                    return preliminaryPrice < shippingConfig.freeShippingThreshold ? (
                      <Chip
                        label={`Envío: +$${shippingConfig.cost}`}
                        color="info"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="Envío Gratis"
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    );
                  })()}
                </Box>

                <Button
                  variant="contained"
                  onClick={calculatePrice}
                  startIcon={<Calculate />}
                  sx={{ mr: 2 }}
                >
                  Recalcular
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedPublication({
                      ...selectedPublication,
                      regularPrice: priceCalculation.finalPrice
                    });
                  }}
                >
                  Aplicar al Precio Regular
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditModalOpen(false)}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={() => {
          console.log('Guardando publicación:', selectedPublication);
          setEditModalOpen(false);
        }}>
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>

      {/* Modal de Combo Items */}
      <Dialog
        open={comboModalOpen}
        onClose={() => setComboModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            📦 Artículos del Combo: {selectedComboItems.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Título</strong></TableCell>
                  <TableCell><strong>Marca</strong></TableCell>
                  <TableCell align="center"><strong>Cantidad</strong></TableCell>
                  <TableCell align="center"><strong>Stock</strong></TableCell>
                  <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                  <TableCell><strong>Ubicación</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedComboItems.items?.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                        {item.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.titulo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.marca} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={item.cantidad} size="small" color="info" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={item.stock} 
                        size="small" 
                        color={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'error'} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ${item.precio.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.ubicacion}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComboModalOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default MisPublicaciones;
