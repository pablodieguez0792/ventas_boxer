import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, 
  InputLabel, Select, MenuItem, Chip, IconButton, List, ListItem,
  ListItemText, ListItemAvatar, Switch, FormControlLabel, Divider,
  Alert, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Notifications, Add, Edit, Delete, ExpandMore, PlayArrow, Pause,
  Schedule, Group, TrendingUp, Warning, CheckCircle
} from '@mui/icons-material';

const AlertManager = () => {
  const [alertRules, setAlertRules] = useState([
    {
      id: 1,
      nombre: 'Service 10,000 km',
      descripcion: 'Alerta cuando el vehículo se acerca a los 10,000 km',
      tipo: 'mantenimiento',
      activa: true,
      condiciones: {
        kilometraje: { min: 9500, max: 10500 },
        diasSinCompra: null,
        tipoVehiculo: [],
        grupoRepuestos: ['Aceites y Lubricantes', 'Filtros']
      },
      mensaje: '¡Hola {nombre}! Tu {vehiculo} está llegando a los 10,000 km. Es momento del service. Tenemos todos los repuestos que necesitas.',
      prioridad: 'alta',
      clientesAfectados: 15,
      fechaCreacion: '2024-01-15'
    },
    {
      id: 2,
      nombre: 'Reactivación 60 días',
      descripcion: 'Reactivar clientes sin compras por 60 días',
      tipo: 'reactivacion',
      activa: true,
      condiciones: {
        kilometraje: null,
        diasSinCompra: 60,
        tipoVehiculo: [],
        grupoRepuestos: []
      },
      mensaje: '¡Te extrañamos {nombre}! Hace tiempo que no nos visitas. Tenemos ofertas especiales para tu {vehiculo}.',
      prioridad: 'media',
      clientesAfectados: 8,
      fechaCreacion: '2024-01-10'
    },
    {
      id: 3,
      nombre: 'Oferta Frenos Verano',
      descripcion: 'Promoción especial en frenos para temporada',
      tipo: 'oferta',
      activa: false,
      condiciones: {
        kilometraje: { min: 15000, max: null },
        diasSinCompra: null,
        tipoVehiculo: ['Auto', 'Camioneta'],
        grupoRepuestos: ['Frenos']
      },
      mensaje: '¡{nombre}! Oferta especial en frenos para tu {vehiculo}. 25% OFF hasta fin de mes.',
      prioridad: 'media',
      clientesAfectados: 23,
      fechaCreacion: '2024-01-20'
    }
  ]);

  const [newRule, setNewRule] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [customAlertTypes, setCustomAlertTypes] = useState([]);
  const [newAlertTypeDialog, setNewAlertTypeDialog] = useState(false);
  const [newAlertType, setNewAlertType] = useState('');

  const defaultTiposAlerta = [
    { value: 'mantenimiento', label: 'Mantenimiento', color: 'primary' },
    { value: 'oferta', label: 'Oferta', color: 'success' },
    { value: 'reactivacion', label: 'Reactivación', color: 'warning' },
    { value: 'seguimiento', label: 'Seguimiento', color: 'info' },
    { value: 'stock', label: 'Stock', color: 'secondary' },
    { value: 'vencimiento', label: 'Vencimiento', color: 'error' }
  ];
  
  const tiposAlerta = [...defaultTiposAlerta, ...customAlertTypes];

  const gruposRepuestos = [
    'Aceites y Lubricantes', 'Filtros', 'Frenos', 'Suspensión',
    'Motor', 'Transmisión', 'Eléctrico', 'Carrocería',
    'Neumáticos', 'Accesorios'
  ];

  const tiposVehiculo = ['Auto', 'Camioneta', 'Moto', 'Utilitario'];

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setSelectedRule(rule);
      setNewRule(rule);
    } else {
      setSelectedRule(null);
      setNewRule({
        nombre: '',
        descripcion: '',
        tipo: 'mantenimiento',
        condiciones: {
          kilometraje: { min: '', max: '' },
          diasSinCompra: '',
          tipoVehiculo: [],
          grupoRepuestos: []
        },
        mensaje: '',
        prioridad: 'media'
      });
    }
    setDialogOpen(true);
  };

  const handleAddCustomAlertType = () => {
    if (newAlertType.trim()) {
      const customType = {
        value: newAlertType.toLowerCase().replace(/\s+/g, '_'),
        label: newAlertType,
        color: 'info'
      };
      setCustomAlertTypes(prev => [...prev, customType]);
      setNewAlertType('');
      setNewAlertTypeDialog(false);
    }
  };

  const handleSaveRule = () => {
    if (selectedRule) {
      setAlertRules(prev => prev.map(rule => 
        rule.id === selectedRule.id ? { ...newRule, id: selectedRule.id } : rule
      ));
    } else {
      setAlertRules(prev => [...prev, { 
        ...newRule, 
        id: Date.now(),
        activa: true,
        clientesAfectados: 0,
        fechaCreacion: new Date().toISOString().split('T')[0]
      }]);
    }
    setDialogOpen(false);
  };

  const toggleRuleStatus = (ruleId) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, activa: !rule.activa } : rule
    ));
  };

  const deleteRule = (ruleId) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const getTypeColor = (tipo) => {
    const typeObj = tiposAlerta.find(t => t.value === tipo);
    return typeObj ? typeObj.color : 'default';
  };

  const getPriorityColor = (prioridad) => {
    switch (prioridad) {
      case 'alta': return 'error';
      case 'media': return 'warning';
      case 'baja': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Gestor de Alertas Automáticas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Nueva Regla de Alerta
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Notifications />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {alertRules.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reglas Totales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {alertRules.filter(r => r.activa).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reglas Activas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Group />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {alertRules.reduce((sum, r) => sum + r.clientesAfectados, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clientes Afectados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {alertRules.filter(r => r.prioridad === 'alta').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alta Prioridad
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de reglas */}
      <Grid container spacing={2}>
        {alertRules.map((rule) => (
          <Grid item xs={12} key={rule.id}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Avatar sx={{ bgcolor: rule.activa ? 'success.main' : 'grey.400' }}>
                    {rule.activa ? <PlayArrow /> : <Pause />}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{rule.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rule.descripcion}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={rule.tipo} 
                      color={getTypeColor(rule.tipo)} 
                      size="small" 
                    />
                    <Chip 
                      label={rule.prioridad} 
                      color={getPriorityColor(rule.prioridad)} 
                      size="small" 
                    />
                    <Chip 
                      label={`${rule.clientesAfectados} clientes`} 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Condiciones:</Typography>
                    <List dense>
                      {rule.condiciones.kilometraje && (
                        <ListItem>
                          <ListItemText 
                            primary={`Kilometraje: ${rule.condiciones.kilometraje.min || 0} - ${rule.condiciones.kilometraje.max || '∞'} km`}
                          />
                        </ListItem>
                      )}
                      {rule.condiciones.diasSinCompra && (
                        <ListItem>
                          <ListItemText 
                            primary={`Días sin compra: ${rule.condiciones.diasSinCompra}`}
                          />
                        </ListItem>
                      )}
                      {rule.condiciones.tipoVehiculo.length > 0 && (
                        <ListItem>
                          <ListItemText 
                            primary={`Tipos de vehículo: ${rule.condiciones.tipoVehiculo.join(', ')}`}
                          />
                        </ListItem>
                      )}
                      {rule.condiciones.grupoRepuestos.length > 0 && (
                        <ListItem>
                          <ListItemText 
                            primary={`Grupos de repuestos: ${rule.condiciones.grupoRepuestos.join(', ')}`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Mensaje:</Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {rule.mensaje}
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(rule)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        color={rule.activa ? 'warning' : 'success'}
                        onClick={() => toggleRuleStatus(rule.id)}
                      >
                        {rule.activa ? <Pause /> : <PlayArrow />}
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Dialog para crear/editar regla */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRule ? 'Editar Regla de Alerta' : 'Nueva Regla de Alerta'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la Regla"
                value={newRule.nombre}
                onChange={(e) => setNewRule({...newRule, nombre: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Alerta</InputLabel>
                  <Select
                    value={newRule.tipo}
                    label="Tipo de Alerta"
                    onChange={(e) => setNewRule({...newRule, tipo: e.target.value})}
                  >
                    {tiposAlerta.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        <Chip label={tipo.label} color={tipo.color} size="small" sx={{ mr: 1 }} />
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setNewAlertTypeDialog(true)}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  Nuevo
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={newRule.descripcion}
                onChange={(e) => setNewRule({...newRule, descripcion: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Condiciones de Activación</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kilometraje Mínimo"
                type="number"
                value={newRule.condiciones.kilometraje.min}
                onChange={(e) => setNewRule({
                  ...newRule, 
                  condiciones: {
                    ...newRule.condiciones,
                    kilometraje: {...newRule.condiciones.kilometraje, min: e.target.value}
                  }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kilometraje Máximo"
                type="number"
                value={newRule.condiciones.kilometraje.max}
                onChange={(e) => setNewRule({
                  ...newRule, 
                  condiciones: {
                    ...newRule.condiciones,
                    kilometraje: {...newRule.condiciones.kilometraje, max: e.target.value}
                  }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Días sin Compra"
                type="number"
                value={newRule.condiciones.diasSinCompra}
                onChange={(e) => setNewRule({
                  ...newRule, 
                  condiciones: {...newRule.condiciones, diasSinCompra: e.target.value}
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={newRule.prioridad}
                  label="Prioridad"
                  onChange={(e) => setNewRule({...newRule, prioridad: e.target.value})}
                >
                  <MenuItem value="baja">Baja</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensaje de la Alerta"
                multiline
                rows={3}
                value={newRule.mensaje}
                onChange={(e) => setNewRule({...newRule, mensaje: e.target.value})}
                helperText="Variables disponibles: {nombre}, {vehiculo}, {kilometraje}, {ultimaCompra}"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveRule}
            disabled={!newRule.nombre || !newRule.mensaje}
          >
            {selectedRule ? 'Actualizar' : 'Crear'} Regla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar nuevo tipo de alerta */}
      <Dialog open={newAlertTypeDialog} onClose={() => setNewAlertTypeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nuevo Tipo de Alerta</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre del Tipo de Alerta"
            value={newAlertType}
            onChange={(e) => setNewAlertType(e.target.value)}
            placeholder="Ej: Garantía, Recall, Inspección"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewAlertTypeDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleAddCustomAlertType}
            disabled={!newAlertType.trim()}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertManager;
