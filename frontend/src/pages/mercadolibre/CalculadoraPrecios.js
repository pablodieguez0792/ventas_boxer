import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  Calculate,
  AttachMoney,
  Percent,
  TrendingUp,
} from '@mui/icons-material';

const CalculadoraPrecios = () => {
  const [costoTotal, setCostoTotal] = useState('');
  const [comision, setComision] = useState('13.5'); // MercadoLibre default
  const [iibb, setIibb] = useState('3.5'); // IIBB default
  const [roturas, setRoturas] = useState('2'); // Breakage default
  const [precioVenta, setPrecioVenta] = useState(0);

  const calcularPrecioVenta = () => {
    const costo = parseFloat(costoTotal) || 0;
    const pctComision = parseFloat(comision) || 0;
    const pctIibb = parseFloat(iibb) || 0;
    const pctRoturas = parseFloat(roturas) || 0;
    
    const totalPorcentajes = (pctComision + pctIibb + pctRoturas) / 100;
    
    if (totalPorcentajes >= 1) {
      setPrecioVenta(0);
      return;
    }
    
    const precio = costo / (1 - totalPorcentajes);
    setPrecioVenta(precio);
  };

  useEffect(() => {
    calcularPrecioVenta();
  }, [costoTotal, comision, iibb, roturas]);

  const ganancia = precioVenta - (parseFloat(costoTotal) || 0);
  const margenGanancia = precioVenta > 0 ? ((ganancia / precioVenta) * 100) : 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🧮 Calculadora de Precios
      </Typography>
      
      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calculate color="primary" />
                Datos de Cálculo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Costo Total"
                    value={costoTotal}
                    onChange={(e) => setCostoTotal(e.target.value)}
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Costo del producto + gastos"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="% Comisión ML"
                    value={comision}
                    onChange={(e) => setComision(e.target.value)}
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Comisión MercadoLibre"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="% IIBB"
                    value={iibb}
                    onChange={(e) => setIibb(e.target.value)}
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Ingresos Brutos"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="% Roturas"
                    value={roturas}
                    onChange={(e) => setRoturas(e.target.value)}
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Pérdidas/Roturas"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                Resultado del Cálculo
              </Typography>
              
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.50', mb: 2 }}>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  ${precioVenta.toLocaleString('es-AR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </Typography>
                <Typography variant="h6" color="success.dark">
                  Precio de Venta Sugerido
                </Typography>
              </Paper>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">
                      ${ganancia.toLocaleString('es-AR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ganancia Bruta
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="info.main">
                      {margenGanancia.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Margen de Ganancia
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Breakdown Section */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Desglose de Costos
              </Typography>
              
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">Costo Base:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right" fontWeight="bold">
                    ${(parseFloat(costoTotal) || 0).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">Comisión ML ({comision}%):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right" color="error">
                    -${((precioVenta * (parseFloat(comision) || 0)) / 100).toLocaleString('es-AR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">IIBB ({iibb}%):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right" color="error">
                    -${((precioVenta * (parseFloat(iibb) || 0)) / 100).toLocaleString('es-AR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">Roturas ({roturas}%):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right" color="error">
                    -${((precioVenta * (parseFloat(roturas) || 0)) / 100).toLocaleString('es-AR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body1" fontWeight="bold">Ganancia Neta:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" align="right" fontWeight="bold" color="success.main">
                    ${(ganancia - 
                      (precioVenta * (parseFloat(comision) || 0)) / 100 - 
                      (precioVenta * (parseFloat(iibb) || 0)) / 100 - 
                      (precioVenta * (parseFloat(roturas) || 0)) / 100
                    ).toLocaleString('es-AR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CalculadoraPrecios;
