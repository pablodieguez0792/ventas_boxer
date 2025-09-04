import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Button,
  Checkbox,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Print,
  Inventory,
  LocalShipping,
  CheckCircle,
  QrCodeScanner,
} from '@mui/icons-material';
import { useMercadoLibreContext } from '../MercadoLibreContainer';
import { courierOptions } from '../../data/mockData';

const PipelineLogistica = () => {
  const { sales, updateSaleStatus, updateMultipleSalesStatus } = useMercadoLibreContext();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [scannedItems, setScannedItems] = useState({});
  const [scanInput, setScanInput] = useState('');
  const [courierDialog, setCourierDialog] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('');

  const steps = [
    'Imprimir Etiquetas',
    'Armado de Paquete',
    'Selección de Mensajería',
    'Checklist de Entrega',
    'Completado'
  ];

  const handleStepClick = (stepIndex) => {
    setActiveStep(stepIndex);
    setSelectedSales([]);
    setSelectedSale(null);
  };

  const handleSelectionChange = (newSelection) => {
    setSelectedSales(newSelection);
  };

  const handlePrintLabels = () => {
    if (selectedSales.length > 0) {
      updateMultipleSalesStatus(selectedSales, 'packaged');
      setSelectedSales([]);
    }
  };

  const handleSelectSaleForPackaging = (sale) => {
    setSelectedSale(sale);
    const itemsStatus = {};
    sale.items.forEach(item => {
      itemsStatus[item.sku] = { scanned: 0, required: item.quantity };
    });
    setScannedItems(itemsStatus);
  };

  const handleScanItem = () => {
    if (!scanInput || !selectedSale) return;
    
    const item = selectedSale.items.find(item => item.sku === scanInput);
    if (item) {
      setScannedItems(prev => ({
        ...prev,
        [scanInput]: {
          ...prev[scanInput],
          scanned: Math.min(prev[scanInput].scanned + 1, prev[scanInput].required)
        }
      }));
      setScanInput('');
    }
  };

  const isPackagingComplete = () => {
    if (!selectedSale) return false;
    return Object.values(scannedItems).every(item => item.scanned >= item.required);
  };

  const handleCompletePackaging = () => {
    if (selectedSale && isPackagingComplete()) {
      updateSaleStatus(selectedSale.id, 'courier_assigned');
      setSelectedSale(null);
      setScannedItems({});
    }
  };

  const handleOpenCourierDialog = (sale) => {
    setSelectedSale(sale);
    setCourierDialog(true);
  };

  const handleSelectCourier = () => {
    if (selectedSale && selectedCourier) {
      updateSaleStatus(selectedSale.id, 'checked_out');
      setCourierDialog(false);
      setSelectedCourier('');
      setSelectedSale(null);
    }
  };

  const handleCheckout = () => {
    if (selectedSales.length > 0) {
      updateMultipleSalesStatus(selectedSales, 'delivered');
      setSelectedSales([]);
    }
  };

  const getStepSales = (step) => {
    const statusMap = {
      0: 'label_printed',
      1: 'packaged',
      2: 'courier_assigned',
      3: 'checked_out'
    };
    return sales.filter(sale => sale.logisticsStatus === statusMap[step]);
  };

  const renderStepContent = () => {
    const stepSales = getStepSales(activeStep);

    switch (activeStep) {
      case 0: // Imprimir Etiquetas
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📄 Etiquetas Pendientes de Impresión
              </Typography>
              <Box sx={{ height: 400, width: '100%', mb: 2 }}>
                <DataGrid
                  rows={stepSales}
                  columns={[
                    { field: 'id', headerName: 'ID', width: 80 },
                    { field: 'shippingId', headerName: 'Envío ID', width: 150 },
                    { 
                      field: 'customer', 
                      headerName: 'Cliente', 
                      width: 200,
                      valueGetter: (params) => params.row.customer.name
                    },
                    { field: 'platform', headerName: 'Plataforma', width: 120 }
                  ]}
                  checkboxSelection
                  onSelectionModelChange={handleSelectionChange}
                  selectionModel={selectedSales}
                />
              </Box>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={handlePrintLabels}
                disabled={selectedSales.length === 0}
              >
                Marcar como Impresas ({selectedSales.length})
              </Button>
            </CardContent>
          </Card>
        );

      case 1: // Armado de Paquete
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📦 Paquetes Pendientes
                  </Typography>
                  <List>
                    {stepSales.map((sale) => (
                      <ListItem
                        key={sale.id}
                        button
                        onClick={() => handleSelectSaleForPackaging(sale)}
                        selected={selectedSale?.id === sale.id}
                      >
                        <ListItemAvatar>
                          <Avatar>#{sale.id}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={sale.customer.name}
                          secondary={`${sale.items.length} productos`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {selectedSale && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🔍 Escaneo de Productos - Venta #{selectedSale.id}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Escanear SKU"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleScanItem()}
                        InputProps={{
                          endAdornment: (
                            <Button onClick={handleScanItem} startIcon={<QrCodeScanner />}>
                              Escanear
                            </Button>
                          )
                        }}
                      />
                    </Box>

                    <List>
                      {selectedSale.items.map((item) => (
                        <ListItem key={item.sku}>
                          <ListItemText
                            primary={item.title}
                            secondary={`SKU: ${item.sku}`}
                          />
                          <Chip
                            label={`${scannedItems[item.sku]?.scanned || 0}/${item.quantity}`}
                            color={
                              (scannedItems[item.sku]?.scanned || 0) >= item.quantity 
                                ? 'success' 
                                : 'default'
                            }
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={handleCompletePackaging}
                      disabled={!isPackagingComplete()}
                      sx={{ mt: 2 }}
                    >
                      Paquete Armado
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        );

      case 2: // Selección de Mensajería
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚚 Asignación de Mensajería (Flex)
              </Typography>
              <List>
                {stepSales.filter(sale => sale.shipping.type === 'Flex').map((sale) => (
                  <ListItem key={sale.id}>
                    <ListItemAvatar>
                      <Avatar>#{sale.id}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={sale.customer.name}
                      secondary={sale.customer.address}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<LocalShipping />}
                      onClick={() => handleOpenCourierDialog(sale)}
                    >
                      Seleccionar Mensajería
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        );

      case 3: // Checklist de Entrega
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ✅ Checklist de Entrega
              </Typography>
              <Box sx={{ height: 400, width: '100%', mb: 2 }}>
                <DataGrid
                  rows={stepSales}
                  columns={[
                    { field: 'id', headerName: 'ID', width: 80 },
                    { 
                      field: 'customer', 
                      headerName: 'Cliente', 
                      width: 200,
                      valueGetter: (params) => params.row.customer.name
                    },
                    { 
                      field: 'address', 
                      headerName: 'Dirección', 
                      width: 300,
                      valueGetter: (params) => params.row.customer.address
                    },
                    { 
                      field: 'shipping', 
                      headerName: 'Tipo Envío', 
                      width: 120,
                      valueGetter: (params) => params.row.shipping.type
                    }
                  ]}
                  checkboxSelection
                  onSelectionModelChange={handleSelectionChange}
                  selectionModel={selectedSales}
                />
              </Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={handleCheckout}
                disabled={selectedSales.length === 0}
              >
                Confirmar Entrega ({selectedSales.length})
              </Button>
            </CardContent>
          </Card>
        );

      case 4: // Completado
        const deliveredSales = sales.filter(sale => sale.logisticsStatus === 'delivered');
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎉 Ventas Completadas
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Total de ventas entregadas: {deliveredSales.length}
              </Typography>
              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={deliveredSales}
                  columns={[
                    { field: 'id', headerName: 'ID', width: 80 },
                    { 
                      field: 'customer', 
                      headerName: 'Cliente', 
                      width: 200,
                      valueGetter: (params) => params.row.customer.name
                    },
                    { 
                      field: 'total', 
                      headerName: 'Total', 
                      width: 120,
                      renderCell: (params) => `$${params.value.toLocaleString()}`
                    },
                    { field: 'platform', headerName: 'Plataforma', width: 120 }
                  ]}
                />
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🚛 Pipeline de Logística
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep}>
              <StepLabel 
                onClick={() => handleStepClick(index)}
                sx={{ cursor: 'pointer' }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {renderStepContent()}

      {/* Courier Selection Dialog */}
      <Dialog open={courierDialog} onClose={() => setCourierDialog(false)}>
        <DialogTitle>Seleccionar Mensajería</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
          >
            {courierOptions.map((courier) => (
              <FormControlLabel
                key={courier.id}
                value={courier.name}
                control={<Radio />}
                label={`${courier.name} - $${courier.cost}`}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourierDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSelectCourier}
            variant="contained"
            disabled={!selectedCourier}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipelineLogistica;
