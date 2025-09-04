import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Paper,
  Avatar,
  IconButton,
  Menu,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  Alert,
  Collapse,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Dashboard,
  FilterList,
  MoreVert,
  Print,
  LocalShipping,
  Assignment,
  CheckCircle,
  RadioButtonUnchecked,
  Timeline,
  Visibility,
  Note,
  Receipt,
  Inventory,
  Send,
  CheckBox,
  Schedule,
  ExpandMore,
  ExpandLess,
  DateRange,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useMercadoLibreContext } from '../MercadoLibreContainer';
import CascadingFilters from '../../components/CascadingFilters';

const VentasUnificadas = () => {
  const { sales, updateSaleStatus } = useMercadoLibreContext();
  const [filters, setFilters] = useState({
    logisticsStatus: [],
    shippingType: [],
    saleStatus: [],
    searchText: '',
    dateFrom: '',
    dateTo: '',
    stores: ['MercadoLibre', 'TiendaNube', 'Local'] // All stores selected by default
  });
  const [cascadingFilters, setCascadingFilters] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteBar, setShowNoteBar] = useState(false);
  const noteBarRef = useRef(null);
  const [showArmarModal, setShowArmarModal] = useState(false);
  const [selectedSaleForArmar, setSelectedSaleForArmar] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [scannedItems, setScannedItems] = useState([]);

  // Test courier configurations
  const couriers = [
    { id: 'mensajeria1', name: 'Mensajería Express', color: '#2196f3' },
    { id: 'mensajeria2', name: 'Correo Argentino', color: '#ff9800' }
  ];

  // Auto-save note when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (noteBarRef.current && !noteBarRef.current.contains(event.target)) {
        if (showNoteBar && noteText.trim()) {
          // Save note logic here (could be localStorage, API call, etc.)
          localStorage.setItem('salesNote', noteText);
          console.log('Note saved:', noteText);
        }
        setShowNoteBar(false);
      }
    };

    if (showNoteBar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNoteBar, noteText]);

  // Load saved note on component mount
  useEffect(() => {
    const savedNote = localStorage.getItem('salesNote');
    if (savedNote) {
      setNoteText(savedNote);
    }
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArmarClick = (sale) => {
    setSelectedSaleForArmar(sale);
    setScannedItems([]);
    setSearchCode('');
    setShowArmarModal(true);
  };

  const handleArmarModalClose = () => {
    setShowArmarModal(false);
    setSelectedSaleForArmar(null);
    setScannedItems([]);
    setSearchCode('');
  };

  const handleCodeScan = (e) => {
    if (e.key === 'Enter' && searchCode.trim()) {
      const item = selectedSaleForArmar?.items[0];
      if (item && (searchCode === item.sku || searchCode === item.originalCode)) {
        if (!scannedItems.includes(item.sku)) {
          setScannedItems([...scannedItems, item.sku]);
        }
      }
      setSearchCode('');
    }
  };

  const handleArmarComplete = () => {
    if (selectedSaleForArmar && scannedItems.length === selectedSaleForArmar.items.length) {
      updateSaleStatus(selectedSaleForArmar.id, 'controlada');
      console.log('Paquete armado y controlado para venta:', selectedSaleForArmar.saleNumber);
      handleArmarModalClose();
    }
  };

  const isItemScanned = (sku) => scannedItems.includes(sku);
  const allItemsScanned = selectedSaleForArmar ? scannedItems.length === selectedSaleForArmar.items.length : false;

  const handleCascadingFiltersChange = (newCascadingFilters) => {
    setCascadingFilters(newCascadingFilters);
  };

  const handleActionClick = (event, sale) => {
    setAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  const handleStatusUpdate = (saleId, newStatus) => {
    updateSaleStatus(saleId, newStatus);
  };

  // Bulk actions handlers
  const handleSelectSale = (saleId, isSelected) => {
    if (isSelected) {
      setSelectedSales(prev => [...prev, saleId]);
    } else {
      setSelectedSales(prev => prev.filter(id => id !== saleId));
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSales([]);
    } else {
      setSelectedSales(filteredSales.map(sale => sale.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkPrintLabels = () => {
    console.log('Printing labels for sales:', selectedSales);
    // Implementation for bulk label printing
  };

  const handleBulkAssignCourier = (courierId) => {
    console.log('Assigning courier', courierId, 'to sales:', selectedSales);
    // Implementation for bulk courier assignment
  };

  const handleStoreToggle = (store) => {
    setFilters(prev => ({
      ...prev,
      stores: prev.stores.includes(store) 
        ? prev.stores.filter(s => s !== store)
        : [...prev.stores, store]
    }));
  };

  // Map cascading filters to sale properties
  const mapCascadingFiltersToSale = (sale, cascadingFilters) => {
    // Map nivel1 (Estado Principal) to sale status
    if (cascadingFilters.nivel1?.length > 0) {
      const saleStateMap = {
        'para_preparar': 'A_ENVIAR',
        'etiqueta_impresa': 'A_ENVIAR',
        'controlada': 'A_ENVIAR',
        'lista_para_enviar': 'A_ENVIAR',
        'facturada': 'ENVIADO',
        'en_camino': 'ENVIADO',
        'entregada': 'ENTREGADO'
      };
      const mappedState = saleStateMap[sale.logisticsStatus];
      if (!cascadingFilters.nivel1.includes(mappedState)) return false;
    }

    // Map nivel2 (Tipo de Envío) to shipping type
    if (cascadingFilters.nivel2?.length > 0) {
      const shippingTypeMap = {
        'Flex': 'FLEX',
        'Colecta': 'COLECTA',
        'Turbo': 'TURBO',
        'Full': 'FULL',
        'A convenir': 'A_COORDINAR'
      };
      const mappedShipping = shippingTypeMap[sale.shippingType];
      if (!cascadingFilters.nivel2.includes(mappedShipping)) return false;
    }

    // For now, other levels (3-8) are not mapped to existing sale data
    // They would be used when we have more detailed logistics tracking

    return true;
  };

  // Filter sales based on current filters and cascading filters
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Apply traditional filters
      if (filters.logisticsStatus.length > 0 && !filters.logisticsStatus.includes(sale.logisticsStatus)) return false;
      if (filters.shippingType.length > 0 && !filters.shippingType.includes(sale.shippingType)) return false;
      if (filters.saleStatus.length > 0 && !filters.saleStatus.includes(sale.status)) return false;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch = (
          sale.mla?.toLowerCase().includes(searchLower) ||
          sale.sku?.toLowerCase().includes(searchLower) ||
          sale.title?.toLowerCase().includes(searchLower) ||
          sale.customer?.name?.toLowerCase().includes(searchLower) ||
          sale.shippingNumber?.toLowerCase().includes(searchLower) ||
          sale.saleNumber?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Apply date filters
      if (filters.dateFrom || filters.dateTo) {
        const saleDate = new Date(sale.date);
        if (filters.dateFrom && saleDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && saleDate > new Date(filters.dateTo + 'T23:59:59')) return false;
      }

      // Apply store filter
      if (filters.stores.length > 0 && !filters.stores.includes(sale.store)) return false;

      // Apply cascading filters
      if (Object.values(cascadingFilters).some(level => level.length > 0)) {
        return mapCascadingFiltersToSale(sale, cascadingFilters);
      }

      return true;
    });
  }, [sales, filters, cascadingFilters]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredSales.length;
    const byLogisticsStatus = {};
    const byShippingType = {};
    const bySaleStatus = {};

    filteredSales.forEach(sale => {
      byLogisticsStatus[sale.logisticsStatus] = (byLogisticsStatus[sale.logisticsStatus] || 0) + 1;
      byShippingType[sale.shippingType] = (byShippingType[sale.shippingType] || 0) + 1;
      bySaleStatus[sale.status] = (bySaleStatus[sale.status] || 0) + 1;
    });

    return { total, byLogisticsStatus, byShippingType, bySaleStatus };
  }, [filteredSales]);

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

  const getStatusText = (status) => {
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

  const getStatusProgress = (status) => {
    const statusOrder = ['para_preparar', 'etiqueta_impresa', 'controlada', 'lista_para_enviar', 'facturada', 'entregada'];
    const currentIndex = statusOrder.indexOf(status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const getNextActions = (status) => {
    switch (status) {
      case 'para_preparar': return ['Imprimir Etiqueta', 'Armar Paquete'];
      case 'etiqueta_impresa': return ['Mensajería', 'Controlar'];
      case 'controlada': return ['Lista para Enviar', 'Generar Remito'];
      case 'lista_para_enviar': return ['Facturar', 'Enviar'];
      case 'facturada': return ['Marcar Entregada'];
      case 'entregada': return ['Ver Factura'];
      default: return [];
    }
  };

  const getCompletedSteps = (status) => {
    const allSteps = ['Preparar', 'Etiquetar', 'Controlar', 'Listar', 'Facturar', 'Entregar'];
    const statusMap = {
      'para_preparar': [],
      'etiqueta_impresa': ['Preparar'],
      'controlada': ['Preparar', 'Etiquetar'],
      'lista_para_enviar': ['Preparar', 'Etiquetar', 'Controlar'],
      'facturada': ['Preparar', 'Etiquetar', 'Controlar', 'Listar'],
      'entregada': ['Preparar', 'Etiquetar', 'Controlar', 'Listar', 'Facturar']
    };
    return statusMap[status] || [];
  };

  const columns = [
    {
      field: 'saleOverview',
      headerName: 'Información Completa de Venta',
      flex: 1,
      minWidth: 1000,
      renderCell: (params) => {
        const sale = params.row;
        const mainItem = sale.items[0];
        const isKit = sale.items.length > 1 || mainItem?.category === 'KIT';
        const isGrouped = mainItem?.category === 'REPUESTO_AGRUPADO';
        const isSelected = selectedSales.includes(params.row.id);
        
        const currentStep = sale.logisticsStatus;
        const stepColors = {
          'para_preparar': '#ff9800',
          'etiqueta_impresa': '#2196f3', 
          'controlada': '#9c27b0',
          'lista_para_enviar': '#673ab7',
          'facturada': '#4caf50',
          'entregada': '#8bc34a'
        };
        
        return (
          <Box sx={{ 
            display: 'flex', 
            width: '100%', 
            gap: 2, 
            p: 2, 
            backgroundColor: '#ffffff',
            borderRadius: 2,
            border: `3px solid ${stepColors[currentStep] || '#e0e0e0'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 1
          }}>
            
            {/* Selection Checkbox + LEFT: Product & Sale Info */}
            <Box sx={{ flex: 2, minWidth: 320, pr: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                {/* Selection Checkbox */}
                <IconButton
                  size="small"
                  onClick={() => handleSelectSale(params.row.id, !isSelected)}
                  color={isSelected ? 'primary' : 'default'}
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                >
                  {isSelected ? <CheckCircle /> : <RadioButtonUnchecked />}
                </IconButton>
                
                <Avatar
                  src={mainItem?.imageUrl}
                  sx={{ width: 80, height: 80 }}
                  variant="rounded"
                >
                  📦
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 0.3 }}>
                    {sale.saleNumber}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mb: 0.8 }}>
                    {sale.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, mb: 0.5 }}>
                    <Chip label={sale.store} color="primary" size="small" />
                    {isKit && <Chip label="KIT" color="warning" size="small" />}
                    {isGrouped && <Chip label="AGRUPADO" color="info" size="small" />}
                  </Box>
                </Box>
              </Box>
              
              {/* Product Details */}
              <Box sx={{ backgroundColor: '#f8f9fa', p: 1.2, borderRadius: 1.5, mb: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>MLA:</strong> {sale.mla}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>SKU:</strong> {sale.sku}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Marca:</strong> {mainItem?.brand || 'Sin marca'}
                </Typography>
                <Typography variant="subtitle1" color="success.main" fontWeight="bold">
                  <strong>Total: ${sale.total.toLocaleString('es-AR')}</strong>
                </Typography>
              </Box>
              
              {/* Kit Components */}
              {sale.items.length > 1 && (
                <Box sx={{ backgroundColor: '#fff3e0', p: 1.2, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.8 }}>
                    📦 Componentes del Kit ({sale.items.length}):
                  </Typography>
                  {sale.items.slice(0, 4).map((item, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.3 }}>
                      • {item.title} <strong>({item.quantity}x)</strong> - {item.brand || 'Sin marca'}
                    </Typography>
                  ))}
                  {sale.items.length > 4 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      ... y {sale.items.length - 4} componentes más
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            
            {/* CENTER: Customer & Shipping */}
            <Box sx={{ flex: 1.5, minWidth: 280, px: 1.5 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>
                👤 Cliente y Envío
              </Typography>
              
              <Box sx={{ backgroundColor: '#f0f4ff', p: 1.2, borderRadius: 1.5, mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.8 }}>
                  {sale.customer.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  📍 {sale.customer.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📅 {new Date(sale.date).toLocaleDateString('es-AR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </Typography>
              </Box>
              
              <Box sx={{ backgroundColor: '#e8f5e8', p: 1.2, borderRadius: 1.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.8 }}>
                  🚚 Información de Envío:
                </Typography>
                <Box sx={{ mb: 0.8 }}>
                  <Chip
                    label={sale.shippingType}
                    color={getShippingTypeColor(sale.shippingType)}
                    size="small"
                    variant="filled"
                  />
                </Box>
                <Typography variant="body2">
                  <strong>N° Seguimiento:</strong> {sale.shippingNumber}
                </Typography>
              </Box>
            </Box>
            
            {/* RIGHT: Status & Actions */}
            <Box sx={{ flex: 2, minWidth: 320, pl: 1.5 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>
                📊 Estado y Acciones
              </Typography>
              
              {/* Current Status - Compact */}
              <Box sx={{ 
                backgroundColor: stepColors[currentStep] || '#e0e0e0', 
                color: 'white', 
                p: 1, 
                borderRadius: 1.5, 
                mb: 1,
                textAlign: 'center'
              }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {getStatusText(currentStep)}
                </Typography>
              </Box>
              
              {/* Progress Steps - Horizontal */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                  Progreso:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {[
                    { key: 'para_preparar', label: 'Preparar', icon: '📋' },
                    { key: 'etiqueta_impresa', label: 'Etiqueta', icon: '🏷️' },
                    { key: 'controlada', label: 'Control', icon: '✅' },
                    { key: 'lista_para_enviar', label: 'Envío', icon: '📦' },
                    { key: 'facturada', label: 'Factura', icon: '🧾' },
                    { key: 'entregada', label: 'Entrega', icon: '🎉' }
                  ].map((step, idx) => {
                    const isCompleted = getStatusProgress(currentStep) > (idx * 16.67);
                    const isCurrent = step.key === currentStep;
                    
                    return (
                      <Chip
                        key={step.key}
                        label={step.label}
                        size="small"
                        icon={<span style={{ fontSize: '0.8rem' }}>
                          {isCompleted ? '✅' : isCurrent ? '🔄' : step.icon}
                        </span>}
                        color={isCompleted ? 'success' : isCurrent ? 'primary' : 'default'}
                        variant={isCurrent ? 'filled' : 'outlined'}
                      />
                    );
                  })}
                </Box>
              </Box>
              
              {/* Quick Actions - Grid Layout */}
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                  Acciones:
                </Typography>
                
                {/* Primary Actions */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mb: 1 }}>
                  {currentStep === 'para_preparar' && (
                    <>
                      <Button variant="contained" color="primary" size="small" startIcon={<Print />}>
                        Etiqueta
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        size="small" 
                        startIcon={<Inventory />}
                        onClick={() => handleArmarClick(sale)}
                      >
                        Armar
                      </Button>
                    </>
                  )}
                  {currentStep === 'etiqueta_impresa' && (
                    <>
                      <Button variant="contained" color="warning" size="small" startIcon={<CheckBox />}>
                        Controlar
                      </Button>
                      <Button variant="outlined" color="primary" size="small" startIcon={<LocalShipping />}>
                        Mensajería
                      </Button>
                    </>
                  )}
                  {(currentStep === 'controlada' || currentStep === 'lista_para_enviar') && (
                    <>
                      <Button variant="contained" color="success" size="small" startIcon={<Receipt />}>
                        Facturar
                      </Button>
                      <Button variant="outlined" color="primary" size="small" startIcon={<Send />}>
                        Enviar
                      </Button>
                    </>
                  )}
                  {currentStep === 'facturada' && (
                    <>
                      <Button variant="contained" color="info" size="small" startIcon={<Send />}>
                        Marcar Enviado
                      </Button>
                      <Button variant="outlined" color="primary" size="small" startIcon={<LocalShipping />}>
                        Seguimiento
                      </Button>
                    </>
                  )}
                  {currentStep === 'entregada' && (
                    <>
                      <Button variant="contained" color="success" size="small" startIcon={<CheckBox />}>
                        Completada
                      </Button>
                      <Button variant="outlined" color="primary" size="small" startIcon={<Receipt />}>
                        Ver Factura
                      </Button>
                    </>
                  )}
                </Box>
                
                {/* Secondary Actions Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, mb: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<Visibility />}>
                    Ver
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<Note />}>
                    Nota
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<Print />}>
                    Print
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<MoreVert />}>
                    Más
                  </Button>
                </Box>
                
              </Box>
            </Box>
          </Box>
        );
      }
    }
  ];

  return (
    <Box>

      {/* Unified Filters Section */}
      <Paper sx={{ p: 2, mb: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
        {/* Header */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mb: 2 }}>
          <Dashboard />
          Filtros y Gestión de Ventas
        </Typography>

        {/* Row 1: Store Filters */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 'fit-content' }}>
                Tiendas:
              </Typography>
              {['MercadoLibre', 'TiendaNube', 'Local'].map((store) => (
                <Chip
                  key={store}
                  label={`${store} (${sales.filter(s => s.store === store).length})`}
                  onClick={() => handleStoreToggle(store)}
                  color={filters.stores.includes(store) ? 'primary' : 'default'}
                  variant={filters.stores.includes(store) ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: filters.stores.includes(store) ? 'primary.dark' : 'grey.100'
                    }
                  }}
                />
              ))}
              <Button
                size="small"
                variant="text"
                onClick={() => handleFilterChange('stores', ['MercadoLibre', 'TiendaNube', 'Local'])}
                sx={{ fontSize: '0.75rem' }}
              >
                Todas
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
              <strong>{filteredSales.length}</strong> ventas encontradas
            </Typography>
          </Grid>
        </Grid>

        {/* Row 2: Cascading Filters */}
        <Box sx={{ mb: 2 }}>
          <CascadingFilters 
            onFiltersChange={handleCascadingFiltersChange}
            initialFilters={cascadingFilters}
            salesData={sales.filter(sale => filters.stores.includes(sale.store))}
          />
        </Box>

        {/* Row 3: Search and Advanced Filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Búsqueda Rápida"
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              placeholder="N° Venta, MLA, SKU, Cliente..."
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              endIcon={showAdvancedFilters ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              size="small"
            >
              Filtros Adicionales
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions Section */}
      {selectedSales.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd', border: '2px solid #2196f3' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
            📦 Acciones Masivas ({selectedSales.length} seleccionadas)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<Print />}
                onClick={handleBulkPrintLabels}
                size="small"
              >
                Imprimir Etiquetas
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Asignar Mensajería</InputLabel>
                <Select
                  label="Asignar Mensajería"
                  onChange={(e) => handleBulkAssignCourier(e.target.value)}
                  defaultValue=""
                >
                  {couriers.map(courier => (
                    <MenuItem key={courier.id} value={courier.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: courier.color 
                        }} />
                        {courier.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={() => setSelectedSales([])}
                size="small"
              >
                Limpiar Selección
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Collapsible Additional Filters */}
      <Collapse in={showAdvancedFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filtros Adicionales
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado Logística</InputLabel>
                <Select
                  multiple
                  value={filters.logisticsStatus}
                  onChange={(e) => handleFilterChange('logisticsStatus', e.target.value)}
                  label="Estado Logística"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={getStatusText(value)} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="para_preparar">Para Preparar</MenuItem>
                  <MenuItem value="etiqueta_impresa">Etiqueta Impresa</MenuItem>
                  <MenuItem value="controlada">Controlada</MenuItem>
                  <MenuItem value="lista_para_enviar">Lista para Enviar</MenuItem>
                  <MenuItem value="facturada">Facturada</MenuItem>
                  <MenuItem value="entregada">Entregada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Envío</InputLabel>
                <Select
                  multiple
                  value={filters.shippingType}
                  onChange={(e) => handleFilterChange('shippingType', e.target.value)}
                  label="Tipo de Envío"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="Flex">Flex</MenuItem>
                  <MenuItem value="Colecta">Colecta</MenuItem>
                  <MenuItem value="Turbo">Turbo</MenuItem>
                  <MenuItem value="Full">Full</MenuItem>
                  <MenuItem value="A convenir">A convenir</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => {
                  setFilters({ logisticsStatus: [], shippingType: [], saleStatus: [], searchText: '', dateFrom: '', dateTo: '', stores: ['MercadoLibre', 'TiendaNube', 'Local'] });
                  setCascadingFilters({});
                }}
                size="small"
              >
                Limpiar Todo
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Results */}
      {filteredSales.length === 0 ? (
        <Alert severity="info">
          No se encontraron ventas con los filtros aplicados.
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Select All Header */}
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                size="small"
                onClick={handleSelectAll}
                color={selectAll ? 'primary' : 'default'}
              >
                {selectAll ? <CheckCircle /> : <RadioButtonUnchecked />}
              </IconButton>
              <Typography variant="body2">
                Seleccionar todas ({filteredSales.length} ventas)
              </Typography>
              {selectedSales.length > 0 && (
                <Chip 
                  label={`${selectedSales.length} seleccionadas`}
                  color="primary"
                  size="small"
                />
              )}
            </Box>
          </Box>
          
          <DataGrid
            rows={filteredSales}
            columns={columns}
            pageSize={2}
            rowsPerPageOptions={[2, 3, 5]}
            disableSelectionOnClick
            getRowHeight={() => 420}
            autoHeight
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '3px solid #f0f0f0',
                padding: '16px 8px',
                alignItems: 'flex-start',
                overflow: 'visible',
                minHeight: '420px !important',
                maxHeight: 'none !important',
                height: 'auto !important',
              },
              '& .MuiDataGrid-row': {
                backgroundColor: '#ffffff',
                margin: '12px 0',
                borderRadius: '8px',
                position: 'relative',
                zIndex: 1,
                '&:hover': {
                  backgroundColor: '#f8f9ff',
                  transform: 'scale(1.01)',
                  zIndex: 10,
                  transition: 'all 0.2s ease-in-out'
                }
              },  
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#1976d2',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                minHeight: '56px !important',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: 'white',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-virtualScroller': {
                backgroundColor: '#f8f9fa',
                overflow: 'visible !important',
              },
              '& .MuiDataGrid-main': {
                overflow: 'visible !important',
              },
              '& .MuiDataGrid-viewport': {
                overflow: 'visible !important',
              }
            }}
          />
        </Paper>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => { console.log('Imprimir Etiqueta', selectedSale); handleActionClose(); }}>
          <Print sx={{ mr: 1 }} /> Imprimir Etiqueta
        </MenuItem>
        <MenuItem onClick={() => { console.log('Mensajería', selectedSale); handleActionClose(); }}>
          <LocalShipping sx={{ mr: 1 }} /> Mensajería
        </MenuItem>
        <MenuItem onClick={() => { console.log('Armar Paquete', selectedSale); handleActionClose(); }}>
          <Inventory sx={{ mr: 1 }} /> Armar Paquete
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { console.log('Ver Detalle', selectedSale); handleActionClose(); }}>
          <Visibility sx={{ mr: 1 }} /> Ver Detalle
        </MenuItem>
        <MenuItem onClick={() => { console.log('Agregar Nota', selectedSale); handleActionClose(); }}>
          <Note sx={{ mr: 1 }} /> Agregar Nota
        </MenuItem>
        <MenuItem onClick={() => { console.log('Generar Remito', selectedSale); handleActionClose(); }}>
          <Receipt sx={{ mr: 1 }} /> Generar Remito
        </MenuItem>
      </Menu>

      {/* Armar Modal */}
      <Dialog 
        open={showArmarModal} 
        onClose={handleArmarModalClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <Inventory color="primary" />
          Control de Armado - {selectedSaleForArmar?.saleNumber}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedSaleForArmar && (
            <Box>
              {/* Search Bar */}
              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9ff', border: '2px solid #2196f3' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔍 Escanear Código
                </Typography>
                <TextField
                  fullWidth
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyPress={handleCodeScan}
                  placeholder="Escanee o ingrese el código SKU o código original..."
                  variant="outlined"
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      fontSize: '1.2rem',
                      height: '56px'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Presione Enter después de escanear o escribir el código
                </Typography>
              </Paper>

              {/* Items List */}
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                📋 Artículos del Pedido ({scannedItems.length}/{selectedSaleForArmar.items.length} escaneados)
              </Typography>
              
              {selectedSaleForArmar.items.map((item, index) => {
                const isScanned = isItemScanned(item.sku);
                return (
                  <Paper 
                    key={index} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      backgroundColor: isScanned ? '#e8f5e8' : '#fff',
                      border: `2px solid ${isScanned ? '#4caf50' : '#e0e0e0'}`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={2}>
                        <Avatar 
                          src={item.imageUrl} 
                          sx={{ width: 60, height: 60 }} 
                          variant="rounded"
                        >
                          📦
                        </Avatar>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body1" fontWeight="bold">
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cantidad: {item.quantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">
                          <strong>Stock:</strong> {item.stock}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Marca:</strong> {item.brand}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">
                          <strong>SKU:</strong> {item.sku}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cód. Orig:</strong> {item.originalCode}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">
                          <strong>Ubicación:</strong> {item.location}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {isScanned ? (
                            <Chip 
                              label="✅ Escaneado" 
                              color="success" 
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          ) : (
                            <Chip 
                              label="⏳ Pendiente" 
                              color="warning" 
                              size="small"
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}

              {/* Progress Bar */}
              <Paper sx={{ p: 2, mt: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="body2" gutterBottom>
                  Progreso del armado: {scannedItems.length} de {selectedSaleForArmar.items.length} artículos
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(scannedItems.length / selectedSaleForArmar.items.length) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleArmarModalClose}
            variant="outlined"
          >
            Cancelar
          </Button>
          {allItemsScanned && (
            <Button 
              onClick={handleArmarComplete}
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              sx={{ fontWeight: 'bold' }}
            >
              Guardar y Marcar como Controlado
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VentasUnificadas;
