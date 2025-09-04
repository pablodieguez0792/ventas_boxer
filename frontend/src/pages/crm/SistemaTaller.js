import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Grid, Card, CardContent, 
  TextField, Button, Avatar, List, ListItem, ListItemText, ListItemAvatar,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, ListItemSecondaryAction,
  Divider, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Badge, Checkbox
} from '@mui/material';
import {
  Person, Phone, Email, DirectionsCar, Event, Today, NavigateBefore, NavigateNext,
  CalendarViewMonth, CalendarViewWeek, CalendarToday, Add, CheckCircle, Cancel, Circle, Delete,
  PersonAdd, Warning, Remove, Save, Inventory, Build, TrendingUp, Search, LocationOn,
  Visibility, WhatsApp, Edit, ChevronLeft, ChevronRight, CalendarViewDay, ShoppingBag,
  ShoppingCart, Close, Notifications
} from '@mui/icons-material';
import ArticulosTab from './ArticulosTab';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`taller-tabpanel-${index}`}
      aria-labelledby={`taller-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SistemaTaller = () => {
  const [tabValue, setTabValue] = useState(0);
  const goToCalendario = () => setTabValue(1);

  // Datos de muestra para clientes del taller
  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: 'Juan Carlos Pérez',
      telefono: '+54 11 1234-5678',
      email: 'juan.perez@email.com',
      direccion: 'Av. Corrientes 1234, CABA',
      tipoCliente: 'Frecuente',
      estado: 'Activo',
      totalTrabajos: 15,
      montoTotal: 125000,
      ultimoTrabajo: '2024-01-15',
      vehiculos: [
        {
          id: 1,
          marca: 'Ford',
          modelo: 'Focus',
          año: 2020,
          patente: 'ABC123',
          kilometraje: 45000,
          vin: '1HGBH41JXMN109186',
          color: 'Blanco'
        }
      ]
    },
    {
      id: 2,
      nombre: 'María González',
      telefono: '+54 11 9876-5432',
      email: 'maria.gonzalez@email.com',
      direccion: 'San Martín 567, San Isidro',
      tipoCliente: 'Regular',
      estado: 'Activo',
      totalTrabajos: 8,
      montoTotal: 67000,
      ultimoTrabajo: '2024-01-10',
      vehiculos: [
        {
          id: 2,
          marca: 'Chevrolet',
          modelo: 'Corsa',
          año: 2018,
          patente: 'DEF456',
          kilometraje: 78000,
          vin: '2HGBH41JXMN109187',
          color: 'Rojo'
        }
      ]
    }
  ]);

  // Estado para turnos/citas
  const [turnos, setTurnos] = useState([
    {
      id: 1,
      fecha: '2024-01-25',
      hora: '09:00',
      clienteId: 1,
      clienteNombre: 'Juan Carlos Pérez',
      vehiculo: 'Ford Focus ABC123',
      servicio: 'Service 10.000 km',
      estado: 'Confirmado',
      observaciones: 'Cliente solicita revisión de frenos'
    },
    {
      id: 2,
      fecha: '2024-01-25',
      hora: '14:30',
      clienteId: 2,
      clienteNombre: 'María González',
      vehiculo: 'Chevrolet Corsa DEF456',
      servicio: 'Cambio de aceite',
      estado: 'Pendiente',
      observaciones: ''
    }
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="Sistema Taller tabs"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<Person />} 
              label="CLIENTES" 
              sx={{ minHeight: 72, fontSize: '1rem', fontWeight: 'bold' }}
            />
            <Tab 
              icon={<Event />} 
              label="CALENDARIO" 
              sx={{ minHeight: 72, fontSize: '1rem', fontWeight: 'bold' }}
            />
            <Tab 
              icon={<Inventory />} 
              label="ARTICULOS" 
              sx={{ minHeight: 72, fontSize: '1rem', fontWeight: 'bold' }}
            />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <ClientesTab clientes={clientes} setClientes={setClientes} turnos={turnos} onGoToCalendario={goToCalendario} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <CalendarioTab turnos={turnos} setTurnos={setTurnos} clientes={clientes} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ArticulosTab clientes={clientes} />
        </TabPanel>
      </Paper>
    </Container>
  );
};

// Componente para la pestaña de Clientes
const ClientesTab = ({ clientes, setClientes, turnos, onGoToCalendario }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [openHistory, setOpenHistory] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm) ||
    cliente.vehiculos.some(v => v.patente.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Datos de talleres para el diálogo de historial
  const hoy = new Date();
  const toDateTime = (t) => new Date(`${t.fecha}T${(t.hora || '00:00')}:00`);
  const turnosCliente = selectedCliente ? (turnos || []).filter(t => t.clienteId === selectedCliente.id) : [];
  const turnosOrdenados = [...turnosCliente].sort((a, b) => toDateTime(a) - toDateTime(b));
  const proximoTurno = turnosOrdenados.find(t => toDateTime(t) >= hoy);
  const confirmados = turnosCliente.filter(t => t.estado === 'Confirmado').length;
  const pendientes = turnosCliente.filter(t => t.estado !== 'Confirmado').length;

  return (
    <Box>
      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}><Person /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{clientes.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Clientes</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}><DirectionsCar /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.reduce((acc, c) => acc + c.vehiculos.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Vehículos Registrados</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}><Build /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {clientes.reduce((acc, c) => acc + c.totalTrabajos, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Trabajos Realizados</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}><TrendingUp /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ${clientes.reduce((acc, c) => acc + c.montoTotal, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Facturación Total</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Buscar cliente, teléfono o patente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              size="large"
            >
              Nuevo Cliente
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de clientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selectedRows.length > 0 && selectedRows.length < filteredClientes.length}
                  checked={filteredClientes.length > 0 && selectedRows.length === filteredClientes.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(filteredClientes.map(c => c.id));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Vehículos</TableCell>
              <TableCell>Trabajos</TableCell>
              <TableCell>Total Facturado</TableCell>
              <TableCell>Última Compra</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={selectedRows.includes(cliente.id)}
                    onChange={(e) => {
                      setSelectedRows(prev => e.target.checked ? [...prev, cliente.id] : prev.filter(id => id !== cliente.id));
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{cliente.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" />
                      {cliente.direccion}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Phone fontSize="small" />
                      {cliente.telefono}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email fontSize="small" />
                      {cliente.email}
                    </Typography>
                  </Box>
                </TableCell>
                {/* Columna Vehículos */}
                <TableCell>
                  {cliente.vehiculos.map((vehiculo, index) => (
                    <Chip
                      key={index}
                      label={`${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.patente}`}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold">{cliente.totalTrabajos}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    ${cliente.montoTotal.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {cliente.ultimoTrabajo ? (
                    <Typography variant="body2">
                      {new Date(cliente.ultimoTrabajo).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Sin trabajos</Typography>
                  )}
                </TableCell>
                {/* Columna Estado (ahora penúltima antes de Acciones) */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={cliente.estado || 'Activo'} color="success" size="small" />
                    {cliente.tipoCliente && (
                      <Chip label={cliente.tipoCliente === 'Frecuente' ? '15%' : 'Regular'} color="info" size="small" />
                    )}
                    <Tooltip
                      arrow
                      placement="top"
                      title={(
                        <Box>
                          {(cliente.alertas && cliente.alertas.length ? cliente.alertas : [
                            'VTV vencida',
                            'Service de 10.000 km pendiente'
                          ]).map((a, idx) => (
                            <Typography key={idx} variant="caption" display="block">• {a}</Typography>
                          ))}
                        </Box>
                      )}
                    >
                      <IconButton
                        size="small"
                        onClick={() => {
                          const items = cliente.alertas && cliente.alertas.length ? cliente.alertas : ['VTV vencida', 'Service de 10.000 km pendiente'];
                          setSelectedAlerts(items);
                          setAlertDialogOpen(true);
                        }}
                      >
                        <Badge color="error" badgeContent={(cliente.alertas && cliente.alertas.length) ? cliente.alertas.length : 2} overlap="rectangular">
                          <Notifications fontSize="small" />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Ver Historial">
                    <IconButton size="small" color="primary" onClick={() => { setSelectedCliente(cliente); setOpenHistory(true); }}><Visibility /></IconButton>
                  </Tooltip>
                  <Tooltip title="WhatsApp">
                    <IconButton size="small" color="success"><WhatsApp /></IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para detalle de alertas (mejor en touch/click) */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Alertas del cliente</DialogTitle>
        <DialogContent dividers>
          {selectedAlerts.length ? (
            <List>
              {selectedAlerts.map((a, i) => (
                <ListItem key={i}>
                  <ListItemText primary={a} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">Sin alertas pendientes.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo Historial Cliente */}
      <Dialog open={openHistory} onClose={() => setOpenHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de {selectedCliente?.nombre || 'Cliente'}</DialogTitle>
        <DialogContent dividers>
          {selectedCliente ? (
            <Box>
              {/* Resumen rápido */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Trabajos realizados</Typography>
                    <Typography variant="h5" fontWeight="bold">{selectedCliente.totalTrabajos}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Total facturado</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">${selectedCliente.montoTotal.toLocaleString()}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Último trabajo</Typography>
                    <Typography variant="h6">{selectedCliente.ultimoTrabajo ? new Date(selectedCliente.ultimoTrabajo).toLocaleDateString() : '—'}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Datos de contacto */}
              <Typography variant="subtitle1" gutterBottom>Datos de contacto</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2"><strong>Teléfono:</strong> {selectedCliente.telefono}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {selectedCliente.email}</Typography>
                    <Typography variant="body2"><strong>Dirección:</strong> {selectedCliente.direccion}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={selectedCliente.estado || 'Activo'} color="success" size="small" />
                    {selectedCliente.tipoCliente && (
                      <Chip label={`Tipo: ${selectedCliente.tipoCliente}`} color="info" size="small" />
                    )}
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Vehículos */}
              <Typography variant="subtitle1" gutterBottom>Vehículos</Typography>
              <List>
                {selectedCliente.vehiculos.map(v => (
                  <ListItem key={v.id} sx={{ border: '1px solid #eee', borderRadius: 1, mb: 1 }}>
                    <ListItemText 
                      primary={`${v.marca} ${v.modelo} (${v.patente})`}
                      secondary={`Año: ${v.año || '-'} • Color: ${v.color || '-'} • Km: ${v.kilometraje || '-'} • VIN: ${v.vin || '-'}`}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Talleres */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Talleres</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Próximo turno</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {proximoTurno ? `${new Date(proximoTurno.fecha + 'T00:00:00').toLocaleDateString()} ${proximoTurno.hora || ''}` : '—'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Turnos confirmados</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">{confirmados}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Turnos pendientes</Typography>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">{pendientes}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Vehículo</TableCell>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {turnosOrdenados.length ? turnosOrdenados.map(t => {
                      const vehiculoTexto = t.vehiculo || (selectedCliente.vehiculos.find(v => String(v.id) === String(t.vehiculoId))
                        ? (() => { const v = selectedCliente.vehiculos.find(v => String(v.id) === String(t.vehiculoId)); return `${v.marca} ${v.modelo} ${v.patente}`; })()
                        : '-');
                      return (
                        <TableRow key={t.id} hover>
                          <TableCell>{new Date(t.fecha + 'T00:00:00').toLocaleDateString()}</TableCell>
                          <TableCell>{t.hora}</TableCell>
                          <TableCell>{vehiculoTexto}</TableCell>
                          <TableCell>{t.servicio}</TableCell>
                          <TableCell>
                            <Chip label={t.estado || 'Pendiente'} color={(t.estado === 'Confirmado') ? 'success' : 'warning'} size="small" />
                          </TableCell>
                          <TableCell>{t.observaciones || '-'}</TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Alert severity="info">Sin registros de talleres aún.</Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Alertas */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Alertas</Typography>
                {selectedCliente.alertas && selectedCliente.alertas.length ? (
                  <List>
                    {selectedCliente.alertas.map((a, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={a} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="success">Sin alertas pendientes.</Alert>
                )}
              </Box>

              {/* Acciones rápidas */}
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                <Grid item>
                  <Button variant="outlined" startIcon={<WhatsApp />}>WhatsApp</Button>
                </Grid>
                <Grid item>
                  <Button variant="outlined" startIcon={<Email />}>Enviar Email</Button>
                </Grid>
                <Grid item>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={() => { setOpenHistory(false); onGoToCalendario && onGoToCalendario(); }}
                  >
                    Nuevo Turno
                  </Button>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Alert severity="info">Selecciona un cliente para ver su historial.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistory(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Componente para la pestaña de Calendario estilo Google Calendar
const CalendarioTab = ({ turnos, setTurnos, clientes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openTurnoDialog, setOpenTurnoDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  const [editingTurnoId, setEditingTurnoId] = useState(null); // para editar turnos existentes
  const [turnoData, setTurnoData] = useState({
    fecha: '',
    hora: '',
    clienteId: '',
    vehiculoId: '',
    servicio: '',
    observaciones: '',
    articulos: []
  });
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoCliente: 'Regular'
  });
  const [newVehicleData, setNewVehicleData] = useState({
    marca: '',
    modelo: '',
    año: '',
    patente: '',
    kilometraje: '',
    vin: '',
    color: ''
  });

  // Productos disponibles para seleccionar
  const [productosDisponibles] = useState([
    { id: 1, nombre: 'Filtro de aceite', codigo: 'FO-001', precio: 2500, stock: 25 },
    { id: 2, nombre: 'Aceite 5W30', codigo: 'AC-002', precio: 3200, stock: 5 },
    { id: 3, nombre: 'Pastillas de freno', codigo: 'PF-003', precio: 8500, stock: 0 },
    { id: 4, nombre: 'Filtro de aire', codigo: 'FA-004', precio: 1800, stock: 12 },
    { id: 5, nombre: 'Bujías', codigo: 'BU-005', precio: 1200, stock: 30 },
    { id: 6, nombre: 'Correa de distribución', codigo: 'CD-006', precio: 4500, stock: 8 }
  ]);

  // Generar días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días del mes anterior para completar la primera semana
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Días del próximo mes para completar la última semana
    const totalCells = 42; // 6 semanas × 7 días
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const getTurnosForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return turnos.filter(turno => turno.fecha === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Navegación por semana y día
  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (7 * direction));
      return newDate;
    });
  };

  const navigateDay = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + direction);
      return newDate;
    });
  };

  // Abstracción para botones prev/next según la vista
  const navigatePrev = () => {
    if (viewMode === 'month') return navigateMonth(-1);
    if (viewMode === 'week') return navigateWeek(-1);
    return navigateDay(-1);
  };
  const navigateNext = () => {
    if (viewMode === 'month') return navigateMonth(1);
    if (viewMode === 'week') return navigateWeek(1);
    return navigateDay(1);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setTurnoData({
      ...turnoData,
      fecha: date.toISOString().split('T')[0],
      hora: '',
      clienteId: '',
      vehiculoId: '',
      servicio: '',
      observaciones: '',
      articulos: []
    });
    setOpenTurnoDialog(true);
  };

  const handleSaveTurno = () => {
    if (!turnoData.clienteId || !turnoData.hora || !turnoData.servicio) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (editingTurnoId) {
      // actualizar turno existente
      setTurnos(prev => prev.map(t => t.id === editingTurnoId ? {
        ...t,
        fecha: turnoData.fecha,
        hora: turnoData.hora,
        clienteId: turnoData.clienteId,
        vehiculoId: turnoData.vehiculoId,
        servicio: turnoData.servicio,
        observaciones: turnoData.observaciones,
        articulos: turnoData.articulos,
        clienteNombre: clientes.find(c => c.id === parseInt(turnoData.clienteId))?.nombre || t.clienteNombre
      } : t));
    } else {
      const nuevoTurno = {
        id: Date.now(),
        fecha: turnoData.fecha,
        hora: turnoData.hora,
        clienteId: turnoData.clienteId,
        vehiculoId: turnoData.vehiculoId,
        servicio: turnoData.servicio,
        observaciones: turnoData.observaciones,
        articulos: turnoData.articulos,
        estado: 'Pendiente',
        clienteNombre: clientes.find(c => c.id === parseInt(turnoData.clienteId))?.nombre || 'Cliente Nuevo'
      };
      setTurnos([...turnos, nuevoTurno]);
    }

    setOpenTurnoDialog(false);
    setEditingTurnoId(null);
    resetForms();
  };

  const resetForms = () => {
    setTurnoData({
      fecha: '',
      hora: '',
      clienteId: '',
      vehiculoId: '',
      servicio: '',
      observaciones: '',
      articulos: []
    });
    setNewClientData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      tipoCliente: 'Regular'
    });
    setNewVehicleData({
      marca: '',
      modelo: '',
      año: '',
      patente: '',
      kilometraje: '',
      vin: '',
      color: ''
    });
    setShowNewClientForm(false);
    setShowNewVehicleForm(false);
  };

  const addArticuloToTurno = (producto) => {
    const articuloExistente = turnoData.articulos.find(a => a.id === producto.id);
    if (articuloExistente) {
      setTurnoData({
        ...turnoData,
        articulos: turnoData.articulos.map(a => 
          a.id === producto.id 
            ? { ...a, cantidad: a.cantidad + 1 }
            : a
        )
      });
    } else {
      setTurnoData({
        ...turnoData,
        articulos: [...turnoData.articulos, { ...producto, cantidad: 1 }]
      });
    }
  };

  const removeArticuloFromTurno = (productoId) => {
    setTurnoData({
      ...turnoData,
      articulos: turnoData.articulos.filter(a => a.id !== productoId)
    });
  };

  const updateArticuloCantidad = (productoId, cantidad) => {
    if (cantidad <= 0) {
      removeArticuloFromTurno(productoId);
      return;
    }
    setTurnoData({
      ...turnoData,
      articulos: turnoData.articulos.map(a => 
        a.id === productoId 
          ? { ...a, cantidad: cantidad }
          : a
      )
    });
  };

  const getClienteVehiculos = (clienteId) => {
    const cliente = clientes.find(c => c.id === parseInt(clienteId));
    return cliente?.vehiculos || [];
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Calcular fechas de la semana actual (lunes a domingo)
  const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = domingo
    // queremos lunes como inicio: calcular offset desde lunes
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    return Array.from({ length: 7 }, (_, i) => {
      const di = new Date(monday);
      di.setDate(monday.getDate() + i);
      return di;
    });
  };

  // Horas a mostrar en vista semanal (08:00 a 20:00 cada 30 min)
  const weekHours = (() => {
    const slots = [];
    const startHour = 8;
    const endHour = 20;
    for (let h = startHour; h <= endHour; h++) {
      const hh = h.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
      if (h < endHour) slots.push(`${hh}:30`);
    }
    return slots;
  })();

  const weekDates = getWeekDates(currentDate);

  // Click en franja horaria para crear turno con fecha y hora preseleccionadas
  const handleSlotClick = (date, hourStr) => {
    setSelectedDate(date);
    setTurnoData({
      ...turnoData,
      fecha: date.toISOString().split('T')[0],
      hora: hourStr,
      clienteId: '',
      vehiculoId: '',
      servicio: '',
      observaciones: '',
      articulos: []
    });
    setEditingTurnoId(null);
    setOpenTurnoDialog(true);
  };

  // Drag & Drop reprogramación
  const handleDragStart = (e, turnoId) => {
    e.dataTransfer.setData('text/plain', String(turnoId));
  };
  const handleDrop = (e, date, hourStr) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    const turnoId = parseInt(idStr, 10);
    if (!turnoId) return;
    const fecha = date.toISOString().split('T')[0];
    setTurnos(prev => prev.map(t => t.id === turnoId ? { ...t, fecha, hora: hourStr } : t));
  };
  const allowDrop = (e) => e.preventDefault();

  return (
    <Box sx={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header del calendario mejorado */}
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={navigatePrev}
              sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton 
              onClick={navigateNext}
              sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
            >
              <ChevronRight />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<Today />}
              onClick={() => setCurrentDate(new Date())}
              sx={{ ml: 2 }}
            >
              Hoy
            </Button>
          </Box>
          
          {/* Selector de vista */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'day' ? 'contained' : 'outlined'}
              startIcon={<CalendarViewDay />}
              onClick={() => setViewMode('day')}
              size="small"
            >
              Día
            </Button>
            <Button
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
              startIcon={<CalendarViewWeek />}
              onClick={() => setViewMode('week')}
              size="small"
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'contained' : 'outlined'}
              startIcon={<CalendarViewMonth />}
              onClick={() => setViewMode('month')}
              size="small"
            >
              Mes
            </Button>
          </Box>
        </Box>
        
        {/* Estadísticas rápidas */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="success.contrastText">
                {turnos.filter(t => t.estado === 'Confirmado').length}
              </Typography>
              <Typography variant="body2" color="success.contrastText">
                Confirmados
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="warning.contrastText">
                {turnos.filter(t => t.estado === 'Pendiente').length}
              </Typography>
              <Typography variant="body2" color="warning.contrastText">
                Pendientes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="info.contrastText">
                {turnos.length}
              </Typography>
              <Typography variant="body2" color="info.contrastText">
                Total Turnos
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Calendario con vistas mejoradas */}
      <Paper elevation={2} sx={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'month' && (
          <Box sx={{ flexGrow: 1, p: 2, minWidth: 1200 }}>
            {/* Días de la semana */}
            <Grid container sx={{ mb: 1 }}>
              {dayNames.map((dayName) => (
                <Grid item xs key={dayName} sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {dayName}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* Días del mes con altura ajustable y scroll vertical disponible */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {Array.from({ length: 6 }, (_, weekIndex) => (
                <Grid container key={weekIndex} sx={{ flex: 1, minHeight: 140 }}>
                  {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                    const turnosDelDia = getTurnosForDate(day.date);
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const globalIndex = weekIndex * 7 + dayIndex;
                    
                    return (
                      <Grid item xs key={globalIndex} sx={{ height: '100%', p: 0.5 }}>
                        <Box
                          sx={{
                            height: '100%',
                            minHeight: 130,
                            p: 1.5,
                            border: isToday ? '3px solid' : '1px solid',
                            borderColor: isToday ? 'primary.main' : '#e0e0e0',
                            cursor: day.isCurrentMonth ? 'pointer' : 'default',
                            bgcolor: day.isCurrentMonth ? 
                              (isToday ? 'primary.light' : 'white') : 
                              '#f5f5f5',
                            '&:hover': day.isCurrentMonth ? { 
                              bgcolor: isToday ? 'primary.light' : '#f0f8ff',
                              borderColor: 'primary.main',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              transform: 'translateY(-2px)',
                              transition: 'all 0.3s ease'
                            } : {},
                            borderRadius: 3,
                            boxShadow: isToday ? 
                              '0 0 20px rgba(25, 118, 210, 0.3)' : 
                              '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                          }}
                          onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                        >
                          {/* Número del día */}
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 1
                          }}>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: isToday ? 'bold' : day.isCurrentMonth ? 'medium' : 'normal',
                                color: day.isCurrentMonth ? 
                                  (isToday ? 'primary.main' : 'text.primary') : 
                                  'text.disabled',
                                fontSize: isToday ? '1.5rem' : '1.2rem'
                              }}
                            >
                              {day.date.getDate()}
                            </Typography>
                            
                            {/* Indicador de cantidad de turnos */}
                            {turnosDelDia.length > 0 && (
                              <Chip
                                label={turnosDelDia.length}
                                size="small"
                                sx={{
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  minWidth: 24,
                                  height: 24
                                }}
                              />
                            )}
                          </Box>
                          
                          {/* Turnos del día */}
                          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            {turnosDelDia.slice(0, 3).map((turno, idx) => (
                              <Box
                                key={turno.id}
                                sx={{
                                  mb: 0.5,
                                  p: 1,
                                  bgcolor: turno.estado === 'Confirmado' ? 'success.main' : 'warning.main',
                                  borderRadius: 2,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  border: '1px solid rgba(255,255,255,0.2)'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTurnoId(turno.id);
                                  setTurnoData({
                                    fecha: turno.fecha,
                                    hora: turno.hora,
                                    clienteId: String(turno.clienteId || ''),
                                    vehiculoId: String(turno.vehiculoId || ''),
                                    servicio: turno.servicio || '',
                                    observaciones: turno.observaciones || '',
                                    articulos: turno.articulos || []
                                  });
                                  setOpenTurnoDialog(true);
                                }}
                              >
                                <Typography variant="caption" sx={{ 
                                  fontSize: '0.8rem', 
                                  fontWeight: 'bold',
                                  color: 'white',
                                  display: 'block',
                                  lineHeight: 1.2
                                }}>
                                  {turno.hora}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  fontSize: '0.75rem',
                                  color: 'rgba(255,255,255,0.9)',
                                  display: 'block',
                                  lineHeight: 1.1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {turno.clienteNombre.split(' ')[0]}
                                </Typography>
                              </Box>
                            ))}
                            
                            {turnosDelDia.length > 3 && (
                              <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                                <Chip 
                                  label={`+${turnosDelDia.length - 3} más`}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    height: 22,
                                    bgcolor: 'info.main',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => { e.stopPropagation(); setCurrentDate(day.date); setViewMode('day'); }}
                                />
                              </Box>
                            )}
                          </Box>
                          
                          {/* Indicador de día especial */}
                          {isToday && (
                            <Box sx={{ 
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 8,
                              height: 8,
                              bgcolor: 'primary.main',
                              borderRadius: '50%',
                              boxShadow: '0 0 6px rgba(25, 118, 210, 0.6)'
                            }} />
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              ))}
            </Box>
          </Box>
        )}

        {viewMode === 'week' && (
          <Box sx={{ flexGrow: 1, p: 2, minWidth: 1100, overflow: 'auto' }}>
            {/* Cabecera de la semana: columna vacía para horas + 7 días */}
            <Grid container sx={{ borderBottom: '1px solid #e0e0e0' }}>
              <Grid item sx={{ width: 90 }} />
              {weekDates.map((d, idx) => (
                <Grid key={idx} item xs sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {dayNames[d.getDay()]}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color={d.toDateString() === new Date().toDateString() ? 'primary.main' : 'text.primary'}>
                    {d.getDate()}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* Grilla por horas */}
            <Box sx={{ maxHeight: '100%', overflowY: 'auto' }}>
              {weekHours.map((hour) => (
                <Grid container key={hour} sx={{ borderBottom: '1px dashed #eee' }}>
                  {/* Columna de hora */}
                  <Grid item sx={{ width: 90, p: 1 }}>
                    <Typography variant="caption" color="text.secondary">{hour}</Typography>
                  </Grid>
                  {/* Columnas de días */}
                  {weekDates.map((d, dayIdx) => {
                    const dateStr = d.toISOString().split('T')[0];
                    const turnosDiaHora = turnos.filter(t => t.fecha === dateStr && t.hora?.slice(0,5) === hour.slice(0,5));
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <Grid key={`${dateStr}-${dayIdx}`} item xs sx={{ p: 0.5 }}>
                        <Box
                          onClick={() => handleSlotClick(d, hour)}
                          onDragOver={allowDrop}
                          onDrop={(e) => handleDrop(e, d, hour)}
                          sx={{
                            position: 'relative',
                            height: 48,
                            border: '1px solid',
                            borderColor: isToday ? 'primary.light' : '#eee',
                            bgcolor: '#fff',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#f7fbff' }
                          }}
                        >
                          {/* Turnos en esta franja */}
                          <Box sx={{ position: 'absolute', inset: 4, overflow: 'hidden' }}>
                            {turnosDiaHora.map((turno) => (
                              <Box
                                key={turno.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, turno.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // abrir en modo edición
                                  setEditingTurnoId(turno.id);
                                  setTurnoData({
                                    fecha: turno.fecha,
                                    hora: turno.hora,
                                    clienteId: String(turno.clienteId || ''),
                                    vehiculoId: String(turno.vehiculoId || ''),
                                    servicio: turno.servicio || '',
                                    observaciones: turno.observaciones || '',
                                    articulos: turno.articulos || []
                                  });
                                  setOpenTurnoDialog(true);
                                }}
                                sx={{
                                  mb: 0.5,
                                  p: 0.75,
                                  bgcolor: turno.estado === 'Confirmado' ? 'success.main' : 'warning.main',
                                  color: 'white',
                                  borderRadius: 1,
                                  boxShadow: 1,
                                  fontSize: '0.75rem',
                                  lineHeight: 1.1,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {turno.hora} • {turno.clienteNombre}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              ))}
            </Box>
          </Box>
        )}

        {viewMode === 'day' && (
          <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h5" gutterBottom textAlign="center" color="primary.main">
              {currentDate.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, minHeight: 400 }}>
                  {getTurnosForDate(currentDate).length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        No hay turnos programados para este día
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleDateClick(currentDate)}
                        sx={{ mt: 2 }}
                      >
                        Agregar Turno
                      </Button>
                    </Box>
                  ) : (
                    <List>
                      {getTurnosForDate(currentDate).map((turno) => (
                        <ListItem key={turno.id} sx={{ 
                          mb: 2, 
                          bgcolor: turno.estado === 'Confirmado' ? 'success.light' : 'warning.light',
                          borderRadius: 2,
                          boxShadow: 1
                        }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: turno.estado === 'Confirmado' ? 'success.main' : 'warning.main' 
                            }}>
                              <Event />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="h6" fontWeight="bold">
                                {turno.hora} - {turno.clienteNombre}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                  {turno.vehiculo} - {turno.servicio}
                                </Typography>
                                {turno.observaciones && (
                                  <Typography variant="body2" color="text.secondary">
                                    {turno.observaciones}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip 
                              label={turno.estado} 
                              color={turno.estado === 'Confirmado' ? 'success' : 'warning'}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Acciones Rápidas
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleDateClick(currentDate)}
                    sx={{ mb: 2 }}
                  >
                    Nuevo Turno
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CalendarViewMonth />}
                    onClick={() => setViewMode('month')}
                  >
                    Ver Mes Completo
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Dialog para nuevo turno completo */}
      <Dialog open={openTurnoDialog} onClose={() => { setOpenTurnoDialog(false); setEditingTurnoId(null); }} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Event />
            Nuevo Turno de Taller
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Datos del Turno</Typography>
          <Grid container spacing={3}>
            {/* Fecha y Hora */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha del Turno"
                value={turnoData.fecha}
                onChange={(e) => setTurnoData({...turnoData, fecha: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Hora del Turno"
                value={turnoData.hora}
                onChange={(e) => setTurnoData({...turnoData, hora: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Selección de Cliente */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" gutterBottom>Cliente y Vehículo</Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Cliente</InputLabel>
                  <Select 
                    value={turnoData.clienteId} 
                    label="Cliente"
                    onChange={(e) => {
                      setTurnoData({...turnoData, clienteId: e.target.value, vehiculoId: ''});
                      setShowNewClientForm(false);
                    }}
                  >
                    {clientes.map((cliente) => (
                      <MenuItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre} - {cliente.telefono}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  sx={{ minWidth: 150 }}
                >
                  Cliente Nuevo
                </Button>
              </Box>

              {/* Formulario Cliente Nuevo */}
              {showNewClientForm && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Datos del Nuevo Cliente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre Completo"
                        value={newClientData.nombre}
                        onChange={(e) => setNewClientData({...newClientData, nombre: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={newClientData.telefono}
                        onChange={(e) => setNewClientData({...newClientData, telefono: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Dirección"
                        value={newClientData.direccion}
                        onChange={(e) => setNewClientData({...newClientData, direccion: e.target.value})}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Grid>

            {/* Selección de Vehículo */}
            {turnoData.clienteId && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Vehículo</InputLabel>
                    <Select 
                      value={turnoData.vehiculoId} 
                      label="Vehículo"
                      onChange={(e) => {
                        setTurnoData({...turnoData, vehiculoId: e.target.value});
                        setShowNewVehicleForm(false);
                      }}
                    >
                      {getClienteVehiculos(turnoData.clienteId).map((vehiculo) => (
                        <MenuItem key={vehiculo.id} value={vehiculo.id}>
                          {vehiculo.marca} {vehiculo.modelo} - {vehiculo.patente}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<DirectionsCar />}
                    onClick={() => setShowNewVehicleForm(!showNewVehicleForm)}
                    sx={{ minWidth: 150 }}
                  >
                    Vehículo Nuevo
                  </Button>
                </Box>

                {/* Formulario Vehículo Nuevo */}
                {showNewVehicleForm && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Datos del Nuevo Vehículo
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Marca"
                          value={newVehicleData.marca}
                          onChange={(e) => setNewVehicleData({...newVehicleData, marca: e.target.value})}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Modelo"
                          value={newVehicleData.modelo}
                          onChange={(e) => setNewVehicleData({...newVehicleData, modelo: e.target.value})}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Año"
                          type="number"
                          value={newVehicleData.año}
                          onChange={(e) => setNewVehicleData({...newVehicleData, año: e.target.value})}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Patente"
                          value={newVehicleData.patente}
                          onChange={(e) => setNewVehicleData({...newVehicleData, patente: e.target.value})}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Kilometraje"
                          type="number"
                          value={newVehicleData.kilometraje}
                          onChange={(e) => setNewVehicleData({...newVehicleData, kilometraje: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Color"
                          value={newVehicleData.color}
                          onChange={(e) => setNewVehicleData({...newVehicleData, color: e.target.value})}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Grid>
            )}

            {/* Servicio y Observaciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Servicio/Trabajo a realizar"
                value={turnoData.servicio}
                onChange={(e) => setTurnoData({...turnoData, servicio: e.target.value})}
                placeholder="Ej: Cambio de aceite, Service 10.000 km, Reparación frenos"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={turnoData.observaciones}
                onChange={(e) => setTurnoData({...turnoData, observaciones: e.target.value})}
                multiline
                rows={3}
                placeholder="Observaciones adicionales sobre el trabajo..."
              />
            </Grid>

            {/* Sección de Artículos/Repuestos */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom color="primary">
                Repuestos y Artículos Necesarios
              </Typography>
              
              {/* Lista de productos disponibles */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Seleccionar Repuestos:
                </Typography>
                <Grid container spacing={1}>
                  {productosDisponibles.map((producto) => (
                    <Grid item xs={12} sm={6} md={4} key={producto.id}>
                      <Card sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 },
                        border: turnoData.articulos.find(a => a.id === producto.id) ? '2px solid' : '1px solid',
                        borderColor: turnoData.articulos.find(a => a.id === producto.id) ? 'primary.main' : 'grey.300'
                      }}
                      onClick={() => addArticuloToTurno(producto)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {producto.nombre}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {producto.stock === 0 ? (
                                <Cancel sx={{ color: 'error.main', fontSize: 16 }} />
                              ) : producto.stock <= 5 ? (
                                <Warning sx={{ color: 'warning.main', fontSize: 16 }} />
                              ) : (
                                <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                              )}
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {producto.codigo}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            ${producto.precio.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: {producto.stock}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Artículos seleccionados */}
              {turnoData.articulos.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Artículos Seleccionados:
                  </Typography>
                  <List>
                    {turnoData.articulos.map((articulo) => (
                      <ListItem key={articulo.id} sx={{ 
                        bgcolor: 'grey.50', 
                        borderRadius: 1, 
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'grey.300'
                      }}>
                        <ListItemText
                          primary={articulo.nombre}
                          secondary={`${articulo.codigo} - $${articulo.precio.toLocaleString()}`}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small"
                            onClick={() => updateArticuloCantidad(articulo.id, articulo.cantidad - 1)}
                          >
                            <Remove />
                          </IconButton>
                          <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                            {articulo.cantidad}
                          </Typography>
                          <IconButton 
                            size="small"
                            onClick={() => updateArticuloCantidad(articulo.id, articulo.cantidad + 1)}
                          >
                            <Add />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => removeArticuloFromTurno(articulo.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="h6" color="primary.dark">
                      Total Estimado: ${turnoData.articulos.reduce((total, art) => 
                        total + (art.precio * art.cantidad), 0
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={() => {setOpenTurnoDialog(false); setEditingTurnoId(null); resetForms();}} size="large">
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTurno}
            size="large"
            startIcon={<Save />}
          >
            Crear Turno
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Componente para la pestaña de Presupuestos (similar a Venta Principal)
const PresupuestosTab = ({ clientes }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Productos de muestra para el taller
  const [productos] = useState([
    { id: 1, nombre: 'Filtro de aceite', codigo: 'FO-001', precio: 2500, stock: 25, categoria: 'Filtros' },
    { id: 2, nombre: 'Aceite 5W30', codigo: 'AC-002', precio: 3200, stock: 5, categoria: 'Lubricantes' },
    { id: 3, nombre: 'Pastillas de freno', codigo: 'PF-003', precio: 8500, stock: 0, categoria: 'Frenos' },
    { id: 4, nombre: 'Filtro de aire', codigo: 'FA-004', precio: 1800, stock: 12, categoria: 'Filtros' },
    { id: 5, nombre: 'Bujías', codigo: 'BU-005', precio: 1200, stock: 30, categoria: 'Encendido' }
  ]);

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (producto) => {
    const existingItem = cartItems.find(item => item.id === producto.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...producto, cantidad: 1 }]);
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'error.main';
    if (stock <= 10) return 'warning.main';
    return 'success.main';
  };

  const getStockIcon = (stock) => {
    if (stock === 0) return <Cancel sx={{ color: 'red' }} />;
    if (stock <= 10) return <Circle sx={{ color: 'orange' }} />;
    return <CheckCircle sx={{ color: 'green' }} />;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const total = subtotal;

  return (
    <Box sx={{ display: 'flex', height: '80vh' }}>
      {/* Panel principal de productos */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 2, 
        mr: cartOpen ? '400px' : '0px',
        transition: 'margin-right 0.3s ease'
      }}>
        {/* Barra de búsqueda */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Buscar productos por nombre o código"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Paper>

        {/* Selección de cliente */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Cliente</InputLabel>
            <Select
              value={selectedCustomer?.id || ''}
              label="Seleccionar Cliente"
              onChange={(e) => {
                const cliente = clientes.find(c => c.id === e.target.value);
                setSelectedCustomer(cliente);
              }}
            >
              {clientes.map((cliente) => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre} - {cliente.telefono}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Lista de productos */}
        <Grid container spacing={2}>
          {filteredProductos.map((producto) => (
            <Grid item xs={12} sm={6} md={4} key={producto.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      {producto.nombre}
                    </Typography>
                    {getStockIcon(producto.stock)}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Código: {producto.codigo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Categoría: {producto.categoria}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    color={getStockColor(producto.stock)}
                    gutterBottom
                  >
                    Stock: {producto.stock}
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    ${producto.precio.toLocaleString()}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  {producto.stock > 0 ? (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => addToCart(producto)}
                    >
                      Agregar
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      startIcon={<ShoppingBag />}
                    >
                      Pedir al Local
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Botón para abrir carrito */}
      {!cartOpen && cartItems.length > 0 && (
        <Button
          variant="contained"
          color="primary"
          sx={{
            position: 'fixed',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1000,
            minWidth: 60,
            height: 60,
            borderRadius: '50%'
          }}
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart />
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'error.main',
              color: 'white',
              borderRadius: '50%',
              width: 20,
              height: 20,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {cartItems.length}
          </Box>
        </Button>
      )}

      {/* Panel del carrito */}
      {cartOpen && (
        <Paper
          sx={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: 400,
            height: '100vh',
            p: 2,
            overflowY: 'auto',
            zIndex: 1200,
            borderLeft: '1px solid #e0e0e0'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Presupuesto</Typography>
            <IconButton onClick={() => setCartOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          {selectedCustomer && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light' }}>
              <Typography variant="subtitle2" color="primary.contrastText">
                Cliente: {selectedCustomer.nombre}
              </Typography>
              <Typography variant="body2" color="primary.contrastText">
                {selectedCustomer.telefono}
              </Typography>
            </Paper>
          )}

          {cartItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No hay productos en el presupuesto
            </Typography>
          ) : (
            <>
              {cartItems.map((item) => (
                <Paper key={item.id} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="subtitle2">{item.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${item.precio.toLocaleString()} x {item.cantidad}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    ${(item.precio * item.cantidad).toLocaleString()}
                  </Typography>
                </Paper>
              ))}
              
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="h6" textAlign="right">
                  Total: ${total.toLocaleString()}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 2 }}
                  disabled={!selectedCustomer}
                >
                  Generar Presupuesto
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

// Componente para la pestaña de Stock con semáforos
const StockTab = () => {
  const [productos] = useState([
    { id: 1, nombre: 'Filtro de aceite', codigo: 'FO-001', stock: 25, minimo: 10, estado: 'alto' },
    { id: 2, nombre: 'Aceite 5W30', codigo: 'AC-002', stock: 5, minimo: 15, estado: 'bajo' },
    { id: 3, nombre: 'Pastillas de freno', codigo: 'PF-003', stock: 0, minimo: 8, estado: 'agotado' },
    { id: 4, nombre: 'Filtro de aire', codigo: 'FA-004', stock: 12, minimo: 10, estado: 'medio' }
  ]);

  const getStockIcon = (estado) => {
    switch (estado) {
      case 'alto': return <CheckCircle sx={{ color: 'green' }} />;
      case 'medio': return <Circle sx={{ color: 'orange' }} />;
      case 'bajo': return <Circle sx={{ color: 'red' }} />;
      case 'agotado': return <Cancel sx={{ color: 'red' }} />;
      default: return <Circle />;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Control de Stock con Semáforos</Typography>
        <Typography variant="body2" color="text.secondary">
          🟢 Stock Alto | 🟡 Stock Medio | 🔴 Stock Bajo | ❌ Agotado
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Estado</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Stock Actual</TableCell>
              <TableCell>Stock Mínimo</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productos.map((producto) => (
              <TableRow key={producto.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStockIcon(producto.estado)}
                    <Typography variant="body2" fontWeight="bold">
                      {producto.estado.toUpperCase()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {producto.nombre}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {producto.codigo}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    color={producto.stock === 0 ? 'error.main' : producto.stock <= producto.minimo ? 'warning.main' : 'success.main'}
                  >
                    {producto.stock}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {producto.minimo}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {(producto.estado === 'bajo' || producto.estado === 'agotado') && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShoppingBag />}
                      color="primary"
                    >
                      Pedir al Local
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SistemaTaller;
