import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Checkbox,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Assignment,
  Print,
  CloudUpload,
  Label,
  Add,
  FilterList,
  DirectionsCar,
  Info,
  Close,
  Edit,
  Bookmark,
  MoreVert,
  ViewList,
  AddShoppingCart,
  Clear,
  AutoAwesome,
} from '@mui/icons-material';
import NuevoArticulo from '../NuevoArticulo';
import EnriquecerArticulo from '../EnriquecerArticulo';
import EnriquecerMasivo from '../EnriquecerMasivo';
import apiService from '../../utils/api';

const PromotiveArticulos = () => {
  const [activeTab, setActiveTab] = useState(0); // 0=Artículos 1=Gestión 2=Enriquecedor
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAutopartes, setFilterAutopartes] = useState('Autopartes');
  const [filterTodas, setFilterTodas] = useState('Todas');
  const [filterModelo, setFilterModelo] = useState('');
  const [ordenar, setOrdenar] = useState('auto');
  const [mostrar, setMostrar] = useState('todos');
  const [ordenSecundario, setOrdenSecundario] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [articuloEnriquecer, setArticuloEnriquecer] = useState(null);

  // Real articles from API
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesError, setArticlesError] = useState(null);
  const [totalArticles, setTotalArticles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  
  // Estados para conexión y búsqueda de vehículos
  const [isConnected, setIsConnected] = useState(false);
  const [searchType, setSearchType] = useState('plate'); // 'plate' o 'vin'
  const [searchValue, setSearchValue] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [includePartes, setIncludePartes] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [autoConnecting, setAutoConnecting] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const showVehicleSearch = Boolean(anchorEl);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);

  // ── Boxer conexión ────────────────────────────────────────────────────────
  const [boxerStatus, setBoxerStatus] = useState(null);
  const [boxerConnecting, setBoxerConnecting] = useState(false);
  const [showBoxerLogin, setShowBoxerLogin] = useState(false);
  const [boxerUrl, setBoxerUrl] = useState('');
  const [boxerUser, setBoxerUser] = useState('');
  const [boxerPass, setBoxerPass] = useState('');
  const [boxerLoginError, setBoxerLoginError] = useState('');

  // ── Autopartes AR conexión ────────────────────────────────────────────────
  const [arStatus, setArStatus] = useState(null);
  const [arConnecting, setArConnecting] = useState(false);
  const [showArLogin, setShowArLogin] = useState(false);
  const [arUser, setArUser] = useState('');
  const [arPass, setArPass] = useState('');
  const [arLoginError, setArLoginError] = useState('');
  const [enriquecerMasivoArts, setEnriquecerMasivoArts] = useState(null);

  const fetchArticles = async (searchQ = null, page = 1) => {
    if (!searchQ || searchQ.trim().length < 2) return;
    setLoadingArticles(true);
    setArticlesError(null);
    const fmt = n => parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
    const warnings = [];

    const [boxerRes, promotiveRes, arRes] = await Promise.allSettled([
      apiService.getBoxerArticulos(searchQ.trim(), page),
      apiService.searchPromotiveParts(searchQ.trim(), page, 50),
      apiService.searchAutpartesAR(searchQ.trim(), 50, 0),
    ]);

    const merged = [];

    // ── Boxer ──
    if (boxerRes.status === 'fulfilled') {
      (boxerRes.value.articulos || []).forEach(a => {
        const costoConIva = a.precioCosto * (1 + (a.iva || 21) / 100);
        const ventaConIva = a.precioVenta * (1 + (a.iva || 21) / 100);
        merged.push({
          id: `boxer-${a.id}`,
          fuente: 'Boxer',
          repuestoAgrupado: '—',
          articulo: a.articulo || '—',
          original: a.original || '—',
          auxiliar: a.auxiliar || '—',
          descripcion: a.descripcion || '—',
          costoSinIva: fmt(a.precioCosto),
          costoConIva: fmt(costoConIva),
          ventaSinIva: fmt(a.precioVenta),
          ventaConIva: fmt(ventaConIva),
          stock: a.stock ?? '—',
          stockDeseado: '—',
          marca: a.marca || '—',
          proveedor: a.proveedor || '—',
        });
      });
    } else {
      const msg = boxerRes.reason?.response?.data?.detail || boxerRes.reason?.message || 'Error Boxer';
      warnings.push(`Boxer: ${msg}`);
      console.warn('[fetchArticles] Boxer error:', msg);
    }

    // ── Promotive ──
    if (promotiveRes.status === 'fulfilled') {
      const parts = promotiveRes.value?.parts || promotiveRes.value?.results || promotiveRes.value?.data || [];
      parts.forEach((p, i) => {
        merged.push({
          id: `promotive-${p.id || i}`,
          fuente: 'Promotive',
          repuestoAgrupado: p.category || '—',
          articulo: p.code || p.part_number || '—',
          original: p.oem_code || '—',
          auxiliar: '—',
          descripcion: p.name || p.description || '—',
          costoSinIva: '—',
          costoConIva: '—',
          ventaSinIva: fmt(p.price || 0),
          ventaConIva: fmt(p.price || 0),
          stock: p.stock ?? '—',
          stockDeseado: '—',
          marca: p.brand || '—',
          proveedor: p.seller?.name || '—',
        });
      });
    } else {
      warnings.push(`Promotive: ${promotiveRes.reason?.response?.data?.detail || promotiveRes.reason?.message || 'Error'}`);
    }

    // ── Autopartes AR ──
    if (arRes.status === 'fulfilled') {
      (arRes.value?.items || []).forEach((a, i) => {
        merged.push({
          id: `ar-${a.id || i}`,
          fuente: 'Autopartes AR',
          repuestoAgrupado: a.categoria || '—',
          articulo: a.codigo_fabricante || '—',
          original: (a.oem_numbers || [])[0] || '—',
          auxiliar: '—',
          descripcion: a.nombre || '—',
          costoSinIva: '—',
          costoConIva: '—',
          ventaSinIva: fmt(a.precio_lista || 0),
          ventaConIva: fmt(a.precio_lista || 0),
          stock: a.stock_resumen ?? '—',
          stockDeseado: '—',
          marca: a.fabricante || '—',
          proveedor: (a.proveedores?.[0]?.nombre) || '—',
        });
      });
    } else {
      warnings.push(`Autopartes AR: ${arRes.reason?.response?.data?.detail || arRes.reason?.message || 'Error'}`);
    }

    setArticles(merged);
    setTotalArticles(merged.length);
    setNumPages(1);
    setLoadingArticles(false);

    if (warnings.length > 0 && merged.length === 0) {
      setArticlesError(warnings.join(' | '));
    } else if (warnings.length > 0) {
      setArticlesError(`Algunas fuentes fallaron: ${warnings.join(' | ')}`);
    }
  };

  // generateArticles kept for reference only — no longer used
  const generateArticles = () => {
    const marcas = ['Bosch', 'NGK', 'Mann Filter', 'Mahle', 'SKF', 'Gates', 'Valeo', 'Denso', 'Brembo', 'Monroe'];
    const rubros = ['Motor', 'Frenos', 'Suspensión', 'Transmisión', 'Eléctrico', 'Filtros', 'Refrigeración'];
    const subrubros = ['Repuestos', 'Accesorios', 'Consumibles', 'Originales', 'Alternativos'];
    const proveedores = ['Proveedor A', 'Proveedor B', 'Proveedor C', 'Distribuidora XYZ', 'Importadora ABC'];
    const ubicaciones = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2'];
    const descripciones = [
      'Filtro de aceite', 'Pastillas de freno', 'Amortiguador', 'Bujía', 'Correa de distribución',
      'Bomba de agua', 'Alternador', 'Motor de arranque', 'Radiador', 'Termostato',
      'Filtro de aire', 'Filtro de combustible', 'Disco de freno', 'Rotula', 'Bieleta',
      'Kit de embrague', 'Volante motor', 'Sensor de oxígeno', 'Bobina de encendido', 'Batería'
    ];

    const articles = [];
    for (let i = 1; i <= 100; i++) {
      const marca = marcas[Math.floor(Math.random() * marcas.length)];
      const desc = descripciones[Math.floor(Math.random() * descripciones.length)];
      const costo = (Math.random() * 50000 + 5000).toFixed(2);
      const lista = (parseFloat(costo) * 1.3).toFixed(2);
      const venta = (parseFloat(costo) * 1.5).toFixed(2);
      
      const costoConIva = (parseFloat(costo) * 1.21).toFixed(2);
      const ventaConIva = (parseFloat(venta) * 1.21).toFixed(2);
      articles.push({
        id: i,
        repuestoAgrupado: Math.random() > 0.5 ? `Grupo ${Math.floor(Math.random() * 20) + 1}` : '—',
        articulo: `ART${String(i).padStart(5, '0')}`,
        original: Math.random() > 0.4 ? `OEM${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}` : '—',
        auxiliar: Math.random() > 0.5 ? `AUX${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}` : '—',
        descripcion: `${desc} ${marca}`,
        marca: marca,
        rubro: rubros[Math.floor(Math.random() * rubros.length)],
        subrubro: subrubros[Math.floor(Math.random() * subrubros.length)],
        costoSinIva: parseFloat(costo).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
        costoConIva: parseFloat(costoConIva).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
        ventaSinIva: parseFloat(venta).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
        ventaConIva: parseFloat(ventaConIva).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
        stock: Math.floor(Math.random() * 50) - 2,
        stockDeseado: Math.floor(Math.random() * 100) + 20,
        proveedor: proveedores[Math.floor(Math.random() * proveedores.length)],
        ubicacion: ubicaciones[Math.floor(Math.random() * ubicaciones.length)],
      });
    }
    return articles;
  };

  const handleFilterArticles = () => {
    if (!vehicleData) {
      alert('Primero debes buscar un vehículo');
      return;
    }
    
    if (isFiltered) {
      // Si ya está filtrado, mostrar todos
      setIsFiltered(false);
      setFilteredArticles([]);
    } else {
      // Filtrar y mostrar solo 10 artículos
      const filtered = articles.slice(0, 10);
      setFilteredArticles(filtered);
      setIsFiltered(true);
    }
  };

  const displayedArticles = isFiltered ? filteredArticles : articles;

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Buscar artículos solo cuando el término tiene 2+ caracteres (debounced)
  useEffect(() => {
    if (searchTerm.length < 2) {
      setArticles([]);
      setTotalArticles(0);
      setNumPages(1);
      setCurrentPage(1);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchArticles(searchTerm, 1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Re-fetch cuando cambia página (solo si hay búsqueda activa)
  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchArticles(searchTerm, currentPage);
    }
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/promotive/status');
      const data = await response.json();
      setConnectionStatus(data);
      setIsConnected(data.connected && data.token_valid);
    } catch (error) {
      console.error('Error checking status:', error);
    }
    try {
      const r2 = await fetch('/api/boxer-demo/status');
      setBoxerStatus(await r2.json());
    } catch (e) { /* sin boxer */ }
    try {
      const r3 = await fetch('/api/autopartes-ar/status');
      setArStatus(await r3.json());
    } catch (e) { /* sin ar */ }
  };

  const handleBoxerLogin = async () => {
    setBoxerConnecting(true);
    setBoxerLoginError('');
    try {
      const r = await fetch('/api/boxer-demo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: boxerUrl, username: boxerUser, password: boxerPass }),
      });
      const data = await r.json();
      if (data.success) {
        setShowBoxerLogin(false);
        const r2 = await fetch('/api/boxer-demo/status');
        setBoxerStatus(await r2.json());
      } else {
        setBoxerLoginError(data.detail || 'Error al conectar');
      }
    } catch (e) {
      setBoxerLoginError('No se pudo conectar');
    } finally {
      setBoxerConnecting(false);
    }
  };

  const handleArLogin = async () => {
    setArConnecting(true);
    setArLoginError('');
    try {
      const r = await fetch('/api/autopartes-ar/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: arUser, password: arPass }),
      });
      const data = await r.json();
      if (data.success) {
        setShowArLogin(false);
        const r2 = await fetch('/api/autopartes-ar/status');
        setArStatus(await r2.json());
      } else {
        setArLoginError(data.detail || 'Credenciales inválidas');
      }
    } catch (e) {
      setArLoginError('No se pudo conectar');
    } finally {
      setArConnecting(false);
    }
  };

  const handleConnect = async () => {
    setAutoConnecting(true);
    try {
      const response = await fetch('/api/promotive/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: "",
          client_secret: "",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsConnected(true);
        await checkConnectionStatus();
      } else {
        alert('Error al conectar: ' + data.message);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Error al conectar con la API');
    } finally {
      setAutoConnecting(false);
    }
  };

  const handleSearchVehicle = async () => {
    if (!searchValue.trim()) {
      alert('Por favor ingresa una patente o VIN');
      return;
    }

    // Si no está conectado, conectar automáticamente
    if (!isConnected) {
      await handleConnect();
    }

    setLoadingVehicle(true);
    setVehicleData(null);

    try {
      const params = new URLSearchParams({
        [searchType]: searchValue.trim(),
        include_parts: includePartes,
      });

      const response = await fetch(`/api/promotive/vehicle/complete?${params}`);
      const data = await response.json();

      if (data.success) {
        setVehicleData(data.data);
      } else {
        alert('Vehículo no encontrado: ' + data.message);
      }
    } catch (error) {
      console.error('Error searching vehicle:', error);
      alert('Error en la búsqueda');
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
    setSelectedRows(e.target.checked ? displayedArticles.map(a => a.id) : []);
  };
  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const btnGray = {
    fontSize: '0.73rem', color: '#444', border: '1px solid #ddd',
    bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' },
    textTransform: 'none', px: 1.5, py: 0.6, minWidth: 'auto',
  };
  const btnIcon = { fontSize: 14 };

  if (showNuevo) return <NuevoArticulo onBack={() => setShowNuevo(false)} />;
  if (articuloEnriquecer) return <EnriquecerArticulo onBack={() => setArticuloEnriquecer(null)} initialArticulo={articuloEnriquecer} />;
  if (enriquecerMasivoArts) return <EnriquecerMasivo articles={enriquecerMasivoArts} onClose={() => setEnriquecerMasivoArts(null)} />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, pt: 2, pb: 0 }}>
        <Typography variant="caption" sx={{ color: '#757575', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
          CATÁLOGO
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', mt: 0.5, mb: 1.5 }}>
          Artículos
        </Typography>
        {/* ── Tabs ── */}
        <Box sx={{ display: 'flex', gap: 0 }}>
          {['ARTÍCULOS', 'GESTIÓN ARTÍCULOS', 'ENRIQUECEDOR'].map((tab, i) => (
            <Box key={tab} onClick={() => setActiveTab(i)} sx={{
              px: 2.5, py: 1.2, cursor: 'pointer', userSelect: 'none',
              borderBottom: activeTab === i ? '2.5px solid #0066CC' : '2.5px solid transparent',
              color: activeTab === i ? '#0066CC' : '#757575',
              fontWeight: activeTab === i ? 700 : 400,
              fontSize: '0.78rem', letterSpacing: '0.06em',
              transition: 'color 0.15s',
              '&:hover': { color: '#0066CC' },
            }}>{tab}</Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2 }}>

      {/* ── Panel de conexiones ── */}
      <Paper sx={{ p: 2, mb: 2, border: '1px solid #e4e4e7', boxShadow: 'none' }}>
        <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem', mb: 1.5, display: 'block' }}>
          Conexiones de datos
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>

          {/* Promotive */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, border: '1px solid #e4e4e7', borderRadius: 1, minWidth: 200, bgcolor: '#fafafa' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isConnected ? '#4caf50' : '#f44336', flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', fontSize: '0.75rem' }}>Promotive</Typography>
              <Typography variant="caption" sx={{ color: '#757575', fontSize: '0.65rem' }}>{isConnected ? 'Conectado' : 'Desconectado'}</Typography>
            </Box>
            {!isConnected && (
              <Button size="small" variant="contained" disabled={autoConnecting}
                onClick={handleConnect}
                sx={{ fontSize: '0.7rem', py: 0.3, px: 1, bgcolor: '#0066CC', '&:hover': { bgcolor: '#004C99' }, textTransform: 'none', minWidth: 'auto' }}>
                {autoConnecting ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : 'Conectar'}
              </Button>
            )}
          </Box>

          {/* Boxer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, border: '1px solid #e4e4e7', borderRadius: 1, minWidth: 200, bgcolor: '#fafafa' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: boxerStatus?.connected ? '#4caf50' : '#f44336', flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', fontSize: '0.75rem' }}>Boxer</Typography>
              <Typography variant="caption" sx={{ color: '#757575', fontSize: '0.65rem' }}>
                {boxerStatus ? (boxerStatus.connected ? (boxerStatus.username ? `Conectado como ${boxerStatus.username}` : 'Conectado (demo)') : 'Desconectado') : 'Verificando...'}
              </Typography>
            </Box>
            <Button size="small" variant="outlined"
              onClick={() => setShowBoxerLogin(true)}
              sx={{ fontSize: '0.7rem', py: 0.3, px: 1, textTransform: 'none', minWidth: 'auto', borderColor: '#0066CC', color: '#0066CC' }}>
              Login
            </Button>
          </Box>

          {/* Autopartes AR */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, border: '1px solid #e4e4e7', borderRadius: 1, minWidth: 200, bgcolor: '#fafafa' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: arStatus?.token_valid ? '#4caf50' : '#f44336', flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', fontSize: '0.75rem' }}>Autopartes AR</Typography>
              <Typography variant="caption" sx={{ color: '#757575', fontSize: '0.65rem' }}>
                {arStatus ? (arStatus.token_valid ? 'Conectado' : 'Token vencido') : 'Verificando...'}
              </Typography>
            </Box>
            <Button size="small" variant="outlined"
              onClick={() => setShowArLogin(true)}
              sx={{ fontSize: '0.7rem', py: 0.3, px: 1, textTransform: 'none', minWidth: 'auto', borderColor: '#0066CC', color: '#0066CC' }}>
              Login
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Dialog Login Boxer ── */}
      <Dialog open={showBoxerLogin} onClose={() => setShowBoxerLogin(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>Conectar a Boxer</Typography>
            <IconButton size="small" onClick={() => setShowBoxerLogin(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="URL del servidor (opcional)" size="small" value={boxerUrl} onChange={e => setBoxerUrl(e.target.value)}
              placeholder="https://tu-boxer.com" helperText="Dejar vacío para usar el demo" />
            <TextField label="Usuario" size="small" value={boxerUser} onChange={e => setBoxerUser(e.target.value)} />
            <TextField label="Contraseña" size="small" type="password" value={boxerPass} onChange={e => setBoxerPass(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleBoxerLogin()} />
            {boxerLoginError && <Alert severity="error" sx={{ py: 0.5 }}>{boxerLoginError}</Alert>}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setShowBoxerLogin(false)} sx={{ textTransform: 'none', color: '#757575' }}>Cancelar</Button>
          <Button variant="contained" disabled={boxerConnecting || !boxerUser || !boxerPass} onClick={handleBoxerLogin}
            sx={{ textTransform: 'none', bgcolor: '#0066CC', '&:hover': { bgcolor: '#004C99' } }}>
            {boxerConnecting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Ingresar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Login Autopartes AR ── */}
      <Dialog open={showArLogin} onClose={() => setShowArLogin(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>Conectar a Autopartes AR</Typography>
            <IconButton size="small" onClick={() => setShowArLogin(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Usuario" size="small" value={arUser} onChange={e => setArUser(e.target.value)} />
            <TextField label="Contraseña" size="small" type="password" value={arPass} onChange={e => setArPass(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleArLogin()} />
            {arLoginError && <Alert severity="error" sx={{ py: 0.5 }}>{arLoginError}</Alert>}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setShowArLogin(false)} sx={{ textTransform: 'none', color: '#757575' }}>Cancelar</Button>
          <Button variant="contained" disabled={arConnecting || !arUser || !arPass} onClick={handleArLogin}
            sx={{ textTransform: 'none', bgcolor: '#0066CC', '&:hover': { bgcolor: '#004C99' } }}>
            {arConnecting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Ingresar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal con detalles completos */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCar color="primary" />
              <Typography variant="h6">Detalles Completos del Vehículo</Typography>
            </Box>
            <IconButton onClick={() => setOpenModal(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {/* Información General */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            📋 Información General
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {vehicleData?.basic_info?.brand && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Marca</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.brand}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.model || vehicleData?.basic_info?.master_model) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Modelo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.model || vehicleData.basic_info.master_model}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.version && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Versión</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.version}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.reference_year || vehicleData?.basic_info?.year) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Año</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.reference_year || vehicleData.basic_info.year}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.segment || vehicleData?.basic_info?.grouped_segment) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Segmento</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.segment || vehicleData.basic_info.grouped_segment}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.familia || vehicleData?.basic_info?.family) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Familia</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.familia || vehicleData.basic_info.family}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.sold_from_year || vehicleData?.basic_info?.sold_until_year) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Años de Venta</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {vehicleData.basic_info.sold_from_year || '?'} - {vehicleData.basic_info.sold_until_year || 'Presente'}
                </Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.code || vehicleData?.basic_info?.vehicle_code) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Código del Vehículo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{vehicleData.basic_info.code || vehicleData.basic_info.vehicle_code}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.market_name && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Nombre de Mercado</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.market_name}</Typography>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Motor y Transmisión */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            🔧 Motor y Transmisión
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {(vehicleData?.basic_info?.engine_displacement_liters || vehicleData?.basic_info?.engine || vehicleData?.basic_info?.motor) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Cilindrada</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {vehicleData.basic_info.engine_displacement_liters ? `${vehicleData.basic_info.engine_displacement_liters}L` : vehicleData.basic_info.engine || vehicleData.basic_info.motor}
                </Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.engine_code && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Código Motor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.engine_code}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.engine_family && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Familia Motor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.engine_family}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.fuel_type && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Combustible</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.fuel_type}</Typography>
              </Grid>
            )}
            {vehicleData?.basic_info?.turbo !== undefined && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Turbo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.turbo ? 'Sí' : 'No'}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.distribucion || vehicleData?.basic_info?.distribution) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Distribución</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.distribucion || vehicleData.basic_info.distribution}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.transmision || vehicleData?.basic_info?.transmission) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Transmisión</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.transmision || vehicleData.basic_info.transmission}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.pasos_caja || vehicleData?.basic_info?.gears) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Marchas</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.pasos_caja || vehicleData.basic_info.gears}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.traccion || vehicleData?.basic_info?.drive) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Tracción</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.traccion || vehicleData.basic_info.drive}</Typography>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Chasis y Suspensión */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            🚗 Chasis y Suspensión
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {vehicleData?.basic_info?.vin && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" display="block">VIN/Chasis</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '1.1rem' }}>{vehicleData.basic_info.vin}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.frenos_del || vehicleData?.basic_info?.front_brakes) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Frenos Delanteros</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.frenos_del || vehicleData.basic_info.front_brakes}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.frenos_tras || vehicleData?.basic_info?.rear_brakes) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Frenos Traseros</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.frenos_tras || vehicleData.basic_info.rear_brakes}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.direccion || vehicleData?.basic_info?.steering) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Dirección</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.direccion || vehicleData.basic_info.steering}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.suspension_del || vehicleData?.basic_info?.front_suspension) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Suspensión Delantera</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.suspension_del || vehicleData.basic_info.front_suspension}</Typography>
              </Grid>
            )}
            {(vehicleData?.basic_info?.suspension_tras || vehicleData?.basic_info?.rear_suspension) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" display="block">Suspensión Trasera</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{vehicleData.basic_info.suspension_tras || vehicleData.basic_info.rear_suspension}</Typography>
              </Grid>
            )}
          </Grid>

          {/* Partes Compatibles */}
          {vehicleData?.compatible_parts && vehicleData.compatible_parts.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                🔩 Partes Compatibles ({vehicleData.compatible_parts.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Se encontraron {vehicleData.compatible_parts.length} partes compatibles con este vehículo.
              </Typography>
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para guardar en cliente */}
      <Dialog 
        open={openClientModal} 
        onClose={() => setOpenClientModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Guardar Vehículo en Cliente</Typography>
            <IconButton onClick={() => setOpenClientModal(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona el cliente al que deseas asociar este vehículo:
          </Typography>
          <Typography variant="subtitle2" sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <strong>Vehículo:</strong> {vehicleData?.basic_info?.brand} {vehicleData?.basic_info?.model} - {vehicleData?.basic_info?.year}
          </Typography>
          <FormControl fullWidth>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Cliente
            </Typography>
            <Select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              displayEmpty
              size="small"
            >
              <MenuItem value="" disabled>
                Seleccionar cliente...
              </MenuItem>
              <MenuItem value="cliente1">Juan Pérez - DNI: 12345678</MenuItem>
              <MenuItem value="cliente2">María García - DNI: 87654321</MenuItem>
              <MenuItem value="cliente3">Carlos López - DNI: 11223344</MenuItem>
              <MenuItem value="cliente4">Ana Martínez - DNI: 55667788</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setOpenClientModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (!selectedClient) {
                alert('Por favor selecciona un cliente');
                return;
              }
              // Aquí iría la lógica para guardar
              alert('Vehículo guardado en cliente exitosamente');
              setOpenClientModal(false);
              setSelectedClient('');
            }} 
            variant="contained"
            disabled={!selectedClient}
            sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#45a049' } }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

        {/* ── Search & Filter Bar ── */}
        <Paper sx={{ p: 2, mb: 2, border: '1px solid #e4e4e7', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: '1 1 280px', minWidth: 200 }}>
              <Chip label="V4" size="small" sx={{ bgcolor: '#0066CC', color: '#fff', borderRadius: 1, mr: 1, fontWeight: 700, fontSize: '0.7rem', height: 28 }} />
              <TextField
                fullWidth size="small"
                placeholder="Buscar por código o descripción"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}><Clear fontSize="small" /></IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { fontSize: '0.875rem' },
                }}
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Ordenar por</InputLabel>
              <Select value={ordenar} label="Ordenar por" onChange={e => setOrdenar(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="nombre">Nombre</MenuItem>
                <MenuItem value="codigo">Código</MenuItem>
                <MenuItem value="stock">Stock</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Mostrar</InputLabel>
              <Select value={mostrar} label="Mostrar" onChange={e => setMostrar(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="activos">Activos</MenuItem>
                <MenuItem value="inactivos">Inactivos</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 155 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Orden secundario</InputLabel>
              <Select value={ordenSecundario} label="Orden secundario" onChange={e => setOrdenSecundario(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                <MenuItem value=""><em>Ninguno</em></MenuItem>
                <MenuItem value="proveedor">Proveedor</MenuItem>
                <MenuItem value="rubro">Rubro</MenuItem>
              </Select>
            </FormControl>
            <Button size="small" startIcon={<FilterList sx={{ fontSize: 14 }} />}
              sx={{ color: '#0066CC', textTransform: 'none', fontWeight: 500, fontSize: '0.8rem', ml: 'auto', whiteSpace: 'nowrap' }}>
              FILTROS AVANZADOS
            </Button>
          </Box>
        </Paper>

        {/* ── Botones principales ── */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
          <Button size="small" startIcon={<AutoAwesome sx={btnIcon} />}
            onClick={() => {
              const sel = articles.filter(a => selectedRows.includes(a.id) && a.fuente === 'Boxer');
              if (sel.length > 0) {
                setEnriquecerMasivoArts(sel);
              } else {
                setArticuloEnriquecer({});
              }
            }}
            sx={{ fontSize: '0.8rem', color: '#2E7D32', border: '1px solid #2E7D32',
              bgcolor: '#fff', '&:hover': { bgcolor: '#E8F5E9' }, textTransform: 'none', fontWeight: 600, px: 2 }}>
            {selectedRows.length > 0 ? `ENRIQUECER (${selectedRows.length})` : 'ENRIQUECER'}
          </Button>
        </Box>

        {/* ── Table ── */}
        {articlesError && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setArticlesError(null)}>
            {articlesError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#757575' }}>
            {loadingArticles ? 'Cargando...' : activeTab === 2
              ? (() => {
                  const nQ = (searchTerm || '').replace(/[\s\-.]/g, '').toUpperCase();
                  const cnt = displayedArticles.filter(a => {
                    if (a.fuente !== 'Boxer') return false;
                    if (!nQ || nQ.length < 2) return true;
                    const codes = [a.articulo, a.original, a.auxiliar, a.auxiliar2, a.auxiliar3]
                      .map(c => (c || '').replace(/[\s\-.]/g, '').toUpperCase())
                      .filter(c => c && c !== '—');
                    if (codes.some(c => c.includes(nQ) || nQ.includes(c))) return true;
                    return (a.descripcion || '').replace(/[\s\-.]/g, '').toUpperCase().includes(nQ);
                  }).length;
                  return `${cnt} artículo${cnt !== 1 ? 's' : ''} Boxer`;
                })()
              : `${displayedArticles.length} de ${totalArticles} artículo${totalArticles !== 1 ? 's' : ''}`
            }
          </Typography>
          {loadingArticles && <CircularProgress size={16} sx={{ color: '#0066CC' }} />}
        </Box>

        {/* ── Tab 0 y 1: tabla completa con precios ── */}
        {activeTab !== 2 && (
        <TableContainer component={Paper} sx={{ border: '1px solid #e4e4e7', boxShadow: 'none', borderRadius: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#0066CC' }}>
                <TableCell padding="checkbox" sx={{ bgcolor: '#0066CC', borderBottom: 'none' }}>
                  <Checkbox size="small" checked={selectAll} onChange={handleSelectAll}
                    sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' } }} />
                </TableCell>
                {['Fuente','Repuesto\nAgrupado','Imagen','Artículo','Original','Auxiliar','Descripción','Observaciones','P. Costo','P. Venta','Stock','Stock\nDeseado','Proveedor','Opciones'].map(col => (
                  <TableCell key={col} sx={{ color: '#fff', fontWeight: 700, fontSize: '0.72rem', bgcolor: '#0066CC',
                    borderBottom: 'none', whiteSpace: 'pre-line', textAlign: 'center', py: 1.5,
                    borderRight: '1px solid rgba(255,255,255,0.15)', '&:last-child': { borderRight: 'none' } }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingArticles && articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#0066CC' }} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#757575' }}>Cargando artículos...</Typography>
                  </TableCell>
                </TableRow>
              ) : displayedArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 6 }}>
                    {searchTerm.length < 2 ? (
                      <>
                        <Typography variant="body2" sx={{ color: '#757575', fontWeight: 600 }}>Buscá un artículo</Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Escribí al menos 2 caracteres en el buscador para ver artículos</Typography>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#757575' }}>No se encontraron artículos para "{searchTerm}"</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ) : displayedArticles.map((art, idx) => (
                <TableRow key={art.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#F0F7FF' } }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={selectedRows.includes(art.id)} onChange={() => handleSelectRow(art.id)} />
                  </TableCell>
                  <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0', px: 0.5 }}>
                    <Chip label={art.fuente || '—'} size="small" sx={{
                      fontSize: '0.6rem', height: 18, fontWeight: 700,
                      bgcolor: art.fuente === 'Boxer' ? '#E3F2FD' : art.fuente === 'Promotive' ? '#E8F5E9' : '#FFF3E0',
                      color: art.fuente === 'Boxer' ? '#0066CC' : art.fuente === 'Promotive' ? '#2E7D32' : '#E65100',
                    }} />
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', color: '#9e9e9e', borderRight: '1px solid #f0f0f0' }}>{art.repuestoAgrupado}</TableCell>
                  <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #ccc', bgcolor: '#f5f5f5', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      <Box sx={{ position: 'absolute', width: '120%', height: '1px', bgcolor: '#bbb', transform: 'rotate(-35deg)' }} />
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#212121', borderRight: '1px solid #f0f0f0' }}>{art.articulo}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', color: '#757575', borderRight: '1px solid #f0f0f0' }}>{art.original}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', color: '#757575', borderRight: '1px solid #f0f0f0' }}>{art.auxiliar}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', color: '#0066CC', maxWidth: 280, borderRight: '1px solid #f0f0f0' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#0066CC', lineHeight: 1.4 }}>{art.descripcion}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', color: '#9e9e9e', borderRight: '1px solid #f0f0f0' }}>—</TableCell>
                  <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0', py: 1 }}>
                    <Typography variant="caption" display="block" sx={{ color: '#9e9e9e', fontSize: '0.62rem', lineHeight: 1.2 }}>Sin IVA:</Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.3 }}>{art.costoSinIva}</Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#9e9e9e', fontSize: '0.62rem', lineHeight: 1.2 }}>Con IVA: {art.costoConIva}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0', py: 1 }}>
                    <Typography variant="caption" display="block" sx={{ color: '#9e9e9e', fontSize: '0.62rem', lineHeight: 1.2 }}>Con IVA:</Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.3 }}>{art.ventaConIva}</Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#9e9e9e', fontSize: '0.62rem', lineHeight: 1.2 }}>Sin IVA: {art.ventaSinIva}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', fontWeight: 600, borderRight: '1px solid #f0f0f0', color: art.stock < 0 ? '#F44336' : art.stock < 10 ? '#FF9800' : '#212121' }}>{art.stock}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', color: '#757575', borderRight: '1px solid #f0f0f0' }}>{art.stockDeseado}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.78rem', borderRight: '1px solid #f0f0f0' }}>{art.proveedor}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.4, justifyContent: 'center' }}>
                      <Tooltip title="Enriquecer" arrow>
                        <IconButton size="small" onClick={() => setArticuloEnriquecer(art)}
                          sx={{ color: '#2E7D32', border: '1px solid #2E7D32', borderRadius: 1, p: 0.4, '&:hover': { bgcolor: '#E8F5E9' } }}>
                          <AutoAwesome sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" sx={{ color: '#757575', border: '1px solid #e0e0e0', borderRadius: 1, p: 0.4 }}><ViewList sx={{ fontSize: 13 }} /></IconButton>
                      <IconButton size="small" sx={{ color: '#757575', border: '1px solid #e0e0e0', borderRadius: 1, p: 0.4 }}><AddShoppingCart sx={{ fontSize: 13 }} /></IconButton>
                      <IconButton size="small" sx={{ color: '#757575', border: '1px solid #e0e0e0', borderRadius: 1, p: 0.4 }}><MoreVert sx={{ fontSize: 13 }} /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}

        {/* ── Tab 2: Enriquecedor ── solo Boxer, sin stock/precios, con Atributos/Vehículos/Equivalencias ── */}
        {activeTab === 2 && (() => {
          // Normaliza código: quita espacios, guiones, puntos → MAYÚSCULAS
          const normQ = (searchTerm || '').replace(/[\s\-.]/g, '').toUpperCase();
          const matchesQ = (a) => {
            if (!normQ || normQ.length < 2) return true;
            // Busca en código, original, auxiliares Y descripción
            const codes = [a.articulo, a.original, a.auxiliar, a.auxiliar2, a.auxiliar3]
              .map(c => (c || '').replace(/[\s\-.]/g, '').toUpperCase())
              .filter(c => c && c !== '—');
            if (codes.some(c => c.includes(normQ) || normQ.includes(c))) return true;
            const desc = (a.descripcion || '').replace(/[\s\-.]/g, '').toUpperCase();
            return desc.includes(normQ);
          };
          const boxerArticles = displayedArticles.filter(a => a.fuente === 'Boxer' && matchesQ(a));
          const COL_SPAN = 13;
          return (
          <TableContainer component={Paper} sx={{ border: '1px solid #e4e4e7', boxShadow: 'none', borderRadius: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: '#1a237e', borderBottom: 'none' }}>
                    <Checkbox size="small" checked={selectAll} onChange={handleSelectAll}
                      sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' } }} />
                  </TableCell>
                  {[
                    { label: 'Imagen',        w: 60  },
                    { label: 'Código',        w: 100 },
                    { label: 'Original\nOEM', w: 110 },
                    { label: 'Aux 1',         w: 90  },
                    { label: 'Aux 2',         w: 90  },
                    { label: 'Aux 3',         w: 90  },
                    { label: 'Descripción',   w: 240 },
                    { label: 'Marca',         w: 90  },
                    { label: 'Atributos',     w: 140 },
                    { label: 'Vehículos',     w: 160 },
                    { label: 'Equivalencias', w: 150 },
                    { label: 'Completitud',   w: 90  },
                  ].map(col => (
                    <TableCell key={col.label} sx={{
                      color: '#fff', fontWeight: 700, fontSize: '0.72rem', bgcolor: '#1a237e',
                      borderBottom: 'none', whiteSpace: 'pre-line', textAlign: 'center', py: 1.5,
                      minWidth: col.w,
                      borderRight: '1px solid rgba(255,255,255,0.15)', '&:last-child': { borderRight: 'none' },
                    }}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingArticles && articles.length === 0 ? (
                  <TableRow><TableCell colSpan={COL_SPAN} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#1a237e' }} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#757575' }}>Cargando artículos...</Typography>
                  </TableCell></TableRow>
                ) : boxerArticles.length === 0 ? (
                  <TableRow><TableCell colSpan={COL_SPAN} align="center" sx={{ py: 6 }}>
                    {searchTerm.length < 2 ? (
                      <>
                        <Typography variant="body2" sx={{ color: '#757575', fontWeight: 600 }}>Buscá un artículo para enriquecer</Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Escribí al menos 2 caracteres para ver los artículos de Boxer con su completitud</Typography>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#757575' }}>No se encontraron artículos de Boxer para "{searchTerm}"</Typography>
                    )}
                  </TableCell></TableRow>
                ) : boxerArticles.map((art, idx) => {
                  // Completitud: código, original, aux, descripción, marca, atributos, vehículos, equivalencias
                  const tieneOriginal   = art.original   && art.original   !== '—';
                  const tieneAux       = art.auxiliar   && art.auxiliar   !== '—';
                  const tieneDesc      = art.descripcion && art.descripcion !== '—';
                  const tieneMarca     = art.marca      && art.marca      !== '—';
                  const tieneAtrib     = !!(art.atributos?.length);
                  const tieneVehiculos = !!(art.vehiculos?.length);
                  const tieneEquiv     = !!(art.equivalencias?.length);
                  const completos = [true, tieneOriginal, tieneAux, tieneDesc, tieneMarca, tieneAtrib, tieneVehiculos, tieneEquiv].filter(Boolean).length;
                  const pct = Math.round((completos / 8) * 100);
                  const pctColor = pct >= 80 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#f44336';
                  const sep = { borderRight: '1px solid #ede7f6' };
                  const dash = <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>;
                  return (
                    <TableRow key={art.id}
                      sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#f8f9ff', '&:hover': { bgcolor: '#EDE7F6' } }}>
                      <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                        <Checkbox size="small" checked={selectedRows.includes(art.id)} onChange={() => handleSelectRow(art.id)} />
                      </TableCell>

                      {/* Imagen */}
                      <TableCell align="center" sx={{ ...sep, px: 0.5, py: 0.5 }}>
                        {art.imagen ? (
                          <Box component="img" src={art.imagen} alt={art.articulo}
                            sx={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />
                        ) : (
                          <Box sx={{ width: 36, height: 36, borderRadius: 1, border: '1px dashed #ccc', bgcolor: '#fafafa',
                            mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '0.55rem', color: '#ccc', textAlign: 'center', lineHeight: 1.2 }}>SIN<br/>IMG</Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Código */}
                      <TableCell align="center" sx={sep}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a237e', fontFamily: 'monospace' }}>
                          {art.articulo}
                        </Typography>
                      </TableCell>

                      {/* Original / OEM */}
                      <TableCell align="center" sx={sep}>
                        {tieneOriginal
                          ? <Chip label={art.original} size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#E8EAF6', color: '#283593', fontWeight: 600 }} />
                          : dash}
                      </TableCell>

                      {/* Aux 1 */}
                      <TableCell align="center" sx={{ ...sep, fontSize: '0.75rem', color: '#546e7a' }}>
                        {tieneAux ? art.auxiliar : dash}
                      </TableCell>

                      {/* Aux 2 */}
                      <TableCell align="center" sx={{ ...sep }}>{dash}</TableCell>

                      {/* Aux 3 */}
                      <TableCell align="center" sx={{ ...sep }}>{dash}</TableCell>

                      {/* Descripción */}
                      <TableCell sx={{ ...sep, maxWidth: 240 }}>
                        {tieneDesc
                          ? <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#212121', lineHeight: 1.4 }}>{art.descripcion}</Typography>
                          : <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd', fontStyle: 'italic' }}>Sin descripción</Typography>}
                      </TableCell>

                      {/* Marca */}
                      <TableCell align="center" sx={sep}>
                        {tieneMarca
                          ? <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#37474f' }}>{art.marca}</Typography>
                          : dash}
                      </TableCell>

                      {/* Atributos */}
                      <TableCell align="center" sx={sep}>
                        {tieneAtrib ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, alignItems: 'flex-start' }}>
                            {(art.atributos || []).slice(0, 3).map((a, i) => (
                              <Typography key={i} sx={{ fontSize: '0.68rem', color: '#37474f', whiteSpace: 'nowrap' }}>
                                <b>{a.nombre}:</b> {a.valor}
                              </Typography>
                            ))}
                            {(art.atributos || []).length > 3 && (
                              <Typography sx={{ fontSize: '0.65rem', color: '#9e9e9e' }}>+{art.atributos.length - 3} más</Typography>
                            )}
                          </Box>
                        ) : dash}
                      </TableCell>

                      {/* Vehículos */}
                      <TableCell align="center" sx={sep}>
                        {tieneVehiculos ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, alignItems: 'flex-start' }}>
                            {(art.vehiculos || []).slice(0, 2).map((v, i) => (
                              <Typography key={i} sx={{ fontSize: '0.68rem', color: '#1565c0', whiteSpace: 'nowrap' }}>
                                {v.marca} {v.modelo} {v.anio || ''}
                              </Typography>
                            ))}
                            {(art.vehiculos || []).length > 2 && (
                              <Typography sx={{ fontSize: '0.65rem', color: '#9e9e9e' }}>+{art.vehiculos.length - 2} más</Typography>
                            )}
                          </Box>
                        ) : dash}
                      </TableCell>

                      {/* Equivalencias */}
                      <TableCell align="center" sx={sep}>
                        {tieneEquiv ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, justifyContent: 'center' }}>
                            {(art.equivalencias || []).slice(0, 3).map((e, i) => (
                              <Chip key={i} label={e.codigo || e} size="small"
                                sx={{ fontSize: '0.62rem', height: 18, bgcolor: '#FFF8E1', color: '#E65100', fontWeight: 600 }} />
                            ))}
                            {(art.equivalencias || []).length > 3 && (
                              <Typography sx={{ fontSize: '0.65rem', color: '#9e9e9e' }}>+{art.equivalencias.length - 3}</Typography>
                            )}
                          </Box>
                        ) : dash}
                      </TableCell>

                      {/* Completitud */}
                      <TableCell align="center" sx={{ px: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: pctColor }}>{pct}%</Typography>
                          <Box sx={{ width: 52, height: 5, borderRadius: 3, bgcolor: '#eeeeee', overflow: 'hidden' }}>
                            <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: pctColor, borderRadius: 3, transition: 'width 0.3s' }} />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          );
        })()}

        {/* ── Paginación ── */}
        {numPages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button size="small" variant="outlined" disabled={currentPage <= 1 || loadingArticles}
              onClick={() => setCurrentPage(p => p - 1)}
              sx={{ textTransform: 'none', borderColor: '#0066CC', color: '#0066CC' }}>
              ← Anterior
            </Button>
            <Typography variant="body2" sx={{ color: '#555' }}>
              Página {currentPage} de {numPages}
            </Typography>
            <Button size="small" variant="outlined" disabled={currentPage >= numPages || loadingArticles}
              onClick={() => setCurrentPage(p => p + 1)}
              sx={{ textTransform: 'none', borderColor: '#0066CC', color: '#0066CC' }}>
              Siguiente →
            </Button>
          </Box>
        )}

      </Box>
    </Box>
  );
};

export default PromotiveArticulos;
