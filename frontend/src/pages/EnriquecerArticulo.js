import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Paper, Chip,
  CircularProgress, Autocomplete, Alert, IconButton,
  LinearProgress, Tooltip,
} from '@mui/material';
import {
  ArrowBack, ArrowForward, AutoAwesome, CheckCircle,
  Edit, ImageSearch, QrCode2, Description, Sell, Build,
  Save, ContentCopy, Check,
} from '@mui/icons-material';
import apiService from '../utils/api';

// ─── Constantes de fuentes ───────────────────────────────────────────────────
const SRC = {
  boxer:     { color: '#0066CC', bg: '#E3F2FD', label: 'Boxer' },
  promotive: { color: '#6A1B9A', bg: '#F3E5F5', label: 'Promotive' },
  rsf:       { color: '#2E7D32', bg: '#E8F5E9', label: 'Autopartes AR' },
  manual:    { color: '#E65100', bg: '#FFF3E0', label: 'Manual' },
};

const STEPS = ['Artículo', 'Códigos', 'Descripción', 'Marca', 'Técnico', 'Imágenes'];

const BRAND_RE = /^(VMG|SKF|NGK|BOSCH|MANN|DOLZ|MAHLE|FEBEST|JAPKO|LUK|VALEO|INA|FAG|NTN|NSK|GATES|DAYCO|CONTI|RMT|INDISA|LUCAS)/i;

// Palabras genéricas que NO son códigos de artículo
const GENERIC_WORDS = new Set([
  'BOMBA','AGUA','MOTOR','FILTRO','CORREA','FRENO','DISCO','BUJIA','ACEITE',
  'CAJA','EMBRAGUE','AMORTIGUADOR','JUEGO','KIT','SET','TIPO','CON','SIN',
  'PARA','SISTEMA','REFRIGERACION','SUSPENSION','TRANSMISION','ELECTRICO',
  'ORIGINAL','ALTERNATIVO','REPUESTO','PIEZA','PARTE','COMPLETO','COMPLETA',
]);

// Un token es un código si tiene dígitos o es alfanumérico largo no genérico
const isCodeLike = t =>
  t.length >= 4 &&
  !GENERIC_WORDS.has(t) &&
  (/\d/.test(t) || /^[A-Z]{2}[A-Z0-9]{2,}$/.test(t));

// Normalizar código para comparación (quita espacios, guiones, puntos)
const norm = c => (c || '').replace(/[\s\-.]/g, '').toUpperCase();

// Score de relevancia: cuánto se parece algún código del resultado a los candidatos
const scoreMatch = (resultCodes, candidates) => {
  const nc = candidates.map(norm).filter(x => x.length >= 3);
  const nr = resultCodes.map(norm).filter(Boolean);
  for (const r of nr) {
    for (const c of nc) {
      if (r === c) return 100;
      if (c.length >= 5 && r.length >= 5 && (r.includes(c) || c.includes(r))) return 75;
    }
  }
  return 0;
};

// ─── Sub-componentes ─────────────────────────────────────────────────────────
const SourceBadge = ({ src }) => (
  <Chip label={SRC[src]?.label} size="small"
    sx={{ fontSize: '0.6rem', height: 16, bgcolor: SRC[src]?.bg, color: SRC[src]?.color, fontWeight: 700, flexShrink: 0 }} />
);

const OptionCard = ({ text, src, selected, onClick, secondary, img }) => (
  <Box onClick={onClick} sx={{
    cursor: 'pointer',
    border: `1.5px solid ${selected ? SRC[src]?.color : '#e0e0e0'}`,
    borderRadius: 1.5, p: 1.5, mb: 1,
    bgcolor: selected ? SRC[src]?.bg : '#fff',
    display: 'flex', alignItems: 'flex-start', gap: 1,
    '&:hover': { borderColor: SRC[src]?.color, bgcolor: (SRC[src]?.bg || '#f5f5f5') },
    transition: 'border-color 0.15s, background-color 0.15s',
  }}>
    {img && (
      <Box component="img" src={img} alt="" sx={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 1, border: '1px solid #eee', flexShrink: 0 }}
        onError={e => { e.target.style.display = 'none'; }} />
    )}
    {selected && !img && <CheckCircle sx={{ fontSize: 16, color: SRC[src]?.color, mt: 0.25, flexShrink: 0 }} />}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: selected ? 600 : 400, lineHeight: 1.4, wordBreak: 'break-word' }}>
        {text}
      </Typography>
      {secondary && <Typography variant="caption" sx={{ color: '#757575', fontSize: '0.7rem' }}>{secondary}</Typography>}
    </Box>
    <SourceBadge src={src} />
  </Box>
);

const SectionLoading = ({ src }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, opacity: 0.7 }}>
    <CircularProgress size={12} sx={{ color: SRC[src]?.color }} />
    <Typography variant="caption" sx={{ color: SRC[src]?.color, fontSize: '0.7rem' }}>
      Buscando en {SRC[src]?.label}...
    </Typography>
  </Box>
);

// ─── Componente principal ────────────────────────────────────────────────────
const EnriquecerArticulo = ({ onBack, initialArticulo }) => {
  const [step, setStep] = useState(0);

  // Búsqueda de artículo
  const [busqueda, setBusqueda] = useState('');
  const [opciones, setOpciones] = useState([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [artSeleccionado, setArtSeleccionado] = useState(null);

  // Estado de carga por fuente
  const [loading, setLoading] = useState({ boxer: false, promotive: false, rsf: false });

  // Resultados crudos de cada fuente
  const [raw, setRaw] = useState({ boxer: [], promotive: [], rsf: [] });

  // Valores seleccionados/editados que se van a guardar
  const [vals, setVals] = useState({
    codigoArticulo: '', codigoOriginal: '', aux1: '', aux2: '', aux3: '',
    descripcion: '', marca: '', imagen: '', tecnico: {},
  });

  const [copied, setCopied] = useState(false);

  // ── Auto-seleccionar si se pasó un artículo desde la lista ───────────────
  useEffect(() => {
    if (!initialArticulo) return;
    const codigo = initialArticulo.articulo || initialArticulo.codigo || '';
    if (!codigo) return; // abierto desde el botón de barra sin artículo → quedarse en step 0
    const normalizado = {
      articulo: codigo,
      original: initialArticulo.original || '',
      auxiliar: initialArticulo.auxiliar || '',
      descripcion: initialArticulo.descripcion || '',
      marca: initialArticulo.marca || '',
      proveedor: initialArticulo.proveedor || '',
      id: initialArticulo.id,
    };
    handleSeleccionar(normalizado);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Buscar artículo (Boxer con fallback a Autopartes AR) ───────────────
  const handleBusqueda = useCallback(async (q) => {
    setBusqueda(q);
    if (q.length < 2) { setOpciones([]); return; }
    setLoadingBusqueda(true);
    try {
      const d = await apiService.getBoxerArticulos(q, 1, '', 0);
      const uniq = [];
      const seen = new Set();
      for (const a of d.articulos || []) {
        const key = a.articulo;
        if (!seen.has(key)) { seen.add(key); uniq.push({ ...a, _fuente: 'boxer' }); }
      }
      if (uniq.length > 0) { setOpciones(uniq.slice(0, 30)); setLoadingBusqueda(false); return; }
    } catch { /* Boxer caído, usar fallback */ }
    // Fallback: Autopartes AR
    try {
      const d2 = await apiService.searchAutpartesAR(q, 20, 0);
      const items = (d2.items || []).map(a => ({
        id: `ar-${a.id}`,
        articulo: a.codigo_fabricante || '',
        descripcion: a.nombre || '',
        marca: a.fabricante || '',
        proveedor: (a.proveedores?.[0]?.nombre) || 'Autopartes AR',
        original: (a.oem_numbers || [])[0] || '',
        auxiliar: '',
        _fuente: 'ar',
      }));
      setOpciones(items.slice(0, 20));
    } catch { setOpciones([]); }
    finally { setLoadingBusqueda(false); }
  }, []);

  // ── Seleccionar artículo → pre-llenar vals y buscar en todas las fuentes ──
  const handleSeleccionar = useCallback(async (art) => {
    if (!art) return;
    setArtSeleccionado(art);
    setRaw({ boxer: [], promotive: [], rsf: [] });
    setVals({
      codigoArticulo: art.articulo || '',
      codigoOriginal: art.original !== '—' ? (art.original || '') : '',
      aux1: art.auxiliar !== '—' ? (art.auxiliar || '') : '',
      aux2: '', aux3: '',
      descripcion: art.descripcion || '',
      marca: art.marca !== '—' ? (art.marca || '') : '',
      imagen: '', tecnico: {},
    });
    setStep(1);

    // Candidatos para búsqueda — OEM primero, sólo códigos reales (no palabras genéricas)
    const base = [art.articulo, art.original, art.auxiliar]
      .map(c => (c || '').trim())
      .filter(c => c && c !== '—' && c !== '-' && c.length >= 2);
    const stripped = base
      .map(c => c.replace(BRAND_RE, '').trim())
      .filter(c => c.length >= 3 && !base.includes(c));
    // Solo extraer tokens de descripción que parezcan códigos de pieza
    const descTokens = (art.descripcion || '').split(/[=\s;,]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => isCodeLike(t) && !base.includes(t) && !stripped.includes(t));
    // Prioridad: original/OEM primero → artículo → stripped → desc tokens
    const candidatos = [...new Set([
      ...(art.original && art.original !== '—' ? [art.original] : []),
      art.articulo,
      ...stripped,
      ...descTokens,
    ].filter(Boolean))];

    // Boxer (rápido) — con fallback silencioso si falla
    setLoading(l => ({ ...l, boxer: true }));
    apiService.getBoxerArticulos(candidatos[0] || art.articulo, 1, '', 0)
      .then(d => {
        const items = d.articulos || [];
        // Filtrar por relevancia si hay resultados
        const filtered = items.filter(a => {
          const codes = [a.articulo, a.original, a.auxiliar];
          return scoreMatch(codes, candidatos) > 0;
        });
        setRaw(r => ({ ...r, boxer: filtered.length > 0 ? filtered : items }));
      })
      .catch(() => {})
      .finally(() => setLoading(l => ({ ...l, boxer: false })));

    // Promotive — busca por cada candidato y filtra por relevancia
    setLoading(l => ({ ...l, promotive: true }));
    (async () => {
      try {
        const st = await apiService.getPromotiveStatus();
        if (!st.token_valid) await apiService.connectPromotive();
        let bestResults = [];
        for (const cod of candidatos.slice(0, 4)) {
          const d = await apiService.searchPromotiveParts(cod, 1, 30);
          const items = d.data || [];
          if (items.length === 0) continue;
          // Filtrar y puntuar por relevancia
          const scored = items
            .map(p => {
              const codes = [
                p.code, p.safe_code,
                ...(p.cross || []).map(c => c.code),
              ];
              return { ...p, _score: scoreMatch(codes, candidatos) };
            })
            .filter(p => p._score > 0)
            .sort((a, b) => b._score - a._score);
          if (scored.length >= 2) { bestResults = scored; break; }
          if (scored.length > 0 && bestResults.length === 0) bestResults = scored;
        }
        setRaw(r => ({ ...r, promotive: bestResults }));
      } catch {}
      finally { setLoading(l => ({ ...l, promotive: false })); }
    })();

    // Autopartes AR: busca por candidatos, filtra por relevancia, luego detalle
    setLoading(l => ({ ...l, rsf: true }));
    (async () => {
      try {
        let bestItems = [];
        for (const cod of candidatos.slice(0, 4)) {
          const d = await apiService.searchAutpartesAR(cod, 15, 0);
          const items = d.items || [];
          if (items.length === 0) continue;
          const scored = items
            .map(a => ({
              ...a,
              _score: scoreMatch(
                [a.codigo_fabricante, ...(a.oem_numbers || [])],
                candidatos
              ),
            }))
            .filter(a => a._score > 0)
            .sort((a, b) => b._score - a._score);
          if (scored.length >= 2) { bestItems = scored; break; }
          if (scored.length > 0 && bestItems.length === 0) bestItems = scored;
        }
        // Si no hay coincidencias exactas, tomar los de mayor completitud
        if (bestItems.length === 0) {
          const d = await apiService.searchAutpartesAR(candidatos[0] || art.articulo, 5, 0);
          bestItems = (d.items || []).slice(0, 3);
        }
        if (bestItems.length === 0) return;
        const top = bestItems.slice(0, 4).filter(a => a.id);
        const detalles = await Promise.allSettled(
          top.map(a => apiService.getAutpartesARDetail(a.id))
        );
        const full = detalles.filter(r => r.status === 'fulfilled').map(r => r.value);
        setRaw(r => ({ ...r, rsf: full.length > 0 ? full : bestItems }));
      } catch {}
      finally { setLoading(l => ({ ...l, rsf: false })); }
    })();
  }, []);

  // ── Derivar opciones por paso ────────────────────────────────────────────
  const getDescripciones = () => {
    const opts = [];
    const seen = new Set();
    const add = (text, src, secondary) => {
      const key = (text || '').toLowerCase().trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      opts.push({ text, src, secondary });
    };
    raw.boxer.forEach(a => add(a.descripcion, 'boxer', `Proveedor: ${a.proveedor}`));
    raw.promotive.forEach(p => {
      const desc = p.product || p.description;
      const secondary = [p.brand, p.category].filter(Boolean).join(' · ');
      add(desc, 'promotive', secondary);
    });
    raw.rsf.forEach(a => add(a.nombre, 'rsf', `Fab: ${a.codigo_fabricante}`));
    return opts;
  };

  const getMarcas = () => {
    const opts = [];
    const seen = new Set();
    const add = (text, src) => {
      const key = (text || '').toLowerCase().trim();
      if (!key || key === '—' || seen.has(key)) return;
      seen.add(key);
      opts.push({ text, src });
    };
    raw.boxer.forEach(a => add(a.marca, 'boxer'));
    raw.promotive.forEach(p => { add(p.brand, 'promotive'); });
    raw.rsf.forEach(a => add(a.fabricante, 'rsf'));
    return opts;
  };

  const getCodigos = () => {
    const groups = { articulo: new Map(), original: new Map(), aux: new Map() };
    raw.boxer.forEach(a => {
      if (a.articulo && a.articulo !== '—') groups.articulo.set(a.articulo, 'boxer');
      if (a.original && a.original !== '—') groups.original.set(a.original, 'boxer');
      if (a.auxiliar && a.auxiliar !== '—') groups.aux.set(a.auxiliar, 'boxer');
    });
    raw.promotive.forEach(p => {
      if (p.code) groups.articulo.set(p.code.replace(/\s/g, ''), 'promotive');
      // cross con oem=1 → códigos originales; el resto → auxiliares
      (p.cross || []).filter(c => c.code).forEach(c => {
        if (c.oem) groups.original.set(c.code, 'promotive');
        else groups.aux.set(c.code, 'promotive');
      });
    });
    raw.rsf.forEach(a => {
      if (a.codigo_fabricante) groups.articulo.set(a.codigo_fabricante, 'rsf');
      (a.oem_numbers || []).forEach(o => groups.original.set(o, 'rsf'));
    });
    return groups;
  };

  const getAtributos = () => {
    const map = new Map();
    raw.promotive.forEach(p => {
      (p.attributes || []).forEach(attr => {
        if (attr.name && attr.value) {
          const val = attr.unit ? `${attr.value} ${attr.unit}` : attr.value;
          map.set(attr.name, { value: val, src: 'promotive' });
        }
      });
      // Vehículos compatibles como atributos informativos
      (p.vehicles || []).slice(0, 5).forEach(v => {
        const key = `Vehículo: ${v.brand} ${v.model}`;
        const val = [v.version, v.engine_code, v.sold_from_year && v.sold_until_year ? `${v.sold_from_year}–${v.sold_until_year}` : ''].filter(Boolean).join(' · ');
        if (key && val && !map.has(key)) map.set(key, { value: val, src: 'promotive' });
      });
    });
    raw.rsf.forEach(a => {
      // especificaciones del detalle por ID
      (a.especificaciones || a.specifications || []).forEach(s => {
        const k = s.nombre || s.name;
        const v = s.valor || s.value;
        if (k && v && !map.has(k)) map.set(k, { value: v, src: 'rsf' });
      });
      // aplicaciones como atributos informativos
      (a.aplicaciones || []).slice(0, 6).forEach(ap => {
        const key = `Vehículo: ${ap.marca || ''} ${ap.modelo || ''}`.trim();
        const val = [ap.version, ap.anio_desde && ap.anio_hasta ? `${ap.anio_desde}–${ap.anio_hasta}` : ap.anio_desde].filter(Boolean).join(' ');
        if (key && val && !map.has(key)) map.set(key, { value: val, src: 'rsf' });
      });
    });
    return [...map.entries()].map(([k, v]) => ({ name: k, ...v }));
  };

  const getImagenes = () => {
    const imgs = [];
    const seen = new Set();
    const add = (url, src, label) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      imgs.push({ url, src, label });
    };
    raw.rsf.forEach(a => {
      // imagenes[] del detalle por ID (array completo)
      (a.imagenes || []).forEach(img => add(img.url || img, 'rsf', a.nombre || a.codigo_fabricante));
      // fallback a image_url del search
      add(a.image_url, 'rsf', a.nombre || a.codigo_fabricante);
    });
    raw.promotive.forEach(p => {
      (p.pictures || []).forEach(pic => add(pic.url || pic, 'promotive', p.product));
    });
    return imgs;
  };

  // ── Render de cada step ──────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0: return renderStepArticulo();
      case 1: return renderStepCodigos();
      case 2: return renderStepDescripcion();
      case 3: return renderStepMarca();
      case 4: return renderStepTecnico();
      case 5: return renderStepImagenes();
      default: return null;
    }
  };

  const renderStepArticulo = () => (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, color: '#555', fontSize: '0.85rem' }}>
        Buscá el artículo que querés enriquecer. Se consultarán Boxer, Autopartes AR y Promotive automáticamente.
      </Typography>
      <Autocomplete
        options={opciones}
        getOptionLabel={o => `${o.articulo || ''} — ${o.descripcion || ''}`}
        filterOptions={x => x}
        loading={loadingBusqueda}
        inputValue={busqueda}
        onInputChange={(_, v) => handleBusqueda(v)}
        onChange={(_, v) => v && handleSeleccionar(v)}
        noOptionsText={busqueda.length < 2 ? 'Escribí al menos 2 caracteres' : 'Sin resultados'}
        renderInput={params => (
          <TextField {...params} size="small" placeholder="Buscar por código o descripción..."
            InputProps={{ ...params.InputProps, sx: { fontSize: '0.875rem' },
              endAdornment: <>{loadingBusqueda ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</> }} />
        )}
        renderOption={(props, o) => (
          <Box component="li" {...props} key={o.id} sx={{ fontSize: '0.82rem', py: 0.8 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#0066CC' }}>{o.articulo}</Typography>
              <Typography variant="caption" sx={{ color: '#555', fontSize: '0.75rem' }}>{o.descripcion}</Typography>
              <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.72rem', display: 'block' }}>
                Marca: {o.marca} · Prov: {o.proveedor}
              </Typography>
            </Box>
          </Box>
        )}
      />
    </Box>
  );

  const renderStepCodigos = () => {
    const groups = getCodigos();
    const CodeGroup = ({ title, groupKey, stateKey }) => (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#555', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>{title}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5, mb: 0.5 }}>
          {[...groups[groupKey].entries()].map(([code, src]) => (
            <Chip key={code} label={code} size="small" clickable
              onClick={() => setVals(v => ({ ...v, [stateKey]: code }))}
              sx={{ fontSize: '0.75rem', bgcolor: vals[stateKey] === code ? SRC[src]?.bg : '#f5f5f5',
                color: vals[stateKey] === code ? SRC[src]?.color : '#333',
                border: `1px solid ${vals[stateKey] === code ? SRC[src]?.color : '#ddd'}`,
                fontWeight: vals[stateKey] === code ? 700 : 400 }}
              icon={vals[stateKey] === code ? <CheckCircle sx={{ fontSize: '12px !important' }} /> : undefined} />
          ))}
          {groups[groupKey].size === 0 && loading.boxer && loading.rsf && loading.promotive && <SectionLoading src="boxer" />}
        </Box>
        <TextField size="small" fullWidth placeholder={`Editar ${title.toLowerCase()} manualmente...`}
          value={vals[stateKey]} onChange={e => setVals(v => ({ ...v, [stateKey]: e.target.value }))}
          InputProps={{ sx: { fontSize: '0.82rem' } }} />
      </Box>
    );
    return (
      <Box>
        <LoadingBar loading={loading} />
        <CodeGroup title="Código artículo" groupKey="articulo" stateKey="codigoArticulo" />
        <CodeGroup title="Código original / OEM" groupKey="original" stateKey="codigoOriginal" />
        <CodeGroup title="Códigos auxiliares" groupKey="aux" stateKey="aux1" />
      </Box>
    );
  };

  const renderStepDescripcion = () => {
    const opts = getDescripciones();
    return (
      <Box>
        <LoadingBar loading={loading} />
        {opts.length === 0 && !loading.boxer && !loading.rsf && !loading.promotive && (
          <Alert severity="info" sx={{ mb: 1, fontSize: '0.8rem' }}>No se encontraron descripciones en las fuentes externas.</Alert>
        )}
        {opts.map((o, i) => (
          <OptionCard key={i} text={o.text} src={o.src} secondary={o.secondary}
            selected={vals.descripcion === o.text}
            onClick={() => setVals(v => ({ ...v, descripcion: o.text }))} />
        ))}
        <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem', display: 'block', mt: 1, mb: 0.5 }}>O escribí manualmente:</Typography>
        <TextField size="small" fullWidth multiline rows={2}
          value={vals.descripcion} onChange={e => setVals(v => ({ ...v, descripcion: e.target.value }))}
          InputProps={{ sx: { fontSize: '0.82rem' } }} />
      </Box>
    );
  };

  const renderStepMarca = () => {
    const opts = getMarcas();
    return (
      <Box>
        <LoadingBar loading={loading} />
        {opts.length === 0 && !loading.boxer && !loading.rsf && !loading.promotive && (
          <Alert severity="info" sx={{ mb: 1, fontSize: '0.8rem' }}>No se encontraron marcas en las fuentes externas.</Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {opts.map((o, i) => (
            <Chip key={i} label={o.text} size="small" clickable
              onClick={() => setVals(v => ({ ...v, marca: o.text }))}
              sx={{ fontSize: '0.78rem', bgcolor: vals.marca === o.text ? SRC[o.src]?.bg : '#f5f5f5',
                color: vals.marca === o.text ? SRC[o.src]?.color : '#333',
                border: `1px solid ${vals.marca === o.text ? SRC[o.src]?.color : '#ddd'}`,
                fontWeight: vals.marca === o.text ? 700 : 400 }}
              icon={vals.marca === o.text ? <CheckCircle sx={{ fontSize: '12px !important' }} /> : undefined} />
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>O escribí manualmente:</Typography>
        <TextField size="small" fullWidth placeholder="Ej: VMG, SKF, Bosch..."
          value={vals.marca} onChange={e => setVals(v => ({ ...v, marca: e.target.value }))}
          InputProps={{ sx: { fontSize: '0.82rem' } }} />
      </Box>
    );
  };

  const renderStepTecnico = () => {
    const atrs = getAtributos();
    return (
      <Box>
        <LoadingBar loading={loading} />
        {atrs.length === 0 && !loading.promotive && !loading.rsf && (
          <Alert severity="info" sx={{ mb: 1, fontSize: '0.8rem' }}>No se encontraron datos técnicos. Podés agregarlos manualmente.</Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {atrs.map((a, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#555', width: 160, flexShrink: 0 }}>{a.name}</Typography>
              <TextField size="small" sx={{ flex: 1 }}
                defaultValue={a.value}
                onChange={e => setVals(v => ({ ...v, tecnico: { ...v.tecnico, [a.name]: e.target.value } }))}
                InputProps={{ sx: { fontSize: '0.82rem' } }} />
              <SourceBadge src={a.src} />
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>Agregar atributo manual:</Typography>
          <ManualAtributo onAdd={(name, value) => setVals(v => ({ ...v, tecnico: { ...v.tecnico, [name]: value } }))} />
        </Box>
        {Object.keys(vals.tecnico).length > 0 && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#555' }}>SELECCIONADOS:</Typography>
            {Object.entries(vals.tecnico).map(([k, vv]) => (
              <Typography key={k} variant="caption" display="block" sx={{ fontSize: '0.75rem', color: '#333', mt: 0.25 }}>
                · <strong>{k}</strong>: {vv}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const renderStepImagenes = () => {
    const imgs = getImagenes();
    return (
      <Box>
        <LoadingBar loading={{ ...loading, boxer: false }} />
        {imgs.length === 0 && !loading.rsf && !loading.promotive && (
          <Alert severity="info" sx={{ mb: 1, fontSize: '0.8rem' }}>No se encontraron imágenes. Podés pegar la URL manualmente.</Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          {imgs.map((img, i) => (
            <Box key={i} onClick={() => setVals(v => ({ ...v, imagen: img.url }))}
              sx={{ width: 110, cursor: 'pointer', border: `2px solid ${vals.imagen === img.url ? SRC[img.src]?.color : '#e0e0e0'}`,
                borderRadius: 1.5, overflow: 'hidden', bgcolor: '#fafafa',
                '&:hover': { borderColor: SRC[img.src]?.color } }}>
              <Box component="img" src={img.url} alt="" sx={{ width: '100%', height: 80, objectFit: 'contain' }}
                onError={e => { e.target.parentElement.style.display = 'none'; }} />
              <Box sx={{ p: 0.5 }}>
                <SourceBadge src={img.src} />
                <Typography variant="caption" display="block" sx={{ fontSize: '0.62rem', color: '#666', mt: 0.25, lineHeight: 1.2 }} noWrap>{img.label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>URL de imagen manual:</Typography>
        <TextField size="small" fullWidth placeholder="https://..."
          value={vals.imagen} onChange={e => setVals(v => ({ ...v, imagen: e.target.value }))}
          InputProps={{ sx: { fontSize: '0.82rem' } }} />
        {vals.imagen && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#555', fontSize: '0.7rem' }}>Vista previa:</Typography>
            <Box component="img" src={vals.imagen} alt="preview"
              sx={{ display: 'block', maxHeight: 140, maxWidth: '100%', mt: 0.5, borderRadius: 1, border: '1px solid #ddd', objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }} />
          </Box>
        )}
      </Box>
    );
  };

  // ── Resumen final ────────────────────────────────────────────────────────
  const handleCopiar = () => {
    const txt = [
      `Código: ${vals.codigoArticulo}`,
      `Original: ${vals.codigoOriginal}`,
      `Aux: ${vals.aux1}`,
      `Descripción: ${vals.descripcion}`,
      `Marca: ${vals.marca}`,
      `Imagen: ${vals.imagen}`,
      ...Object.entries(vals.tecnico).map(([k, v]) => `${k}: ${v}`),
    ].join('\n');
    navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ── Layout principal ─────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton onClick={onBack} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 0.75 }}>
          <ArrowBack sx={{ fontSize: 18, color: '#555' }} />
        </IconButton>
        <Box>
          <Typography variant="caption" sx={{ color: '#757575', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
            CATÁLOGO
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1.2 }}>
            Enriquecer artículo
            {artSeleccionado && <Chip label={artSeleccionado.articulo} size="small" sx={{ ml: 1.5, fontSize: '0.75rem', bgcolor: '#E3F2FD', color: '#0066CC', fontWeight: 700 }} />}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          {Object.entries(loading).map(([src, isLoading]) => isLoading && (
            <Chip key={src} size="small" label={`Cargando ${SRC[src]?.label}...`}
              icon={<CircularProgress size={10} sx={{ color: `${SRC[src]?.color} !important` }} />}
              sx={{ fontSize: '0.65rem', bgcolor: SRC[src]?.bg, color: SRC[src]?.color, height: 20 }} />
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 3, maxWidth: 780, mx: 'auto' }}>
        {/* Stepper */}
        <Paper sx={{ p: 2, mb: 3, border: '1px solid #e4e4e7', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', gap: 0 }}>
            {STEPS.map((s, i) => (
              <Box key={s} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <Box sx={{ position: 'absolute', top: 13, left: '50%', width: '100%', height: 2,
                    bgcolor: i < step ? '#0066CC' : '#e0e0e0', zIndex: 0 }} />
                )}
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', zIndex: 1,
                  bgcolor: i < step ? '#0066CC' : i === step ? '#fff' : '#e0e0e0',
                  border: `2px solid ${i <= step ? '#0066CC' : '#e0e0e0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  {i < step
                    ? <Check sx={{ fontSize: 14, color: '#fff' }} />
                    : <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: i === step ? '#0066CC' : '#9e9e9e' }}>{i + 1}</Typography>}
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: i === step ? '#0066CC' : '#9e9e9e', fontWeight: i === step ? 700 : 400, textAlign: 'center' }}>
                  {s}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Contenido del step */}
        <Paper sx={{ p: 3, border: '1px solid #e4e4e7', boxShadow: 'none', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ fontSize: 16, color: '#0066CC' }} />
            {STEPS[step]}
          </Typography>
          {renderStep()}
        </Paper>

        {/* Navegación */}
        {step > 0 && (
          <Paper sx={{ p: 2, border: '1px solid #e4e4e7', boxShadow: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="small" startIcon={<ArrowBack />} onClick={() => setStep(s => s - 1)}
              sx={{ color: '#555', border: '1px solid #ddd', textTransform: 'none', fontSize: '0.8rem' }}>
              Anterior
            </Button>
            <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.72rem' }}>
              Paso {step} de {STEPS.length - 1}
            </Typography>
            {step < STEPS.length - 1 ? (
              <Button size="small" endIcon={<ArrowForward />} onClick={() => setStep(s => s + 1)}
                variant="contained" sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                Siguiente
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" startIcon={copied ? <Check /> : <ContentCopy />} onClick={handleCopiar}
                  sx={{ color: '#555', border: '1px solid #ddd', textTransform: 'none', fontSize: '0.8rem' }}>
                  {copied ? '¡Copiado!' : 'Copiar datos'}
                </Button>
                <Button size="small" startIcon={<Save />} variant="contained"
                  sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                  Guardar artículo
                </Button>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

// ─── Helper: barra de carga de fuentes ───────────────────────────────────────
const LoadingBar = ({ loading }) => {
  const any = Object.values(loading).some(Boolean);
  if (!any) return null;
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
      {Object.entries(loading).map(([src, isLoading]) => isLoading && (
        <Box key={src} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CircularProgress size={10} sx={{ color: SRC[src]?.color }} />
          <Typography variant="caption" sx={{ color: SRC[src]?.color, fontSize: '0.68rem' }}>
            {SRC[src]?.label}...
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ─── Helper: agregar atributo manual ─────────────────────────────────────────
const ManualAtributo = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField size="small" placeholder="Atributo" value={name} onChange={e => setName(e.target.value)}
        sx={{ flex: 1 }} InputProps={{ sx: { fontSize: '0.82rem' } }} />
      <TextField size="small" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)}
        sx={{ flex: 1 }} InputProps={{ sx: { fontSize: '0.82rem' } }} />
      <Button size="small" variant="outlined" onClick={() => { if (name && value) { onAdd(name, value); setName(''); setValue(''); } }}
        sx={{ textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
        + Agregar
      </Button>
    </Box>
  );
};

export default EnriquecerArticulo;
