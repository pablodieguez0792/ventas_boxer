import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, Switch, FormControlLabel,
  IconButton, Divider, Paper, Checkbox,
  Autocomplete, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableHead, TableBody,
  TableRow, TableCell, Chip, Alert,
} from '@mui/material';
import {
  ArrowBack, Add, GridOn, DeleteOutline, SentimentDissatisfied,
  Info, AutoAwesome,
} from '@mui/icons-material';
import apiService from '../utils/api';

const SinCoeficientes = () => (
  <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <SentimentDissatisfied sx={{ fontSize: 36, color: '#9e9e9e' }} />
    <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.75rem' }}>
      Sin coeficientes múltiples registrados
    </Typography>
  </Box>
);

const CoeficientePanel = ({ title }) => {
  const [grupo, setGrupo] = useState('');
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden', flex: 1 }}>
      <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', fontSize: '0.75rem' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select
              value={grupo}
              onChange={e => setGrupo(e.target.value)}
              displayEmpty
              sx={{ fontSize: '0.8rem' }}
            >
              <MenuItem value=""><em style={{ color: '#999', fontStyle: 'normal' }}>Grupo maestro...</em></MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" sx={{ border: '1px solid #ddd', borderRadius: 1, p: 0.4 }}>
            <GridOn sx={{ fontSize: 14, color: '#757575' }} />
          </IconButton>
          <IconButton size="small" sx={{ border: '1px solid #ddd', borderRadius: 1, p: 0.4 }}>
            <DeleteOutline sx={{ fontSize: 14, color: '#757575' }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0', pb: 0.5, mb: 0.5 }}>
          <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, color: '#555', fontSize: '0.72rem' }}>Nombre</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', fontSize: '0.72rem' }}>Coeficiente</Typography>
        </Box>
        <SinCoeficientes />
      </Box>
    </Paper>
  );
};

const NuevoArticulo = ({ onBack }) => {
  const [proveedor, setProveedor] = useState('');
  const [proveedoresList, setProveedoresList] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(true);
  const [articuloBusqueda, setArticuloBusqueda] = useState('');
  const [articuloOptions, setArticuloOptions] = useState([]);
  const [loadingArticulos, setLoadingArticulos] = useState(false);
  const articuloSearchTimer = useRef(null);
  const [enrichOpen, setEnrichOpen] = useState(false);
  const [enrichSource, setEnrichSource] = useState('');
  const [enrichResults, setEnrichResults] = useState([]);
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [enrichError, setEnrichError] = useState('');
  const [enrichCodeUsed, setEnrichCodeUsed] = useState('');
  const [marca, setMarca] = useState('');
  const [rubro, setRubro] = useState('');
  const [subrubro, setSubrubro] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigoArticulo, setCodigoArticulo] = useState('');
  const [codigoOriginal, setCodigoOriginal] = useState('');
  const [codigoAux1, setCodigoAux1] = useState('');
  const [codigoAux2, setCodigoAux2] = useState('');
  const [codigoAux3, setCodigoAux3] = useState('');
  const [manejaPrecioCosto, setManejaPrecioCosto] = useState(false);
  const [pCosto, setPCosto] = useState('');
  const [pLista, setPLista] = useState('');
  const [pVenta, setPVenta] = useState('');
  const [iva, setIva] = useState('21%');
  const [precioVender, setPrecioVender] = useState('');
  const [stockInicial, setStockInicial] = useState('');
  const [stockDeseado, setStockDeseado] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [agregarUbicacion, setAgregarUbicacion] = useState(false);
  const [manejarUnidades, setManejarUnidades] = useState(false);
  const [fotoUrl, setFotoUrl] = useState('');

  useEffect(() => {
    apiService.getBoxerProveedores('', 1)
      .then(data => setProveedoresList(data.proveedores || []))
      .catch(() => {})
      .finally(() => setLoadingProveedores(false));
  }, []);

  const handleArticuloSearch = (value) => {
    setArticuloBusqueda(value);
    if (articuloSearchTimer.current) clearTimeout(articuloSearchTimer.current);
    if (!value || value.trim().length < 2) {
      setArticuloOptions([]);
      return;
    }
    articuloSearchTimer.current = setTimeout(async () => {
      setLoadingArticulos(true);
      try {
        const data = await apiService.getBoxerArticulos(value.trim(), 1, proveedor || '');
        setArticuloOptions(data.articulos || []);
      } catch {
        setArticuloOptions([]);
      } finally {
        setLoadingArticulos(false);
      }
    }, 400);
  };

  const handleEnriquecer = async (source) => {
    // Códigos candidatos en orden de prioridad: artículo → original → aux1/2/3
    const candidatos = [codigoArticulo, codigoOriginal, codigoAux1, codigoAux2, codigoAux3]
      .map(c => (c || '').trim().replace(/[\s;=]+/g, ' ').split(' ')[0]) // tomar solo el primer token
      .filter(c => c.length >= 2)
      .filter((c, i, arr) => arr.indexOf(c) === i);

    setEnrichSource(source);
    setEnrichOpen(true);
    setEnrichResults([]);
    setEnrichError('');
    setEnrichCodeUsed('');

    if (candidatos.length === 0) {
      setEnrichError('Ingresá un código en los campos "Cód. artículo" o "Cód. original" antes de enriquecer.');
      return;
    }

    setLoadingEnrich(true);
    try {
      if (source === 'boxer') {
        for (const cod of candidatos) {
          const data = await apiService.getBoxerArticulos(cod, 1, '');
          const items = data.articulos || [];
          if (items.length > 0) { setEnrichResults(items); setEnrichCodeUsed(cod); return; }
        }
        setEnrichError('Sin resultados en Boxer para: ' + candidatos.join(', '));

      } else if (source === 'promotive') {
        const status = await apiService.getPromotiveStatus();
        if (!status.connected || !status.token_valid) {
          const conn = await apiService.connectPromotive();
          if (!conn.success) throw new Error('No se pudo conectar a Promotive');
        }
        // Candidatos extra para Promotive:
        // 1. Stripear prefijo de marca conocido: VMGBA642→BA642, SKFVKPC81302→VKPC81302
        const brandPrefixes = /^(VMG|SKF|NGK|BOSCH|MANN|DOLZ|MAHLE|FEBEST|JAPKO|LUK|VALEO|INA|FAG|NTN|NSK|GATES|DAYCO|CONTI|RMT|INDISA|LUCAS)/i;
        const stripped = candidatos
          .map(c => c.replace(brandPrefixes, ''))
          .filter(c => c.length >= 3 && !candidatos.includes(c));
        // 2. Cross-refs de la descripción: extraer tokens entre "=" (ej: =VKPC81302=A206)
        const descTokens = (descripcion || '').split(/[=\s;,]+/)
          .map(t => t.trim().toUpperCase())
          .filter(t => /^[A-Z0-9]{5,20}$/.test(t) && !candidatos.includes(t) && !stripped.includes(t));
        const promCandidatos = [...new Set([...candidatos, ...stripped, ...descTokens])];
        for (const cod of promCandidatos) {
          const data = await apiService.searchPromotiveParts(cod, 1, 20);
          const items = data.data || [];
          if (items.length > 0) { setEnrichResults(items); setEnrichCodeUsed(cod); return; }
        }
        setEnrichError('Sin resultados en Promotive para: ' + promCandidatos.slice(0, 5).join(', '));

      } else if (source === 'rsf') {
        // Autopartes AR: search por código → fetch detalle completo por UUID
        let searchItems = [], bestCod = '';
        for (const cod of candidatos) {
          try {
            const data = await apiService.searchAutpartesAR(cod, 10, 0);
            const items = data.items || [];
            if (items.length > searchItems.length) { searchItems = items; bestCod = cod; }
            if (items.length >= 3) break;
          } catch { break; }
        }
        if (searchItems.length === 0) {
          setEnrichError('Sin resultados en Autopartes AR para: ' + candidatos.join(', '));
        } else {
          // Mostrar resultados parciales de búsqueda de inmediato
          setEnrichResults(searchItems); setEnrichCodeUsed(bestCod);
          // Luego enriquecer con detalle completo por ID (top 5 por score)
          const top = [...searchItems]
            .sort((a, b) => (b.completitud_score || 0) - (a.completitud_score || 0))
            .slice(0, 5).filter(a => a.id);
          if (top.length > 0) {
            const detalles = await Promise.allSettled(
              top.map(a => apiService.getAutpartesARDetail(a.id))
            );
            const full = detalles.filter(r => r.status === 'fulfilled').map(r => r.value);
            if (full.length > 0) setEnrichResults(full);
          }
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'desconocido';
      setEnrichError(msg.includes('Token expirado')
        ? 'Token de Autopartes AR expirado. Reconectá desde Conexiones → Autopartes AR.'
        : 'Error al consultar: ' + msg);
    } finally {
      setLoadingEnrich(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const applyEnrichResult = (art) => {
    setDescripcion(art.descripcion || descripcion);
    if (art.articulo) setCodigoArticulo(art.articulo);
    if (art.original && art.original !== '—') setCodigoOriginal(art.original);
    if (art.auxiliar && art.auxiliar !== '—') setCodigoAux1(art.auxiliar);
    if (art.auxiliar2 && art.auxiliar2 !== '—') setCodigoAux2(art.auxiliar2);
    if (art.auxiliar3 && art.auxiliar3 !== '—') setCodigoAux3(art.auxiliar3);
    if (art.precioCosto) setPCosto(String(art.precioCosto));
    if (art.precioLista) setPLista(String(art.precioLista));
    if (art.precioVenta) setPVenta(String(art.precioVenta));
    if (art.marca && art.marca !== '—') setMarca(art.marca.toLowerCase());
    setEnrichOpen(false);
  };

  const handleArticuloSelect = (articulo) => {
    if (!articulo) return;
    const cod = articulo.articulo || '';
    // Todos los resultados del mismo proveedor ya cargados en el autocomplete
    const mismoCod = articuloOptions.filter(a => a.articulo === cod);
    const pool = mismoCod.length > 0 ? mismoCod : [articulo];
    const pick = (key) => pool.find(a => a[key] && a[key] !== '—')?.[key];

    setDescripcion(articulo.descripcion || pick('descripcion') || '');
    setCodigoArticulo(cod);
    setCodigoOriginal(pick('original') || '');
    setCodigoAux1(pick('auxiliar') || '');
    setPCosto(articulo.precioCosto ? String(articulo.precioCosto) : '');
    setPLista(articulo.precioLista ? String(articulo.precioLista) : '');
    setPVenta(articulo.precioVenta ? String(articulo.precioVenta) : '');
    const m = pick('marca');
    if (m) setMarca(m.toLowerCase());
  };

  const inputSx = { fontSize: '0.875rem' };
  const labelSx = { fontSize: '0.8rem' };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#757575', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
            REGISTRAR ARTÍCULOS
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', mt: 0.5 }}>
            ARTÍCULOS
          </Typography>
        </Box>
        <IconButton onClick={onBack} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <ArrowBack sx={{ fontSize: 20, color: '#555' }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        <Paper sx={{ p: 3, border: '1px solid #e4e4e7', boxShadow: 'none', mb: 2 }}>

          {/* Imagen placeholder + Proveedor */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2.5 }}>
            <Box sx={{ flex: 1 }}>
              {/* Proveedor */}
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem' }}>
                Proveedor <span style={{ color: '#F44336' }}>*</span>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={proveedor}
                    onChange={e => setProveedor(e.target.value)}
                    displayEmpty
                    sx={{ fontSize: '0.875rem' }}
                    inputProps={{ placeholder: 'Buscar proveedor a CL/T' }}
                  >
                    <MenuItem value=""><em style={{ fontStyle: 'normal', color: '#999' }}>{loadingProveedores ? 'Cargando...' : 'Seleccionar proveedor'}</em></MenuItem>
                    {proveedoresList.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.nombre || p.alias}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Image — muestra foto si fue cargada desde enriquecimiento */}
            <Box sx={{ width: 90, height: 90, borderRadius: '50%', border: `2px solid ${fotoUrl ? '#0066CC' : '#bdbdbd'}`, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden', cursor: fotoUrl ? 'pointer' : 'default' }}
              title={fotoUrl ? 'Foto cargada desde enriquecimiento' : 'Sin foto'}
              onClick={() => fotoUrl && window.open(fotoUrl, '_blank')}>
              {fotoUrl
                ? <Box component="img" src={fotoUrl} alt="foto" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setFotoUrl('')} />
                : <Box sx={{ position: 'absolute', width: '130%', height: '2px', bgcolor: '#bdbdbd', transform: 'rotate(-35deg)' }} />}
            </Box>
          </Box>

          {/* Buscar artículo del proveedor */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem', color: '#555' }}>
              Buscar artículo del proveedor
              {!proveedor && <span style={{ color: '#9e9e9e', fontWeight: 400, marginLeft: 6 }}>(selecioná un proveedor primero)</span>}
            </Typography>
            <Autocomplete
              disabled={!proveedor}
              options={articuloOptions}
              getOptionLabel={opt => `${opt.articulo || ''} — ${opt.descripcion || ''}`}
              filterOptions={x => x}
              loading={loadingArticulos}
              inputValue={articuloBusqueda}
              onInputChange={(_, value) => handleArticuloSearch(value)}
              onChange={(_, value) => handleArticuloSelect(value)}
              noOptionsText={articuloBusqueda.length < 2 ? 'Escribí al menos 2 caracteres' : 'Sin resultados'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder={proveedor ? 'Buscar por código o descripción...' : 'Seleccioná un proveedor primero'}
                  InputProps={{
                    ...params.InputProps,
                    sx: { fontSize: '0.875rem' },
                    endAdornment: (
                      <>
                        {loadingArticulos ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, opt) => (
                <Box component="li" {...props} key={opt.id} sx={{ fontSize: '0.82rem', py: 0.8 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#0066CC' }}>
                      {opt.articulo || '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#555', fontSize: '0.75rem' }}>
                      {opt.descripcion}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.72rem', display: 'block' }}>
                      Marca: {opt.marca} · Stock: {opt.stock} · Venta: ${opt.precioVenta?.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Box>

          {/* ── ENRIQUECER ATRIBUTOS ── */}
          <Box sx={{ mb: 2.5, border: '1px solid #e0e0e0', borderRadius: 1.5, p: 1.5, bgcolor: '#FAFCFF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <AutoAwesome sx={{ fontSize: 14, color: '#0066CC' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#0066CC', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Enriquecer atributos
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#999', ml: 0.5 }}>
                — completá la ficha técnica del artículo desde fuentes externas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[{ src: 'boxer', label: 'Boxer', color: '#0066CC', bg: '#E3F2FD' },
                { src: 'rsf', label: 'Autopartes AR', color: '#2E7D32', bg: '#E8F5E9' },
                { src: 'promotive', label: 'Promotive', color: '#6A1B9A', bg: '#F3E5F5' }].map(({ src, label, color, bg }) => (
                <Button key={src} size="small" startIcon={<AutoAwesome sx={{ fontSize: 13 }} />}
                  onClick={() => handleEnriquecer(src)}
                  sx={{ fontSize: '0.72rem', color, border: `1px solid ${color}`, bgcolor: '#fff',
                    '&:hover': { bgcolor: bg }, textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.5 }}>
                  {label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Marca — libre, se autocompleta desde proveedor o enriquecimiento */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem', color: '#555' }}>Marca</Typography>
            <TextField
              size="small" fullWidth
              placeholder="Ej: VMG, SKF, Bosch..."
              value={marca}
              onChange={e => setMarca(e.target.value)}
              InputProps={{ sx: { fontSize: '0.875rem' } }}
            />
          </Box>

          {/* Rubro + Subrubro */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem', color: '#555' }}>Rubro</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select value={rubro} onChange={e => setRubro(e.target.value)} displayEmpty sx={{ fontSize: '0.875rem' }}>
                    <MenuItem value=""><em style={{ fontStyle: 'normal', color: '#999' }}>Rubro</em></MenuItem>
                    <MenuItem value="motor">Motor</MenuItem>
                    <MenuItem value="frenos">Frenos</MenuItem>
                    <MenuItem value="suspension">Suspensión</MenuItem>
                  </Select>
                </FormControl>
                <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}><Add sx={{ fontSize: 16 }} /></IconButton>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem', color: '#555' }}>Subrubro</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select value={subrubro} onChange={e => setSubrubro(e.target.value)} displayEmpty sx={{ fontSize: '0.875rem' }}>
                    <MenuItem value=""><em style={{ fontStyle: 'normal', color: '#999' }}>Subrubros</em></MenuItem>
                    <MenuItem value="repuestos">Repuestos</MenuItem>
                    <MenuItem value="accesorios">Accesorios</MenuItem>
                  </Select>
                </FormControl>
                <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}><Add sx={{ fontSize: 16 }} /></IconButton>
              </Box>
            </Box>
          </Box>

          {/* Descripción */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem' }}>
              Descripción <span style={{ color: '#F44336' }}>*</span>
            </Typography>
            <TextField
              fullWidth size="small" multiline rows={2}
              placeholder="Descripción del artículo *"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              InputProps={{ sx: inputSx }}
            />
          </Box>

          {/* Códigos row 1 */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem' }}>
              Códigos <span style={{ color: '#F44336' }}>*</span>
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" sx={{ flex: 1 }} placeholder="Código artículo *"
                value={codigoArticulo} onChange={e => setCodigoArticulo(e.target.value)}
                InputProps={{ sx: inputSx }} />
              <TextField size="small" sx={{ flex: 1 }} placeholder="Código original"
                value={codigoOriginal} onChange={e => setCodigoOriginal(e.target.value)}
                InputProps={{ sx: inputSx }} />
            </Box>
          </Box>

          {/* Códigos row 2 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <TextField size="small" sx={{ flex: 1 }} placeholder="Código auxiliar"
              value={codigoAux1} onChange={e => setCodigoAux1(e.target.value)}
              InputProps={{ sx: inputSx }} />
            <TextField size="small" sx={{ flex: 1 }} placeholder="Código auxiliar 2"
              value={codigoAux2} onChange={e => setCodigoAux2(e.target.value)}
              InputProps={{ sx: inputSx }} />
            <TextField size="small" sx={{ flex: 1 }} placeholder="Código auxiliar 3"
              value={codigoAux3} onChange={e => setCodigoAux3(e.target.value)}
              InputProps={{ sx: inputSx }} />
          </Box>

          {/* Toggle Maneja Precio Costo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Switch
              size="small"
              checked={manejaPrecioCosto}
              onChange={e => setManejaPrecioCosto(e.target.checked)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0066CC' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0066CC' } }}
            />
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#555' }}>Maneja Precio Costo</Typography>
          </Box>

          {/* Tres paneles de coeficientes */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <CoeficientePanel title="Recargos mayoristas" />
            <CoeficientePanel title="Descuentos" />
            <CoeficientePanel title="Recargos de contado" />
          </Box>

          {/* Precios */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>P. costo</Typography>
              <TextField size="small" fullWidth placeholder="$ 0,00"
                value={pCosto} onChange={e => setPCosto(e.target.value)}
                InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, color: '#757575', fontSize: '0.8rem' }}>$</Box>, sx: inputSx }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>P. Lista (Con IVA)</Typography>
              <TextField size="small" fullWidth placeholder="$"
                value={pLista} onChange={e => setPLista(e.target.value)}
                InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, color: '#757575', fontSize: '0.8rem' }}>$</Box>, sx: inputSx }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>P. Venta</Typography>
              <TextField size="small" fullWidth placeholder="$ 0,00"
                value={pVenta} onChange={e => setPVenta(e.target.value)}
                InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, color: '#757575', fontSize: '0.8rem' }}>$</Box>, sx: inputSx }} />
            </Box>
            <Box sx={{ width: 100 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>Iva</Typography>
              <FormControl size="small" fullWidth>
                <Select value={iva} onChange={e => setIva(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                  <MenuItem value="21%">21%</MenuItem>
                  <MenuItem value="10.5%">10.5%</MenuItem>
                  <MenuItem value="0%">0%</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* ¿A cómo lo quiero vender? */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>¿A cómo lo quiero vender?</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" sx={{ flex: 1 }} placeholder="$ 0,00"
                value={precioVender} onChange={e => setPrecioVender(e.target.value)}
                InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, color: '#757575', fontSize: '0.8rem' }}>$</Box>, sx: inputSx }} />
              <Button variant="outlined" size="small"
                sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#0066CC', borderColor: '#0066CC', '&:hover': { bgcolor: '#E3F2FD' }, textTransform: 'none' }}>
                PREVISUALIZAR PRECIOS
              </Button>
            </Box>
            <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.7rem', mt: 0.5, display: 'block', lineHeight: 1.4 }}>
              Con el presupuesto y la factura pueden tener descuentos sin recargo, los precios que registren no pueden ser menores según las listas. Si en "Previsualizar Precios" pasa ese precio son los precios sugeridos.
            </Typography>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Stock */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>Stock inicial</Typography>
              <TextField size="small" fullWidth placeholder="Stock inicial"
                value={stockInicial} onChange={e => setStockInicial(e.target.value)}
                InputProps={{ sx: inputSx }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>Stock Deseado</Typography>
              <TextField size="small" fullWidth placeholder="Stock deseado"
                value={stockDeseado} onChange={e => setStockDeseado(e.target.value)}
                InputProps={{ sx: inputSx }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.78rem', color: '#555' }}>Stock Mínimo</Typography>
              <TextField size="small" fullWidth placeholder="Stock mínimo"
                value={stockMinimo} onChange={e => setStockMinimo(e.target.value)}
                InputProps={{ sx: inputSx }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5, gap: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#555', whiteSpace: 'nowrap' }}>¿Agregar ubicación?</Typography>
              <Switch size="small" checked={agregarUbicacion} onChange={e => setAgregarUbicacion(e.target.checked)} />
              <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#757575' }}>{agregarUbicacion ? 'Sí' : 'No'}</Typography>
            </Box>
          </Box>

          {/* Funcional del BETA */}
          <Paper variant="outlined" sx={{ borderRadius: 1, p: 1.5, mb: 2, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Info sx={{ fontSize: 16, color: '#0066CC' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#0066CC' }}>
                Funcional del BETA
              </Typography>
            </Box>
            <FormControlLabel
              control={<Checkbox size="small" checked={manejarUnidades} onChange={e => setManejarUnidades(e.target.checked)} />}
              label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Manejar unidades</Typography>}
            />
            {manejarUnidades && (
              <TextField size="small" sx={{ width: 80, ml: 2 }} defaultValue="1"
                InputProps={{ sx: { fontSize: '0.875rem' } }} />
            )}
          </Paper>

          {/* Footer buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
            <Button variant="contained" size="small"
              sx={{ bgcolor: '#0066CC', '&:hover': { bgcolor: '#004C99' }, textTransform: 'none', fontSize: '0.8rem' }}>
              AGREGAR OBSERVACIÓN
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small"
                sx={{ bgcolor: '#0066CC', '&:hover': { bgcolor: '#004C99' }, textTransform: 'none', fontSize: '0.8rem', px: 2.5 }}>
                GUARDAR CAMBIOS
              </Button>
              <Button variant="contained" size="small"
                sx={{ bgcolor: '#0066CC', '&:hover': { bgcolor: '#004C99' }, textTransform: 'none', fontSize: '0.8rem', px: 2.5 }}>
                REGISTRAR
              </Button>
            </Box>
          </Box>

        </Paper>
      </Box>

      {/* ─── Modal de Enriquecimiento ─── */}
      <Dialog open={enrichOpen} onClose={() => setEnrichOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #e0e0e0', bgcolor: '#FAFCFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome sx={{ color: '#0066CC', fontSize: 18 }} />
              <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#212121' }}>
                Ficha técnica del artículo
              </Typography>
              <Chip label={codigoArticulo || codigoOriginal || '—'} size="small"
                sx={{ bgcolor: '#E3F2FD', color: '#0066CC', fontWeight: 700, fontSize: '0.72rem' }} />
              {enrichCodeUsed && enrichCodeUsed !== (codigoArticulo || codigoOriginal) && (
                <Chip label={`buscado: ${enrichCodeUsed}`} size="small"
                  sx={{ bgcolor: '#FFF8E1', color: '#E65100', fontSize: '0.65rem' }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[{ src: 'boxer', label: 'Boxer', color: '#0066CC', bg: '#E3F2FD' },
                { src: 'rsf', label: 'Autopartes AR', color: '#2E7D32', bg: '#E8F5E9' },
                { src: 'promotive', label: 'Promotive', color: '#6A1B9A', bg: '#F3E5F5' }].map(({ src, label, color, bg }) => (
                <Button key={src} size="small" onClick={() => handleEnriquecer(src)}
                  variant={enrichSource === src ? 'contained' : 'outlined'}
                  sx={{ fontSize: '0.68rem', minWidth: 0, px: 1.2, py: 0.3, textTransform: 'none', fontWeight: 600,
                    ...(enrichSource === src
                      ? { bgcolor: color, borderColor: color, '&:hover': { bgcolor: color } }
                      : { color, borderColor: color, bgcolor: '#fff', '&:hover': { bgcolor: bg } }) }}>
                  {label}
                </Button>
              ))}
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, px: 2.5 }}>
          {loadingEnrich && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, gap: 2, alignItems: 'center', flexDirection: 'column' }}>
              <CircularProgress size={32} sx={{ color: enrichSource === 'boxer' ? '#0066CC' : enrichSource === 'rsf' ? '#2E7D32' : '#6A1B9A' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Consultando {enrichSource === 'boxer' ? 'Boxer' : enrichSource === 'rsf' ? 'Autopartes AR' : 'Promotive'}...
              </Typography>
              {enrichSource === 'rsf' && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>Esta búsqueda puede tardar ~20 segundos</Typography>
              )}
            </Box>
          )}

          {!loadingEnrich && enrichError && (
            <Alert severity="warning" sx={{ fontSize: '0.82rem' }}>{enrichError}</Alert>
          )}

          {/* ── Ficha técnica unificada ── */}
          {!loadingEnrich && enrichResults.length > 0 && (() => {
            const accentColor = enrichSource === 'boxer' ? '#0066CC' : enrichSource === 'rsf' ? '#2E7D32' : '#6A1B9A';
            const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : null;
            // Guard: si Boxer devuelve un objeto {id, nombre, ...} lo convierte a string
            const toStr = (v) => !v || v === '—' ? '' : (typeof v === 'object' ? (v.nombre || '') : String(v));

            // ─ Derivar datos normalizados por fuente ─────────────────────────
            let derived = null;
            if (enrichSource === 'boxer') {
              const results = enrichResults;
              const bestDesc = [...results].sort((a, b) => (b.descripcion?.length || 0) - (a.descripcion?.length || 0))[0];
              const codeMap = new Map();
              results.forEach(a => {
                if (a.articulo && a.articulo !== '—') codeMap.set(a.articulo, { label: 'Cód. proveedor', value: a.articulo, key: 'codigoArticulo' });
                if (a.original && a.original !== '—') codeMap.set(a.original, { label: 'OEM / Original', value: a.original, key: 'codigoOriginal' });
                if (a.auxiliar && a.auxiliar !== '—') codeMap.set(a.auxiliar, { label: 'Auxiliar 1', value: a.auxiliar, key: 'codigoAux1' });
                if (a.auxiliar2 && a.auxiliar2 !== '—') codeMap.set(a.auxiliar2, { label: 'Auxiliar 2', value: a.auxiliar2, key: 'codigoAux2' });
                if (a.auxiliar3 && a.auxiliar3 !== '—') codeMap.set(a.auxiliar3, { label: 'Auxiliar 3', value: a.auxiliar3, key: 'codigoAux3' });
              });
              const allText = results.map(a => a.descripcion || '').join(' ');
              const crossRefs = [...new Set(allText.split(/[;\s]+/).filter(t => /^[A-Z0-9]{5,20}$/.test(t) && !/^(VW|GOL|GOMA|NAFTA|MOTOR|BOMBA|TREND|SURAN|SAVEIRO|SKF)$/.test(t)))].slice(0, 24);
              const marca = toStr(results.find(a => a.marca && a.marca !== '—')?.marca);
              const rubro = toStr(results.find(a => a.rubro && a.rubro !== '—')?.rubro);
              const subrubro = toStr(results.find(a => a.subrubro && a.subrubro !== '—')?.subrubro);
              const iva = bestDesc?.iva;
              const proveedores = [...new Set(results.map(a => a.proveedor).filter(Boolean))];
              const ultimaVenta = results.map(a => a.fecha_ultima_venta).filter(Boolean).sort().pop();
              const ultimaCompra = results.map(a => a.fecha_ultima_compra).filter(Boolean).sort().pop();
              const descsUniq = [...new Map(results.map(a => [a.descripcion, { desc: a.descripcion, prov: a.proveedor }])).values()].filter(d => d.desc);
              derived = { tipo: 'boxer', codes: [...codeMap.values()], crossRefs, marca, rubro, subrubro, iva, proveedores, descsUniq, bestDesc, ultimaVenta, ultimaCompra, proveedoresCount: results.length };
            } else if (enrichSource === 'promotive') {
              const part = enrichResults[0] || {};
              derived = {
                tipo: 'promotive',
                brand: part.brand, product: part.product, description: part.description,
                ean: part.ean?.[0],
                specifications: part.specifications || [],
                vehicles: part.vehicles || [],
                images: part.images || [],
                partId: part.part_id || part.id,
              };
            } else if (enrichSource === 'rsf') {
              const sorted = [...enrichResults].sort((a, b) => (b.completitud_score || 0) - (a.completitud_score || 0));
              const best = sorted[0];
              const allOems = [...new Set(enrichResults.flatMap(a => a.oem_numbers || []))];
              const allProvs = enrichResults.flatMap(a => a.proveedores || []).filter((v, i, arr) => arr.findIndex(x => x.nombre === v.nombre) === i);
              derived = {
                tipo: 'rsf',
                nombre: best.nombre,
                fabricante: best.fabricante,
                categoria: best.categoria,
                tipoPieza: best.tipo_pieza,
                codigoFabricante: best.codigo_fabricante,
                oemNumbers: allOems,
                imagen: sorted.map(a => a.image_url).find(Boolean),
                proveedores: allProvs,
                completitud: best.completitud,
                score: best.completitud_score,
                totalFuentes: enrichResults.length,
              };
            }
            if (!derived) return null;

            // ─ Render helpers ────────────────────────────────────────────────
            const Section = ({ title, children }) => (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem', color: accentColor, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5, pl: 0.5, borderLeft: `3px solid ${accentColor}`, lineHeight: 1.2, paddingLeft: 0.8 }}>
                  {title}
                </Typography>
                <Box sx={{ border: '1px solid #f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                  {children}
                </Box>
              </Box>
            );
            const AttrRow = ({ label, value, mono, onApply, subtext }) => (
              value ? (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', px: 1.5, py: 0.7, borderBottom: '1px solid #f9f9f9', '&:last-child': { borderBottom: 0 }, '&:hover': { bgcolor: '#fafcff' } }}>
                  <Typography variant="caption" sx={{ width: 140, flexShrink: 0, color: '#999', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.3, pt: 0.1 }}>{label}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontFamily: mono ? 'monospace' : 'inherit', color: '#212121', lineHeight: 1.4 }}>{value}</Typography>
                    {subtext && <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#aaa' }}>{subtext}</Typography>}
                  </Box>
                  {onApply && (
                    <Button size="small" onClick={onApply}
                      sx={{ minWidth: 0, px: 1, py: 0, fontSize: '0.65rem', color: accentColor, fontWeight: 700, flexShrink: 0, ml: 1, '&:hover': { bgcolor: '#f0f0f0' } }}>
                      + Aplicar
                    </Button>
                  )}
                </Box>
              ) : null
            );

            // ─ acumular todo para "Aplicar Todo" ────────────────────────────
            const applyAll = () => {
              if (derived.tipo === 'boxer') {
                if (derived.bestDesc?.descripcion) setDescripcion(derived.bestDesc.descripcion);
                if (derived.marca) setMarca(derived.marca.toLowerCase());
                if (derived.rubro) setRubro(derived.rubro);
                if (derived.subrubro) setSubrubro(derived.subrubro);
                derived.codes.forEach(c => {
                  if (c.key === 'codigoArticulo') setCodigoArticulo(c.value);
                  else if (c.key === 'codigoOriginal') setCodigoOriginal(c.value);
                  else if (c.key === 'codigoAux1') setCodigoAux1(c.value);
                  else if (c.key === 'codigoAux2') setCodigoAux2(c.value);
                  else if (c.key === 'codigoAux3') setCodigoAux3(c.value);
                });
              } else if (derived.tipo === 'promotive') {
                if (derived.brand) setMarca(derived.brand.toLowerCase());
                if (derived.product || derived.description) setDescripcion(derived.product || derived.description);
              } else if (derived.tipo === 'rsf') {
                if (derived.nombre) setDescripcion(derived.nombre);
                if (derived.fabricante) setMarca(derived.fabricante.toLowerCase());
                if (derived.categoria) setRubro(derived.categoria);
                if (derived.codigoFabricante) setCodigoArticulo(derived.codigoFabricante);
                if (derived.oemNumbers?.[0]) setCodigoOriginal(derived.oemNumbers[0]);
              }
              setEnrichOpen(false);
            };

            return (
              <Box>
                {/* ── Imagen (si hay) ── */}
                {(derived.imagen || derived.images?.[0]) && (() => {
                  const imgSrc = derived.imagen || derived.images[0];
                  return (
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #f0f0f0', borderRadius: 1, bgcolor: '#fafafa' }}>
                      <Box component="img" src={imgSrc} alt="foto del artículo"
                        sx={{ height: 80, width: 80, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fff', flexShrink: 0 }}
                        onError={(e) => { e.target.style.display = 'none'; }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: '#999', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.3, display: 'block' }}>Foto del artículo</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#555', wordBreak: 'break-all', display: 'block', mt: 0.3 }}>{imgSrc.slice(0, 60)}{imgSrc.length > 60 ? '…' : ''}</Typography>
                      </Box>
                      <Button size="small" variant="outlined"
                        onClick={() => setFotoUrl(imgSrc)}
                        sx={{ fontSize: '0.68rem', color: accentColor, borderColor: accentColor, fontWeight: 700, textTransform: 'none', flexShrink: 0, '&:hover': { bgcolor: '#f0f0f0' } }}>
                        + Aplicar foto
                      </Button>
                    </Box>
                  );
                })()}

                {/* ── BOXER ── */}
                {derived.tipo === 'boxer' && (
                  <>
                    <Section title={`Identificación — ${derived.proveedoresCount} proveedor${derived.proveedoresCount !== 1 ? 'es' : ''} (${derived.proveedores.join(', ')})`}>
                      {derived.codes.map((c, i) => (
                        <AttrRow key={i} label={c.label} value={c.value} mono
                          onApply={() => {
                            if (c.key === 'codigoArticulo') setCodigoArticulo(c.value);
                            else if (c.key === 'codigoOriginal') setCodigoOriginal(c.value);
                            else if (c.key === 'codigoAux1') setCodigoAux1(c.value);
                            else if (c.key === 'codigoAux2') setCodigoAux2(c.value);
                            else if (c.key === 'codigoAux3') setCodigoAux3(c.value);
                          }} />
                      ))}
                    </Section>

                    <Section title="Descripción del artículo">
                      {derived.descsUniq.map((d, i) => (
                        <AttrRow key={i} label={d.prov} value={d.desc}
                          subtext={i === 0 ? 'más completa' : ''}
                          onApply={() => setDescripcion(d.desc)} />
                      ))}
                    </Section>

                    {(derived.marca || derived.rubro || derived.subrubro || derived.iva) && (
                      <Section title="Clasificación">
                        <AttrRow label="Marca" value={derived.marca} onApply={() => setMarca(derived.marca?.toLowerCase())} />
                        <AttrRow label="Rubro" value={derived.rubro} onApply={() => setRubro(derived.rubro)} />
                        <AttrRow label="Subrubro" value={derived.subrubro} onApply={() => setSubrubro(derived.subrubro)} />
                        <AttrRow label="IVA" value={derived.iva != null ? `${derived.iva}%` : null} />
                      </Section>
                    )}

                    {(derived.ultimaVenta || derived.ultimaCompra) && (
                      <Section title="Historial">
                        <AttrRow label="Última venta" value={fmtDate(derived.ultimaVenta)} />
                        <AttrRow label="Última compra" value={fmtDate(derived.ultimaCompra)} />
                      </Section>
                    )}

                    {derived.crossRefs?.length > 0 && (
                      <Section title={`Cross-referencias detectadas en descripción (${derived.crossRefs.length})`}>
                        <Box sx={{ px: 1.5, py: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {derived.crossRefs.map((r, i) => (
                            <Chip key={i} label={r} size="small" clickable
                              onClick={() => setCodigoOriginal(r)}
                              sx={{ fontSize: '0.64rem', height: 20, fontFamily: 'monospace', bgcolor: '#F3E5F5', color: '#6A1B9A' }}
                              title="Clic para aplicar como cód. original" />
                          ))}
                        </Box>
                        <Typography variant="caption" sx={{ px: 1.5, pb: 0.5, display: 'block', color: '#bbb', fontSize: '0.62rem' }}>
                          Clic en cualquier código para usarlo como "Cód. Original"
                        </Typography>
                      </Section>
                    )}
                  </>
                )}

                {/* ── PROMOTIVE ── */}
                {derived.tipo === 'promotive' && (
                  <>
                    <Section title="Identificación">
                      <AttrRow label="Código" value={derived.partId ? String(derived.partId) : null} mono onApply={() => setCodigoArticulo(String(derived.partId))} />
                      <AttrRow label="EAN / Barcode" value={derived.ean} mono onApply={() => setCodigoAux1(derived.ean)} />
                    </Section>
                    <Section title="Clasificación del artículo">
                      <AttrRow label="Marca" value={derived.brand} onApply={() => setMarca(derived.brand?.toLowerCase())} />
                      <AttrRow label="Tipo / Producto" value={derived.product} onApply={() => setDescripcion(derived.product)} />
                      <AttrRow label="Descripción" value={derived.description !== derived.product ? derived.description : null} onApply={() => setDescripcion(derived.description)} />
                    </Section>
                    {derived.specifications?.length > 0 && (
                      <Section title="Especificaciones técnicas">
                        {derived.specifications.map((s, i) => (
                          <AttrRow key={i} label={s.name} value={s.value} />
                        ))}
                      </Section>
                    )}
                    {derived.vehicles?.length > 0 && (
                      <Section title={`Vehículos compatibles (${derived.vehicles.length})`}>
                        <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {['Marca', 'Modelo', 'Versión', 'Motor', 'CC', 'Comb.', 'Años'].map(h => (
                                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.65rem', color: '#777', bgcolor: '#f9f9f9', py: 0.4, whiteSpace: 'nowrap' }}>{h}</TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {derived.vehicles.map((v, i) => (
                                <TableRow key={i} hover sx={{ '&:hover': { bgcolor: '#FAF5FF' } }}>
                                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{v.brand}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem' }}>{v.model || v.model_master}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem' }}>{v.version}</TableCell>
                                  <TableCell sx={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#6A1B9A' }}>{v.engine_code}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem' }}>{v.displacement_in_lts}L</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem' }}>{v.fuel}</TableCell>
                                  <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{v.sold_from_year}{v.sold_until_year ? `–${v.sold_until_year}` : '+'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Section>
                    )}
                  </>
                )}

                {/* ── AUTOPARTES AR ── */}
                {derived.tipo === 'rsf' && (
                  <>
                    <Section title={`Identificación — ${derived.totalFuentes} resultado${derived.totalFuentes !== 1 ? 's' : ''} · completitud: ${derived.score}%`}>
                      <AttrRow label="Cód. fabricante" value={derived.codigoFabricante} mono onApply={() => setCodigoArticulo(derived.codigoFabricante)} />
                      {derived.oemNumbers.map((oem, i) => (
                        <AttrRow key={i} label={i === 0 ? 'OEM / Original' : `OEM (${i + 1})`} value={oem} mono
                          onApply={() => i === 0 ? setCodigoOriginal(oem) : setCodigoAux1(oem)} />
                      ))}
                    </Section>
                    <Section title="Descripción y clasificación">
                      <AttrRow label="Nombre" value={derived.nombre} onApply={() => setDescripcion(derived.nombre)} />
                      <AttrRow label="Fabricante" value={derived.fabricante} onApply={() => setMarca(derived.fabricante?.toLowerCase())} />
                      <AttrRow label="Categoría" value={derived.categoria} onApply={() => setRubro(derived.categoria)} />
                      <AttrRow label="Tipo de pieza" value={derived.tipoPieza} />
                    </Section>
                    {derived.proveedores?.length > 0 && (
                      <Section title={`Proveedores (${derived.proveedores.length})`}>
                        {derived.proveedores.map((pv, i) => (
                          <AttrRow key={i} label={pv.nombre} value={pv.codigo} mono subtext={pv.url ? 'con URL disponible' : ''} />
                        ))}
                      </Section>
                    )}
                    {derived.completitud && (
                      <Section title="Completitud de datos">
                        <Box sx={{ px: 1.5, py: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.entries(derived.completitud).map(([k, v]) => (
                            <Chip key={k} label={k} size="small"
                              sx={{ fontSize: '0.62rem', height: 18,
                                bgcolor: v ? '#E8F5E9' : '#FFEBEE',
                                color: v ? '#2E7D32' : '#C62828',
                                fontWeight: v ? 600 : 400 }} />
                          ))}
                        </Box>
                      </Section>
                    )}
                  </>
                )}
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 2, py: 1.2, justifyContent: 'space-between' }}>
          <Button onClick={() => setEnrichOpen(false)} size="small" sx={{ textTransform: 'none', color: '#888', fontSize: '0.78rem' }}>
            Cerrar
          </Button>
          {!loadingEnrich && enrichResults.length > 0 && (
            <Button variant="contained" size="small"
              onClick={() => {
                const results = enrichResults;
                const pick = (arr, key) => arr.find(a => a[key] && a[key] !== '—')?.[key];
                if (enrichSource === 'boxer') {
                  const best = [...results].sort((a, b) => (b.descripcion?.length || 0) - (a.descripcion?.length || 0))[0];
                  if (best?.descripcion) setDescripcion(best.descripcion);
                  const m = pick(results, 'marca'); if (m) setMarca(m.toLowerCase());
                  const r = pick(results, 'rubro'); if (r) setRubro(typeof r === 'object' ? (r.nombre || '') : r);
                  const s = pick(results, 'subrubro'); if (s) setSubrubro(typeof s === 'object' ? (s.nombre || '') : s);
                  const ivaVal = best?.iva; if (ivaVal != null) setIva(ivaVal + '%');
                  const cod = pick(results, 'articulo'); if (cod) setCodigoArticulo(cod);
                  const orig = pick(results, 'original'); if (orig) setCodigoOriginal(orig);
                  const aux1 = pick(results, 'auxiliar'); if (aux1) setCodigoAux1(aux1);
                  const aux2 = pick(results, 'auxiliar2'); if (aux2) setCodigoAux2(aux2);
                  const aux3 = pick(results, 'auxiliar3'); if (aux3) setCodigoAux3(aux3);
                } else if (enrichSource === 'promotive') {
                  const part = results[0] || {};
                  if (part.brand) setMarca(part.brand.toLowerCase());
                  if (part.product || part.description) setDescripcion(part.product || part.description);
                  if (part.ean?.[0]) setCodigoAux1(part.ean[0]);
                  const img = part.images?.[0]; if (img) setFotoUrl(img);
                } else if (enrichSource === 'rsf') {
                  const sorted = [...results].sort((a, b) => (b.completitud_score || 0) - (a.completitud_score || 0));
                  const best = sorted[0];
                  if (best?.nombre) setDescripcion(best.nombre);
                  if (best?.fabricante) setMarca(best.fabricante.toLowerCase());
                  if (best?.categoria) setRubro(best.categoria);
                  if (best?.codigo_fabricante) setCodigoArticulo(best.codigo_fabricante);
                  const oems = [...new Set(results.flatMap(a => a.oem_numbers || []))];
                  if (oems[0]) setCodigoOriginal(oems[0]);
                  if (oems[1]) setCodigoAux1(oems[1]);
                  if (oems[2]) setCodigoAux2(oems[2]);
                  const img = sorted.map(a => a.image_url).find(Boolean); if (img) setFotoUrl(img);
                }
                setEnrichOpen(false);
              }}
              sx={{ bgcolor: enrichSource === 'boxer' ? '#0066CC' : enrichSource === 'rsf' ? '#2E7D32' : '#6A1B9A',
                '&:hover': { filter: 'brightness(0.9)' }, textTransform: 'none', fontSize: '0.78rem', fontWeight: 700, px: 2 }}>
              Aplicar Todo
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default NuevoArticulo;
