import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Divider,
  Alert,
  InputAdornment,
  Grid,
  Paper
} from '@mui/material';
import {
  Settings,
  Construction,
  Add,
  Delete,
  Calculate
} from '@mui/icons-material';

const Configuracion = () => {
  const [allCosts, setAllCosts] = useState([
    { id: 'cost-1', name: 'Embalaje', value: 500, type: 'fixed', enabled: true }, // $ fixed cost
    { id: 'cost-2', name: 'IIBB', value: 0, type: 'fixed', enabled: false },
    { id: 'cost-3', name: 'PADS', value: 0, type: 'fixed', enabled: false },
    { id: 'cost-4', name: 'Oferta', value: 0, type: 'fixed', enabled: false },
  ]);
  const [newCost, setNewCost] = useState({ name: '', value: 0, type: 'fixed' });
  const [simulationCost, setSimulationCost] = useState(10000);
  const [ganancia, setGanancia] = useState({ percentage: 25, enabled: true });
  const [iva, setIva] = useState({ percentage: 21, enabled: false });
  const [simulationResult, setSimulationResult] = useState({
    finalPrice: 0,
    breakdown: {}
  });

  // Nuevas configuraciones
  const [shippingConfig, setShippingConfig] = useState({
    cost: 7500,
    freeShippingThreshold: 50000,
    mlCommission: 14 // 14% o 36%
  });
  const [mlFixedCosts, setMlFixedCosts] = useState([
    { id: 1, minPrice: 0, maxPrice: 15000, cost: 2500 },
    { id: 2, minPrice: 15000, maxPrice: 33000, cost: 1000 },
  ]);

  const calculatePrice = () => {
    // Fórmula: ((Costo Base * Ganancia) + Costos Fijos + Costo Fijo ML + Envío + IIBB + PADS + Oferta) * comision ML * IVA
    
    // 1. Obtener ganancia e IVA
    const gananciaPercentage = ganancia.enabled ? ganancia.percentage : 0;
    const ivaPercentage = iva.enabled ? iva.percentage : 0;
    
    // 2. Costo Base * Ganancia
    const baseWithGanancia = simulationCost * (1 + gananciaPercentage / 100);
    
    // 3. Calcular costos fijos habilitados
    let totalFixedCosts = 0;
    const enabledFixedCosts = [];
    allCosts.forEach(cost => {
      if (cost.enabled && cost.type === 'fixed') {
        totalFixedCosts += cost.value;
        enabledFixedCosts.push(cost);
      }
    });
    
    // 4. Determinar costo fijo de ML según rango del precio base con ganancia
    let mlFixedCost = 0;
    for (const mlCost of mlFixedCosts) {
      if (baseWithGanancia >= mlCost.minPrice && baseWithGanancia < mlCost.maxPrice) {
        mlFixedCost = mlCost.cost;
        break;
      }
    }
    
    // 5. Determinar si aplica envío (se cobra cuando NO supera el umbral)
    const shippingCost = baseWithGanancia < shippingConfig.freeShippingThreshold ? shippingConfig.cost : 0;
    
    // 6. Suma de todos los componentes antes de comisiones
    const subtotal = baseWithGanancia + totalFixedCosts + mlFixedCost + shippingCost;
    
    // 7. Aplicar comisión ML
    const priceWithMLCommission = subtotal * (1 + shippingConfig.mlCommission / 100);
    
    // 8. Aplicar IVA
    const finalPrice = priceWithMLCommission * (1 + ivaPercentage / 100);
    
    setSimulationResult({
      baseCost: simulationCost,
      gananciaPercentage,
      baseWithGanancia,
      enabledFixedCosts,
      totalFixedCosts,
      mlFixedCost,
      shippingCost,
      subtotal,
      mlCommission: shippingConfig.mlCommission,
      priceWithMLCommission,
      ivaPercentage,
      finalPrice,
      breakdown: {
        baseCost: simulationCost,
        gananciaAmount: simulationCost * (gananciaPercentage / 100),
        fixedCosts: totalFixedCosts,
        mlFixedCost,
        shippingCost,
        mlCommissionAmount: subtotal * (shippingConfig.mlCommission / 100),
        ivaAmount: priceWithMLCommission * (ivaPercentage / 100)
      }
    });
  };

  const addCost = () => {
    if (newCost.name && newCost.value > 0) {
      const newId = `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setAllCosts([...allCosts, {
        id: newId,
        name: newCost.name,
        value: newCost.value,
        type: newCost.type,
        enabled: true
      }]);
      setNewCost({ name: '', value: 0, type: 'fixed' });
    }
  };

  const removeCost = (id) => {
    setAllCosts(allCosts.filter(c => c.id !== id));
  };

  const toggleCost = (id) => {
    setAllCosts(allCosts.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const updateCostValue = (id, value) => {
    setAllCosts(allCosts.map(c => 
      c.id === id ? { ...c, value: parseFloat(value) || 0 } : c
    ));
  };

  // Función para actualizar costos fijos de ML
  const updateMlFixedCost = (id, field, value) => {
    setMlFixedCosts(mlFixedCosts.map(ml => 
      ml.id === id ? { ...ml, [field]: parseFloat(value) || 0 } : ml
    ));
  };

  // Load configurations from database
  const loadConfigurations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/configurations');
      if (response.ok) {
        const configs = await response.json();
        console.log('Loaded configurations:', configs);
        
        if (configs.allCosts && Array.isArray(configs.allCosts)) {
          // Ensure all costs have valid IDs
          const validCosts = configs.allCosts.map((cost, index) => ({
            ...cost,
            id: cost.id || `cost-loaded-${index}`,
            value: cost.value || 0
          }));
          setAllCosts(validCosts);
        }
        if (configs.ganancia) {
          setGanancia(configs.ganancia);
        }
        if (configs.iva) {
          setIva(configs.iva);
        }
        if (configs.shippingConfig) {
          setShippingConfig(configs.shippingConfig);
        }
        if (configs.mlFixedCosts && Array.isArray(configs.mlFixedCosts)) {
          setMlFixedCosts(configs.mlFixedCosts);
        }
      } else {
        console.log('No configurations found, using defaults');
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      console.log('Using default configurations');
    }
  };

  // Save configurations to database
  const saveConfigurations = async () => {
    try {
      const configData = {
        allCosts,
        ganancia,
        iva,
        shippingConfig,
        mlFixedCosts
      };
      
      const response = await fetch('http://localhost:8000/api/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });
      
      if (response.ok) {
        console.log('Configurations saved successfully');
      }
    } catch (error) {
      console.error('Error saving configurations:', error);
    }
  };

  React.useEffect(() => {
    loadConfigurations();
  }, []);

  React.useEffect(() => {
    calculatePrice();
    // Auto-save configurations when they change
    if (allCosts.length > 0) { // Only save after initial load
      saveConfigurations();
    }
  }, [allCosts, ganancia, iva, shippingConfig, mlFixedCosts, simulationCost]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings />
        Configuración del Sistema
      </Typography>
      
      <Grid container spacing={3}>
        {/* Gestión de Costos y Porcentajes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gestión de Costos y Porcentajes
            </Typography>
            
            {allCosts.map((cost, index) => (
              <Box key={`cost-item-${cost.id || `temp-${index}`}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Switch
                  checked={cost.enabled}
                  onChange={() => toggleCost(cost.id)}
                  size="small"
                />
                <TextField
                  label={cost.name}
                  type="number"
                  value={cost.value || 0}
                  onChange={(e) => updateCostValue(cost.id, e.target.value)}
                  sx={{ flex: 1 }}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">
                      {cost.type === 'percentage' ? '%' : '$'}
                    </InputAdornment>,
                  }}
                />
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => removeCost(cost.id)}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Agregar Nuevo Costo:
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                label="Nombre"
                value={newCost.name}
                onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Valor"
                type="number"
                value={newCost.value}
                onChange={(e) => setNewCost({ ...newCost, value: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">
                    {newCost.type === 'percentage' ? '%' : '$'}
                  </InputAdornment>,
                }}
                sx={{ width: 120 }}
              />
              <TextField
                select
                size="small"
                label="Tipo"
                value={newCost.type}
                onChange={(e) => setNewCost({ ...newCost, type: e.target.value })}
                sx={{ width: 100 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="fixed">$ Fijo</option>
                <option value="percentage">% Porcentaje</option>
              </TextField>
              <Button
                variant="contained"
                onClick={addCost}
                startIcon={<Add />}
                disabled={!newCost.name || newCost.value <= 0}
              >
                Agregar
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Configuración de Envío y MercadoLibre */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuración de Envío y MercadoLibre
            </Typography>
            
            <TextField
              fullWidth
              label="Costo de Envío"
              type="number"
              value={shippingConfig.cost}
              onChange={(e) => setShippingConfig({
                ...shippingConfig,
                cost: parseFloat(e.target.value) || 0
              })}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            
            <TextField
              fullWidth
              label="Umbral para Envío Gratis"
              type="number"
              value={shippingConfig.freeShippingThreshold}
              onChange={(e) => setShippingConfig({
                ...shippingConfig,
                freeShippingThreshold: parseFloat(e.target.value) || 0
              })}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Se cobra envío cuando el precio es MENOR a este valor"
            />
            
            <TextField
              select
              fullWidth
              label="Comisión MercadoLibre"
              value={shippingConfig.mlCommission}
              onChange={(e) => setShippingConfig({
                ...shippingConfig,
                mlCommission: parseFloat(e.target.value)
              })}
              sx={{ mb: 3 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value={14}>14% - Clásica</option>
              <option value={36}>36% - Premium</option>
            </TextField>
            
            <Typography variant="h6" gutterBottom>
              Costos Fijos de MercadoLibre por Rango de Precio
            </Typography>
            
            {mlFixedCosts.map((mlCost) => (
              <Box key={mlCost.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TextField
                  label="Min"
                  type="number"
                  value={mlCost.minPrice}
                  onChange={(e) => updateMlFixedCost(mlCost.id, 'minPrice', e.target.value)}
                  sx={{ width: 100 }}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <Typography>-</Typography>
                <TextField
                  label="Max"
                  type="number"
                  value={mlCost.maxPrice}
                  onChange={(e) => updateMlFixedCost(mlCost.id, 'maxPrice', e.target.value)}
                  sx={{ width: 100 }}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <Typography>=</Typography>
                <TextField
                  label="Costo"
                  type="number"
                  value={mlCost.cost}
                  onChange={(e) => updateMlFixedCost(mlCost.id, 'cost', e.target.value)}
                  sx={{ width: 100 }}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>


        {/* Simulador de Precios */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calculate />
              Simulador de Precios
            </Typography>
            
            <Grid container spacing={3}>
              {/* Input Section */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Costo Base"
                  type="number"
                  value={simulationCost}
                  onChange={(e) => setSimulationCost(parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                
                {/* Ganancia - Non-deletable */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Switch
                    checked={ganancia.enabled}
                    onChange={(e) => setGanancia({ ...ganancia, enabled: e.target.checked })}
                    size="small"
                  />
                  <TextField
                    label="Ganancia"
                    type="number"
                    value={ganancia.percentage}
                    onChange={(e) => setGanancia({ ...ganancia, percentage: parseFloat(e.target.value) || 0 })}
                    sx={{ flex: 1 }}
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Box>
                
                {/* IVA - Non-deletable */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Switch
                    checked={iva.enabled}
                    onChange={(e) => setIva({ ...iva, enabled: e.target.checked })}
                    size="small"
                  />
                  <TextField
                    label="IVA"
                    type="number"
                    value={iva.percentage}
                    onChange={(e) => setIva({ ...iva, percentage: parseFloat(e.target.value) || 0 })}
                    sx={{ flex: 1 }}
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  onClick={calculatePrice}
                  startIcon={<Calculate />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Calcular Precio
                </Button>
              </Grid>

              {/* Calculation Breakdown */}
              <Grid item xs={12} md={8}>
                {simulationResult.finalPrice > 0 && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e9ecef'
                  }}>
                    <Typography variant="h6" gutterBottom color="primary.main" sx={{ mb: 2 }}>
                      Desglose del Cálculo
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Costo Base */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Costo Base:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${simulationResult.baseCost?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      
                      {/* Ganancia */}
                      {simulationResult.gananciaPercentage > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">× Ganancia ({simulationResult.gananciaPercentage}%):</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ${simulationResult.breakdown?.gananciaAmount?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 0.5 }} />
                      
                      {/* Base con Ganancia */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Base con Ganancia:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${simulationResult.baseWithGanancia?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      
                      {/* Costos Fijos - Mostrar todos los habilitados */}
                      {allCosts.filter(cost => cost.enabled).map((cost, index) => (
                        <Box key={`breakdown-${cost.id || `temp-${index}`}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">+ {cost.name}:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="orange">
                            ${(cost.value || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                      
                      {/* Costo Fijo ML */}
                      {simulationResult.mlFixedCost > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">+ Costo Fijo ML:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="warning.main">
                            ${simulationResult.mlFixedCost?.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Envío */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          + Envío {simulationResult.shippingCost === 0 ? '(GRATIS)' : ''}:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold" 
                          color={simulationResult.shippingCost === 0 ? 'success.main' : 'info.main'}
                        >
                          ${simulationResult.shippingCost?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 0.5 }} />
                      
                      {/* Subtotal antes de comisiones */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${simulationResult.subtotal?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      
                      {/* Comisión ML */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">× Comisión ML ({simulationResult.mlCommission}%):</Typography>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          ${simulationResult.breakdown?.mlCommissionAmount?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      
                      {/* Precio con Comisión ML */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Precio con Comisión ML:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${simulationResult.priceWithMLCommission?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      
                      {/* IVA */}
                      {simulationResult.ivaPercentage > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">× IVA ({simulationResult.ivaPercentage}%):</Typography>
                          <Typography variant="body2" fontWeight="bold" color="secondary.main">
                            ${simulationResult.breakdown?.ivaAmount?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      {/* Precio Final */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1,
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        color: 'white'
                      }}>
                        <Typography variant="h6" fontWeight="bold">
                          PRECIO FINAL:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          ${simulationResult.finalPrice?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Otras Configuraciones */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔧 Otras Configuraciones
            </Typography>
            <Alert severity="info">
              <Typography variant="body2">
                Próximamente: Configuración de APIs de MercadoLibre, gestión de credenciales, y parámetros del sistema.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Configuracion;
