import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert, IconButton,
  LinearProgress, TextField, Tooltip, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  ArrowBack, Close, CheckCircle, RadioButtonUnchecked, AutoAwesome,
  Image as ImageIcon, NavigateNext, NavigateBefore,
  ViewModule as CardViewIcon, TableChart as TableViewIcon,
} from '@mui/icons-material';
import apiService from '../utils/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SRC_STYLE = {
  Boxer:           { bg: '#E3F2FD', color: '#0066CC' },
  Promotive:       { bg: '#E8F5E9', color: '#2E7D32' },
  'Autopartes AR': { bg: '#FFF3E0', color: '#E65100' },
};

const norm = s => (s || '').replace(/[\s\-.]/g, '').toUpperCase();

const calcPct = enr => {
  if (!enr) return 0;
  const fields = [
    !!enr.descripcion,
    !!enr.categoria,
    !!enr.marca,
    !!enr.original,
    !!enr.imagen,
    !!enr.ean,
    (enr.atributos    || []).length > 0,
    (enr.vehiculos    || []).length > 0,
    (enr.equivalencias|| []).length > 0,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

const SrcChip = ({ src }) => (
  <Chip label={src} size="small" sx={{
    fontSize: '0.6rem', height: 18, fontWeight: 700, flexShrink: 0,
    bgcolor: SRC_STYLE[src]?.bg, color: SRC_STYLE[src]?.color,
  }} />
);

// ── Steps definition ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 'search',       label: 'Búsqueda'     },
  { id: 'descripcion',  label: 'Descripción'   },
  { id: 'categoria',    label: 'Categoría'     },
  { id: 'marca',        label: 'Marca'         },
  { id: 'original',     label: 'Original OEM'  },
  { id: 'atributos',    label: 'Atributos'     },
  { id: 'vehiculos',    label: 'Vehículos'     },
  { id: 'equivalencias',label: 'Equivalencias' },
  { id: 'ean',          label: 'EAN'           },
  { id: 'imagen',       label: 'Imagen'        },
  { id: 'done',         label: '✓ Listo'       },
];

// ── Component ─────────────────────────────────────────────────────────────────

const EnriquecerMasivo = ({ articles, onClose }) => {
  // All selected articles = ONE unified article
  const getFirst = field =>
    articles.find(a => a[field] && a[field] !== '—')?.[field] || '';

  const mainCode = articles[0]?.articulo || '—';
  const allCodes = [...new Set(articles.map(a => a.articulo).filter(Boolean))];

  const [stepId,      setStepId]      = useState('search');
  const [previewMode, setPreviewMode] = useState('card'); // 'card' | 'table'
  const [results,  setResults] = useState({ boxer: [], promotive: [], ar: [] });
  const [srcProg,  setSrcProg] = useState({ boxer: 'loading', promotive: 'loading', ar: 'loading' });

  const [enriched, setEnriched] = useState({
    codigo:          mainCode,
    descripcion:     getFirst('descripcion'),
    categoria:       '',
    marca:           getFirst('marca'),
    original:        getFirst('original'),
    aux1:            getFirst('auxiliar'),
    equivalencias:   [],
    imagen:          '',
    atributos:       [],
    componentes_kit: [],
    vehiculos:       [],
    ean:             '',
  });

  const set = (field, val) => setEnriched(prev => ({ ...prev, [field]: val }));

  // ── Auto-search on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const promSearch = q =>
      fetch(`/api/promotive/search/parts?search=${encodeURIComponent(q)}&limit=20`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

    const doSearch = async () => {
      const q = mainCode;
      const qNorm = q.replace(/[\s\-.]/g, '').toUpperCase();

      // ── Búsqueda doble en Promotive ──────────────────────────────────────
      // Promotive no indexa kits VKMC directamente — los tiene como componentes
      // de la bomba (VKPC). Derivamos el código del kit de correa (VKMA) para
      // obtener imágenes, cross OEM, atributos y EAN correctos.
      const deriveAltCode = code => {
        // VKMC06020A → VKMA06020A  (quita la C del sufijo del kit con bomba)
        const m = code.match(/^(VKM)C(\d.*)$/i);
        if (m) return `${m[1]}A${m[2]}`;
        return null;
      };
      const altCode = deriveAltCode(qNorm);

      const [bR, pR, aR] = await Promise.allSettled([
        apiService.getBoxerArticulos(q, 1),
        (async () => {
          const primary = await promSearch(q);
          const primaryItems = primary?.data || [];
          // Si el resultado primario no es un match directo de nuestro código
          // Y hay un código alternativo (ej: VKMA), hacer segunda búsqueda
          const directMatch = primaryItems.some(
            it => (it.safe_code || '').toUpperCase() === qNorm
          );
          if (!directMatch && altCode) {
            const secondary = await promSearch(altCode).catch(() => ({ data: [] }));
            const secItems = secondary?.data || [];
            // Marcamos los items secundarios para distinguirlos en cand
            secItems.forEach(it => { it._source_query = altCode; });
            return { data: [...primaryItems, ...secItems] };
          }
          return { data: primaryItems };
        })(),
        apiService.searchAutpartesAR(q),
      ]);

      setSrcProg({
        boxer:     bR.status === 'fulfilled' ? 'done' : 'error',
        promotive: pR.status === 'fulfilled' ? 'done' : 'error',
        ar:        aR.status === 'fulfilled' ? 'done' : 'error',
      });
      setResults({
        boxer:     bR.status === 'fulfilled' ? (bR.value?.articulos || bR.value?.results || []) : [],
        promotive: pR.status === 'fulfilled' ? (pR.value?.data || []) : [],
        ar:        aR.status === 'fulfilled' ? (aR.value?.items || aR.value || []) : [],
      });
      setStepId('descripcion');
    };
    doSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Completion % ─────────────────────────────────────────────────────────
  const completion = calcPct(enriched);
  const pctColor   = completion >= 80 ? '#4caf50' : completion >= 50 ? '#ff9800' : '#f44336';

  // ── Candidates per field ──────────────────────────────────────────────────
  const cand = useMemo(() => {
    const ub = (arr, fn) => [...new Map(arr.map(c => [fn(c), c])).values()];
    return {
      descripcion: ub([
        ...articles.filter(a => a.descripcion && a.descripcion !== '—').map(a => ({ val: a.descripcion, src: 'Boxer' })),
        // Si el componente del resultado Promotive coincide con el código buscado, usar su product name (más preciso)
        ...(results.promotive || []).flatMap(p =>
          (p.components || [])
            .filter(c => c.product && norm(c.safe_code || c.code) === norm(allCodes[0] || ''))
            .map(c => ({ val: c.product, src: 'Promotive' }))
        ),
        // También la descripción directa del resultado (puede ser otro producto relacionado)
        ...(results.promotive || [])
          .filter(p => p.description && p.description !== p.product)
          .map(p => ({ val: p.description, src: 'Promotive' })),
        ...(results.promotive || []).filter(p => p.product).map(p => ({ val: p.product, src: 'Promotive' })),
        ...(results.ar        || []).filter(a => a.nombre).map(a => ({ val: a.nombre, src: 'Autopartes AR' })),
      ], c => norm(c.val)).slice(0, 8),

      marca: ub([
        ...articles.filter(a => a.marca && a.marca !== '—').map(a => ({ val: a.marca, src: 'Boxer' })),
        ...(results.promotive || []).filter(p => p.brand).map(p => ({ val: p.brand, src: 'Promotive' })),
        ...(results.ar        || []).filter(a => a.fabricante && typeof a.fabricante === 'string').map(a => ({ val: a.fabricante, src: 'Autopartes AR' })),
      ], c => c.val).slice(0, 8),

      original: ub([
        ...articles.filter(a => a.original && a.original !== '—').map(a => ({ val: a.original, src: 'Boxer' })),
        ...(results.promotive || []).filter(p => p.oem_code).map(p => ({ val: p.oem_code, src: 'Promotive' })),
        ...(results.ar        || []).flatMap(a => (a.oem_numbers || []).map(o => ({ val: o, src: 'Autopartes AR' }))),
      ], c => c.val).slice(0, 8),

      imagen: ub([
        // Priorizar imágenes del kit derivado (VKMA) sobre la bomba (VKPC)
        ...(results.promotive || []).filter(p => p._source_query).flatMap(p => (p.pictures || []).filter(pic => pic.url).map(pic => ({ val: pic.url, src: 'Promotive' }))),
        ...(results.promotive || []).filter(p => !p._source_query).flatMap(p => (p.pictures || []).filter(pic => pic.url).map(pic => ({ val: pic.url, src: 'Promotive (componente)' }))),
        ...(results.ar || []).filter(a => a.image_url && typeof a.image_url === 'string' && a.image_url.startsWith('http')).map(a => ({ val: a.image_url, src: 'Autopartes AR' })),
        ...(results.ar || []).flatMap(a => (a.images || a.imagenes || []).filter(img => typeof img === 'string' && img.startsWith('http')).map(img => ({ val: img, src: 'Autopartes AR' }))),
      ], c => c.val).slice(0, 10),

      equivalencias: ub([
        ...(results.ar || []).flatMap(a =>
          (a.oem_numbers || [])
            .filter(o => !allCodes.map(c => norm(c)).includes(norm(o)))
            .map(o => ({ val: o, src: 'Autopartes AR' }))
        ),
        // Cross del kit derivado (VKMA) primero — son OEM correctos del kit
        ...(results.promotive || []).filter(p => p._source_query).flatMap(p =>
          (p.cross || []).filter(x => x.code)
            .filter(x => !allCodes.map(c => norm(c)).includes(norm(x.code)))
            .map(x => ({ val: x.code, src: x.oem ? 'Promotive OEM' : 'Promotive' }))
        ),
        // Cross de la bomba marcados como componente
        ...(results.promotive || []).filter(p => !p._source_query).flatMap(p =>
          (p.cross || []).filter(x => x.code)
            .filter(x => !allCodes.map(c => norm(c)).includes(norm(x.code)))
            .map(x => ({ val: x.code, src: 'Promotive (bomba)' }))
        ),
      ], c => norm(c.val)).slice(0, 20),

      atributos: ub(
        (results.promotive || []).flatMap(p =>
          (p.attributes || []).filter(a => a.name && a.value).map(a => ({ nombre: a.name, valor: a.value }))
        ), a => norm(a.nombre + a.valor)
      ).slice(0, 12),

      engine_codes: ub(
        (results.promotive || []).flatMap(p =>
          (p.vehicles || []).filter(v => v.engine_code).map(v => v.engine_code)
        ), c => norm(c)
      ).slice(0, 8),

      componentes_kit: ub(
        (results.promotive || []).flatMap(p =>
          (p.components || []).filter(c => c.code).map(c => ({ codigo: c.code, producto: c.product || '' }))
        ), c => norm(c.codigo)
      ).slice(0, 10),

      categoria: ub([
        ...(results.promotive || []).filter(p => p.category).map(p => ({ val: p.category, src: 'Promotive' })),
        ...(results.ar        || []).filter(a => a.categoria).map(a => ({ val: a.categoria, src: 'Autopartes AR' })),
      ], c => norm(c.val)).slice(0, 6),

      ean: ub([
        // EAN del kit derivado primero (VKMA), luego la bomba
        ...(results.promotive || []).filter(p => p._source_query).flatMap(p => (p.ean || []).map(e => ({ val: e, src: 'Promotive' }))),
        ...(results.promotive || []).filter(p => !p._source_query).flatMap(p => (p.ean || []).map(e => ({ val: e, src: 'Promotive (bomba)' }))),
      ], c => c.val).slice(0, 4),

      vehiculos: ub(
        (results.promotive || []).flatMap(p =>
          (p.vehicles || []).filter(v => v.brand || v.model).map(v => ({
            marca:        v.brand || '',
            modelo:       v.model || v.model_master || '',
            version:      v.version || '',
            engine_code:  v.engine_code || '',
            desde:        v.sold_from_year || null,
            hasta:        v.sold_until_year || null,
          }))
        ), v => norm(v.marca + v.modelo + v.version)
      ).slice(0, 30),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const equivAdded = code => (enriched.equivalencias || []).some(e => norm(e.codigo || e) === norm(code));

  // ── Step navigation ───────────────────────────────────────────────────────
  const stepIdx  = STEPS.findIndex(s => s.id === stepId);
  const canPrev  = stepIdx > 1; // can't go back to 'search'
  const canNext  = stepIdx < STEPS.length - 1;
  const goNext   = () => setStepId(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)].id);
  const goPrev   = () => setStepId(STEPS[Math.max(stepIdx - 1, 1)].id);

  // ── Step Navigator bar ────────────────────────────────────────────────────
  const StepNav = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', pb: 0 }}>
      {STEPS.map((s, i) => {
        const isCurrent = s.id === stepId;
        const isDone    = i < stepIdx;
        const isSearch  = s.id === 'search';
        return (
          <React.Fragment key={s.id}>
            <Box
              onClick={() => !isSearch && setStepId(s.id)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.6,
                px: 2, py: 1.2, cursor: isSearch ? 'default' : 'pointer',
                borderBottom: isCurrent ? '2.5px solid #1a237e' : '2.5px solid transparent',
                color: isCurrent ? '#1a237e' : isDone ? '#4caf50' : '#9e9e9e',
                fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                fontSize: '0.78rem', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                '&:hover': isSearch ? {} : { color: '#1a237e' },
              }}>
              {isDone && <CheckCircle sx={{ fontSize: 13 }} />}
              {isSearch && srcProg.boxer === 'loading' && <CircularProgress size={11} />}
              {s.label}
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ width: 6, height: 1, bgcolor: '#e0e0e0', flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );

  // ── Product Card (Ficha) ──────────────────────────────────────────────────
  const ProductCard = () => {
    const motorCodes = (enriched.atributos || []).filter(a => a.nombre === 'Motor');
    const techAttrs  = (enriched.atributos || []).filter(a => a.nombre !== 'Motor');
    const ACTIVE_SECTION = {
      atributos: stepId === 'atributos',
      vehiculos: stepId === 'vehiculos',
      equivalencias: stepId === 'equivalencias',
      imagen: stepId === 'imagen',
    };
    const activeBorder = '2px solid #1a237e';
    const inactiveBorder = '1px solid #e4e4e7';

    return (
      <Box sx={{ border: '1px solid #e4e4e7', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* ── Header: imagen + datos principales ── */}
        <Box sx={{ display: 'flex', gap: 0, borderBottom: '1px solid #f0f0f0' }}>

          {/* Imagen */}
          <Box onClick={() => setStepId('imagen')}
            sx={{ width: 120, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: '#fafafa', borderRight: '1px solid #f0f0f0', cursor: 'pointer',
              border: ACTIVE_SECTION.imagen ? activeBorder : 'none',
              transition: 'border 0.15s', '&:hover': { bgcolor: '#f0f4ff' } }}>
            {enriched.imagen
              ? <Box component="img" src={enriched.imagen} sx={{ width: 96, height: 96, objectFit: 'contain' }} />
              : <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, py: 3, color: '#ccc' }}>
                  <ImageIcon sx={{ fontSize: 36 }} />
                  <Typography sx={{ fontSize: '0.6rem', color: '#bbb' }}>Sin imagen</Typography>
                </Box>}
          </Box>

          {/* Datos principales */}
          <Box sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
            {/* Código + Proveedor + % */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#1a237e' }}>
                {enriched.codigo}
              </Typography>
              <Chip
                label={enriched.marca || '—'}
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', bgcolor: enriched.marca ? '#E3F2FD' : '#f5f5f5', color: enriched.marca ? '#0066CC' : '#bdbdbd', fontWeight: 700 }}
              />
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: pctColor }}>{completion}%</Typography>
                <Box sx={{ width: 48, height: 5, borderRadius: 3, bgcolor: '#eee', overflow: 'hidden' }}>
                  <Box sx={{ width: `${completion}%`, height: '100%', bgcolor: pctColor, borderRadius: 3, transition: 'width 0.4s' }} />
                </Box>
              </Box>
            </Box>

            {/* Descripción */}
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: enriched.descripcion ? '#222' : '#bbb', fontStyle: enriched.descripcion ? 'normal' : 'italic', lineHeight: 1.3 }}>
              {enriched.descripcion || 'Sin descripción'}
            </Typography>

            {/* OEM + Categoría + EAN */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {enriched.original && (
                <Chip label={`OEM: ${enriched.original}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#E8EAF6', color: '#283593', fontWeight: 700 }} />
              )}
              {enriched.categoria && (
                <Chip label={enriched.categoria} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#F3E5F5', color: '#7B1FA2', fontWeight: 600 }} />
              )}
              {enriched.ean && (
                <Typography sx={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#555', border: '1px solid #e0e0e0', borderRadius: 0.5, px: 0.8, py: 0.2 }}>
                  EAN: {enriched.ean}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── Atributos + Motores ── */}
        <Box onClick={() => setStepId('atributos')}
          sx={{ p: 1.2, borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
            border: ACTIVE_SECTION.atributos ? activeBorder : inactiveBorder,
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            '&:hover': { bgcolor: '#fafafa' } }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {techAttrs.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Atributos</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                  {techAttrs.map((a, i) => (
                    <Chip key={i} label={`${a.nombre}: ${a.valor}`} size="small"
                      sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#E8EAF6', color: '#283593', fontWeight: 600 }} />
                  ))}
                </Box>
              </Box>
            )}
            {motorCodes.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Motores</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                  {motorCodes.map((a, i) => (
                    <Chip key={i} label={a.valor} size="small"
                      sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }} />
                  ))}
                </Box>
              </Box>
            )}
            {(enriched.componentes_kit || []).length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Cód. KIT</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                  {enriched.componentes_kit.map((c, i) => (
                    <Chip key={i} label={c.codigo} size="small"
                      sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700 }} />
                  ))}
                </Box>
              </Box>
            )}
            {techAttrs.length === 0 && motorCodes.length === 0 && (enriched.componentes_kit || []).length === 0 && (
              <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd', fontStyle: 'italic' }}>Click para agregar atributos</Typography>
            )}
          </Box>
        </Box>

        {/* ── Vehículos ── */}
        <Box onClick={() => setStepId('vehiculos')}
          sx={{ p: 1.2, borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
            border: ACTIVE_SECTION.vehiculos ? activeBorder : inactiveBorder,
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            '&:hover': { bgcolor: '#fafafa' } }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Vehículos compatibles</Typography>
          {(enriched.vehiculos || []).length === 0
            ? <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd', fontStyle: 'italic' }}>Click para seleccionar vehículos</Typography>
            : <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, maxHeight: 100, overflowY: 'auto' }}>
                {enriched.vehiculos.map((v, i) => (
                  <Typography key={i} sx={{ fontSize: '0.7rem', color: '#333', lineHeight: 1.4 }}>
                    <span style={{ color: '#1a237e', fontWeight: 600 }}>{v.marca}</span>{' '}
                    {v.modelo}{v.version ? ` · ${v.version}` : ''}
                    {(v.desde || v.hasta) && <span style={{ color: '#9e9e9e', marginLeft: 6 }}>{v.desde}{v.hasta && v.desde !== v.hasta ? `–${v.hasta}` : ''}</span>}
                  </Typography>
                ))}
              </Box>
          }
        </Box>

        {/* ── Equivalencias ── */}
        <Box onClick={() => setStepId('equivalencias')}
          sx={{ p: 1.2, cursor: 'pointer',
            border: ACTIVE_SECTION.equivalencias ? activeBorder : 'none',
            '&:hover': { bgcolor: '#fafafa' } }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Equivalencias</Typography>
          {(enriched.equivalencias || []).length === 0
            ? <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd', fontStyle: 'italic' }}>Click para agregar equivalencias</Typography>
            : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                {enriched.equivalencias.map((e, i) => (
                  <Chip key={i} label={e.codigo || e} size="small"
                    sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#FFF8E1', color: '#E65100', fontWeight: 700 }} />
                ))}
              </Box>
          }
        </Box>

      </Box>
    );
  };

  // ── Live article preview table ────────────────────────────────────────────
  const PreviewTable = () => (
    <Box>
      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e4e4e7' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['','Código','Descripción','Marca','Original OEM','Categoría','EAN','Atrib. Técnicos','Motores','Cód. KIT','Vehículos','Equivalencias'].map(h => (
                <TableCell key={h} sx={{ bgcolor: '#1a237e', color: '#fff !important', fontWeight: 700, fontSize: '0.72rem', py: 1.2, borderRight: '1px solid rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: '#f8f9ff' }}>
              {/* Imagen */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.5, py: 0.5, width: 80 }}>
                {enriched.imagen
                  ? <Box component="img" src={enriched.imagen} sx={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />
                  : <Box sx={{ width: 72, height: 72, border: '1px dashed #ccc', borderRadius: 1, bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon sx={{ fontSize: 26, color: '#ccc' }} />
                    </Box>}
              </TableCell>
              {/* Código */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6', fontFamily: 'monospace', fontWeight: 700, color: '#1a237e', fontSize: '0.82rem' }}>
                {enriched.codigo}
              </TableCell>
              {/* Descripción */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6', maxWidth: 260 }}>
                {enriched.descripcion
                  ? <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{enriched.descripcion}</Typography>
                  : <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd', fontStyle: 'italic' }}>Sin descripción</Typography>}
              </TableCell>
              {/* Marca */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6' }}>
                {enriched.marca
                  ? <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#37474f' }}>{enriched.marca}</Typography>
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* Original OEM */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6' }}>
                {enriched.original
                  ? <Chip label={enriched.original} size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#E8EAF6', color: '#283593', fontWeight: 600 }} />
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* Categoría */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6' }}>
                {enriched.categoria
                  ? <Chip label={enriched.categoria} size="small" sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#E8EAF6', color: '#283593', fontWeight: 600 }} />
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* EAN */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6' }}>
                {enriched.ean
                  ? <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: '#37474f' }}>{enriched.ean}</Typography>
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* Atrib. Técnicos (sin motores) */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6' }}>
                {(enriched.atributos || []).filter(a => a.nombre !== 'Motor').length > 0
                  ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      {enriched.atributos.filter(a => a.nombre !== 'Motor').map((a, i) => (
                        <Chip key={i} label={`${a.nombre}: ${a.valor}`} size="small"
                          sx={{ fontSize: '0.6rem', height: 16, bgcolor: '#E8EAF6', color: '#283593', fontWeight: 600 }} />
                      ))}
                    </Box>
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* Motores */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6' }}>
                {(enriched.atributos || []).filter(a => a.nombre === 'Motor').length > 0
                  ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      {enriched.atributos.filter(a => a.nombre === 'Motor').map((a, i) => (
                        <Chip key={i} label={a.valor} size="small"
                          sx={{ fontSize: '0.6rem', height: 16, bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }} />
                      ))}
                    </Box>
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* Cód. KIT */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6' }}>
                {(enriched.componentes_kit || []).length > 0
                  ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      {enriched.componentes_kit.map((c, i) => (
                        <Chip key={i} label={c.codigo} size="small"
                          sx={{ fontSize: '0.6rem', height: 16, bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700 }} />
                      ))}
                    </Box>
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* Vehículos */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6', maxWidth: 200 }}>
                {(enriched.vehiculos || []).length > 0
                  ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, maxHeight: 160, overflowY: 'auto' }}>
                      {enriched.vehiculos.map((v, i) => (
                        <Typography key={i} sx={{ fontSize: '0.65rem', color: '#2E7D32', lineHeight: 1.5 }}>
                          {v.marca} {v.modelo}{v.version ? ` · ${v.version}` : ''}
                          {(v.desde || v.hasta) && <span style={{ color: '#9e9e9e', marginLeft: 4 }}>{v.desde}{v.hasta && v.desde !== v.hasta ? `–${v.hasta}` : ''}</span>}
                        </Typography>
                      ))}
                    </Box>
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
              {/* Equivalencias */}
              <TableCell sx={{ borderRight: '1px solid #ede7f6', maxWidth: 160 }}>
                {(enriched.equivalencias || []).length > 0
                  ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {enriched.equivalencias.map((e, i) => (
                        <Chip key={i} label={e.codigo || e} size="small"
                          sx={{ fontSize: '0.6rem', height: 16, bgcolor: '#FFF8E1', color: '#E65100', fontWeight: 700, width: 'fit-content' }} />
                      ))}
                    </Box>
                  : <Typography sx={{ fontSize: '0.72rem', color: '#bdbdbd' }}>—</Typography>}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // ── Step: Searching ───────────────────────────────────────────────────────
  const StepSearch = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
      <Typography sx={{ fontWeight: 600, color: '#555' }}>
        Buscando información para <span style={{ fontFamily: 'monospace', color: '#1a237e', fontWeight: 700 }}>{mainCode}</span>...
      </Typography>
      <Box sx={{ display: 'flex', gap: 3 }}>
        {[
          { label: 'Boxer',         key: 'boxer' },
          { label: 'Promotive',     key: 'promotive' },
          { label: 'Autopartes AR', key: 'ar' },
        ].map(({ label, key }) => {
          const s = srcProg[key];
          return (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <SrcChip src={label} />
              {s === 'loading' && <CircularProgress size={14} />}
              {s === 'done'    && <CheckCircle sx={{ fontSize: 15, color: '#4caf50' }} />}
              {s === 'error'   && <Typography sx={{ fontSize: '0.72rem', color: '#f44336' }}>Error</Typography>}
              <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                {s === 'done' ? `${(results[key] || []).length} resultados` : s === 'loading' ? 'buscando...' : ''}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  // ── Step content renderer ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (stepId) {
      case 'search': return <StepSearch />;

      case 'descripcion': return (
        <Box>
          <TextField fullWidth size="small" multiline rows={2} value={enriched.descripcion || ''}
            onChange={e => set('descripcion', e.target.value)} placeholder="Ingresá o elegí una descripción..." sx={{ mb: 1.5 }} />
          <Typography sx={{ fontSize: '0.7rem', color: '#757575', mb: 0.8 }}>Sugerencias — click para seleccionar:</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {cand.descripcion.map((c, i) => (
              <Box key={i} onClick={() => set('descripcion', c.val)}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1, borderRadius: 1, cursor: 'pointer',
                  border: `1px solid ${enriched.descripcion === c.val ? '#0066CC' : '#e0e0e0'}`,
                  bgcolor: enriched.descripcion === c.val ? '#E3F2FD' : '#fafafa',
                  '&:hover': { borderColor: '#0066CC', bgcolor: '#f0f4ff' } }}>
                <SrcChip src={c.src} />
                <Typography sx={{ fontSize: '0.8rem', flex: 1 }}>{c.val}</Typography>
                {enriched.descripcion === c.val && <CheckCircle sx={{ fontSize: 15, color: '#0066CC', flexShrink: 0 }} />}
              </Box>
            ))}
            {cand.descripcion.length === 0 && <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontraron sugerencias</Typography>}
          </Box>
        </Box>
      );

      case 'categoria': return (
        <Box>
          <TextField fullWidth size="small" value={enriched.categoria || ''}
            onChange={e => set('categoria', e.target.value)} placeholder="Ej: Bombas de Agua, Sistema de Refrigeración..." sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
            {cand.categoria.map((c, i) => (
              <Chip key={i} label={c.val} size="small" onClick={() => set('categoria', c.val)}
                sx={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, height: 26,
                  bgcolor: enriched.categoria === c.val ? '#E8EAF6' : SRC_STYLE[c.src]?.bg,
                  color:   enriched.categoria === c.val ? '#283593' : SRC_STYLE[c.src]?.color,
                  border:  `1.5px solid ${enriched.categoria === c.val ? '#283593' : 'transparent'}` }} />
            ))}
            {cand.categoria.length === 0 && <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontraron categorías</Typography>}
          </Box>
        </Box>
      );

      case 'marca': return (
        <Box>
          <TextField fullWidth size="small" value={enriched.marca || ''}
            onChange={e => set('marca', e.target.value)} placeholder="Ingresá o elegí la marca..." sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
            {cand.marca.map((c, i) => (
              <Chip key={i} label={c.val} size="small" onClick={() => set('marca', c.val)}
                sx={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, height: 26,
                  bgcolor: enriched.marca === c.val ? '#E3F2FD' : SRC_STYLE[c.src]?.bg,
                  color:   enriched.marca === c.val ? '#0066CC' : SRC_STYLE[c.src]?.color,
                  border:  `1.5px solid ${enriched.marca === c.val ? '#0066CC' : 'transparent'}` }} />
            ))}
            {cand.marca.length === 0 && <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontraron sugerencias</Typography>}
          </Box>
        </Box>
      );

      case 'original': return (
        <Box>
          <TextField fullWidth size="small" value={enriched.original || ''}
            onChange={e => set('original', e.target.value)} placeholder="Código original OEM..." sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
            {cand.original.map((c, i) => (
              <Chip key={i} label={c.val} size="small" onClick={() => set('original', c.val)}
                sx={{ fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, height: 24,
                  bgcolor: enriched.original === c.val ? '#E8EAF6' : SRC_STYLE[c.src]?.bg,
                  color:   enriched.original === c.val ? '#283593' : SRC_STYLE[c.src]?.color,
                  border:  `1.5px solid ${enriched.original === c.val ? '#283593' : 'transparent'}` }} />
            ))}
            {cand.original.length === 0 && <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontraron códigos OEM</Typography>}
          </Box>
        </Box>
      );

      case 'atributos': return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Atributos técnicos */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Atributos técnicos</Typography>
              {cand.atributos.length > 0 && (
                <Button size="small" variant="text"
                  onClick={() => set('atributos', [...(enriched.atributos || []).filter(x => x.nombre === 'Motor'), ...cand.atributos])}
                  sx={{ textTransform: 'none', fontSize: '0.68rem', color: '#3949AB', py: 0.2, px: 0.8, minWidth: 0 }}>
                  Seleccionar todos ({cand.atributos.length})
                </Button>
              )}
            </Box>
            {cand.atributos.length === 0
              ? <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontraron atributos en Promotive</Typography>
              : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {cand.atributos.map((a, i) => {
                    const added = (enriched.atributos || []).some(x => norm(x.nombre + x.valor) === norm(a.nombre + a.valor));
                    return (
                      <Chip key={i} label={`${a.nombre}: ${a.valor}`} size="small"
                        onClick={() => !added && set('atributos', [...(enriched.atributos || []), a])}
                        onDelete={added ? () => set('atributos', enriched.atributos.filter(x => norm(x.nombre + x.valor) !== norm(a.nombre + a.valor))) : undefined}
                        sx={{ fontSize: '0.72rem', cursor: added ? 'default' : 'pointer', fontWeight: 600,
                          bgcolor: added ? '#E8EAF6' : '#f5f5f5', color: added ? '#283593' : '#555',
                          border: `1px solid ${added ? '#3949AB' : '#e0e0e0'}` }} />
                    );
                  })}
                </Box>
              )}
          </Box>

          {/* Códigos de motor */}
          {cand.engine_codes.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Códigos de Motor</Typography>
                <Button size="small" variant="text"
                  onClick={() => {
                    const motorAttrs = cand.engine_codes.map(c => ({ nombre: 'Motor', valor: c }));
                    const noMotor = (enriched.atributos || []).filter(x => x.nombre !== 'Motor');
                    set('atributos', [...noMotor, ...motorAttrs]);
                  }}
                  sx={{ textTransform: 'none', fontSize: '0.68rem', color: '#2E7D32', py: 0.2, px: 0.8, minWidth: 0 }}>
                  Seleccionar todos ({cand.engine_codes.length})
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {cand.engine_codes.map((code, i) => {
                  const attr = { nombre: 'Motor', valor: code };
                  const added = (enriched.atributos || []).some(x => norm(x.nombre + x.valor) === norm('Motor' + code));
                  return (
                    <Chip key={i} label={`Motor: ${code}`} size="small"
                      onClick={() => !added && set('atributos', [...(enriched.atributos || []), attr])}
                      onDelete={added ? () => set('atributos', enriched.atributos.filter(x => norm(x.nombre + x.valor) !== norm('Motor' + code))) : undefined}
                      sx={{ fontSize: '0.72rem', cursor: added ? 'default' : 'pointer', fontWeight: 600,
                        bgcolor: added ? '#E8F5E9' : '#f5f5f5', color: added ? '#2E7D32' : '#555',
                        border: `1px solid ${added ? '#43A047' : '#e0e0e0'}` }} />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Códigos KIT / Componentes */}
          {cand.componentes_kit.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Códigos KIT (Componentes)</Typography>
                <Button size="small" variant="text"
                  onClick={() => set('componentes_kit', cand.componentes_kit)}
                  sx={{ textTransform: 'none', fontSize: '0.68rem', color: '#E65100', py: 0.2, px: 0.8, minWidth: 0 }}>
                  Seleccionar todos ({cand.componentes_kit.length})
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {cand.componentes_kit.map((c, i) => {
                  const added = (enriched.componentes_kit || []).some(x => norm(x.codigo) === norm(c.codigo));
                  return (
                    <Chip key={i} label={c.producto ? `${c.codigo} — ${c.producto}` : c.codigo} size="small"
                      onClick={() => !added && set('componentes_kit', [...(enriched.componentes_kit || []), c])}
                      onDelete={added ? () => set('componentes_kit', enriched.componentes_kit.filter(x => norm(x.codigo) !== norm(c.codigo))) : undefined}
                      sx={{ fontSize: '0.72rem', cursor: added ? 'default' : 'pointer', fontWeight: 600,
                        bgcolor: added ? '#FFF3E0' : '#f5f5f5', color: added ? '#E65100' : '#555',
                        border: `1px solid ${added ? '#FF6D00' : '#e0e0e0'}` }} />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Resumen seleccionados */}
          {((enriched.atributos || []).length > 0 || (enriched.componentes_kit || []).length > 0) && (
            <Box sx={{ p: 1, bgcolor: '#f8f9ff', borderRadius: 1, border: '1px solid #e8eaf6' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#757575', mb: 0.5 }}>Seleccionados:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                {(enriched.atributos || []).map((a, i) => (
                  <Chip key={`a${i}`} label={`${a.nombre}: ${a.valor}`} size="small"
                    onDelete={() => set('atributos', enriched.atributos.filter((_, j) => j !== i))}
                    sx={{ fontSize: '0.68rem', bgcolor: '#E8EAF6', color: '#283593', fontWeight: 700 }} />
                ))}
                {(enriched.componentes_kit || []).map((c, i) => (
                  <Chip key={`k${i}`} label={c.codigo} size="small"
                    onDelete={() => set('componentes_kit', enriched.componentes_kit.filter((_, j) => j !== i))}
                    sx={{ fontSize: '0.68rem', bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700 }} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      );

      case 'vehiculos': return (
        <Box>
          {cand.vehiculos.length === 0
            ? <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontraron vehículos compatibles en Promotive</Typography>
            : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#757575' }}>
                    {cand.vehiculos.length} vehículo{cand.vehiculos.length !== 1 ? 's' : ''} compatibles encontrados en Promotive — click para agregar:
                  </Typography>
                  <Button size="small" variant="outlined"
                    onClick={() => set('vehiculos', cand.vehiculos)}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', borderColor: '#43A047', color: '#2E7D32', py: 0.3, px: 1.2, '&:hover': { bgcolor: '#E8F5E9', borderColor: '#2E7D32' } }}>
                    Seleccionar todos ({cand.vehiculos.length})
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, maxHeight: 260, overflowY: 'auto' }}>
                  {cand.vehiculos.map((v, i) => {
                    const key = norm(v.marca + v.modelo + v.version);
                    const added = (enriched.vehiculos || []).some(x => norm(x.marca + x.modelo + x.version) === key);
                    return (
                      <Box key={i} onClick={() => !added && set('vehiculos', [...(enriched.vehiculos || []), v])}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.6, borderRadius: 1, cursor: added ? 'default' : 'pointer',
                          border: `1px solid ${added ? '#43A047' : '#e0e0e0'}`,
                          bgcolor: added ? '#E8F5E9' : '#fafafa',
                          '&:hover': added ? {} : { borderColor: '#0066CC', bgcolor: '#f0f4ff' } }}>
                        {added && <CheckCircle sx={{ fontSize: 14, color: '#43A047', flexShrink: 0 }} />}
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: added ? 600 : 400 }}>
                            {v.marca} {v.modelo}{v.version ? ` · ${v.version}` : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {v.engine_code && <Typography sx={{ fontSize: '0.65rem', color: '#0066CC' }}>{v.engine_code}</Typography>}
                            {(v.desde || v.hasta) && <Typography sx={{ fontSize: '0.65rem', color: '#9e9e9e' }}>{v.desde}{v.hasta && v.desde !== v.hasta ? `–${v.hasta}` : ''}</Typography>}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  {(enriched.vehiculos || []).length > 0 && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#43A047', fontWeight: 600 }}>
                      ✓ {enriched.vehiculos.length} vehículo{enriched.vehiculos.length !== 1 ? 's' : ''} seleccionado{enriched.vehiculos.length !== 1 ? 's' : ''}
                    </Typography>
                  )}
                  {(enriched.vehiculos || []).length > 0 && (
                    <Button size="small" onClick={() => set('vehiculos', [])}
                      sx={{ textTransform: 'none', fontSize: '0.68rem', color: '#f44336', py: 0.2 }}>
                      Quitar todos
                    </Button>
                  )}
                </Box>
              </Box>
            )}
        </Box>
      );

      case 'equivalencias': return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Seleccionadas */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 28 }}>
            {(enriched.equivalencias || []).length === 0
              ? <Typography sx={{ fontSize: '0.75rem', color: '#bdbdbd' }}>Sin equivalencias — agregá desde las sugerencias de abajo</Typography>
              : enriched.equivalencias.map((e, i) => (
                <Chip key={i} label={e.codigo || e} size="small"
                  onDelete={() => set('equivalencias', enriched.equivalencias.filter((_, j) => j !== i))}
                  sx={{ bgcolor: '#FFF8E1', color: '#E65100', fontWeight: 700, fontSize: '0.72rem' }} />
              ))}
          </Box>
          {cand.equivalencias.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.7 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#757575' }}>Códigos encontrados — click para agregar:</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="text"
                    onClick={() => set('equivalencias', cand.equivalencias.map(c => ({ codigo: c.val })))}
                    sx={{ textTransform: 'none', fontSize: '0.68rem', color: '#E65100', py: 0.2, px: 0.8, minWidth: 0 }}>
                    Seleccionar todos ({cand.equivalencias.length})
                  </Button>
                  {(enriched.equivalencias || []).length > 0 && (
                    <Button size="small" variant="text"
                      onClick={() => set('equivalencias', [])}
                      sx={{ textTransform: 'none', fontSize: '0.68rem', color: '#f44336', py: 0.2, px: 0.8, minWidth: 0 }}>
                      Quitar todos
                    </Button>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {cand.equivalencias.map((c, i) => {
                  const added = equivAdded(c.val);
                  return (
                    <Chip key={i}
                      label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{c.val}</span>
                        <SrcChip src={c.src} />
                      </Box>}
                      size="small"
                      onClick={() => !added && set('equivalencias', [...(enriched.equivalencias || []), { codigo: c.val }])}
                      sx={{ fontSize: '0.7rem', cursor: added ? 'default' : 'pointer', fontWeight: 600, height: 'auto', py: 0.4,
                        bgcolor: added ? '#FFF8E1' : '#f5f5f5',
                        color:   added ? '#E65100' : '#555',
                        border:  `1px solid ${added ? '#E65100' : '#e0e0e0'}`,
                        '& .MuiChip-label': { display: 'flex', alignItems: 'center' } }} />
                  );
                })}
              </Box>
            </Box>
          )}
          {cand.equivalencias.length === 0 && <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontraron equivalencias</Typography>}
        </Box>
      );

      case 'ean': return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#757575' }}>
            Código de barras EAN/GTIN — seleccioná el correcto para el kit completo.
          </Typography>
          {cand.ean.length === 0
            ? <Typography sx={{ fontSize: '0.78rem', color: '#bdbdbd' }}>No se encontró EAN en las fuentes disponibles</Typography>
            : <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {cand.ean.map((c, i) => {
                  const selected = enriched.ean === c.val;
                  return (
                    <Box key={i} onClick={() => set('ean', selected ? '' : c.val)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, borderRadius: 1, cursor: 'pointer',
                        border: `2px solid ${selected ? '#3949AB' : '#e0e0e0'}`,
                        bgcolor: selected ? '#E8EAF6' : '#fafafa',
                        '&:hover': { borderColor: '#3949AB', bgcolor: '#f0f4ff' } }}>
                      <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? '#3949AB' : '#ccc'}`,
                        bgcolor: selected ? '#3949AB' : 'transparent', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />}
                      </Box>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: selected ? '#283593' : '#333', letterSpacing: '0.08em' }}>
                        {c.val}
                      </Typography>
                      <SrcChip src={c.src} />
                    </Box>
                  );
                })}
              </Box>}
          {enriched.ean && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#4caf50', fontWeight: 600 }}>EAN seleccionado: {enriched.ean}</Typography>
              <Button size="small" onClick={() => set('ean', '')} sx={{ textTransform: 'none', fontSize: '0.68rem', color: '#f44336', py: 0, px: 0.8, minWidth: 0 }}>Quitar</Button>
            </Box>
          )}
        </Box>
      );

      case 'imagen': return (
        <Box>
          {enriched.imagen ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box component="img" src={enriched.imagen} sx={{ width: 120, height: 120, objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: 1 }} />
              <Button size="small" variant="outlined" color="error" onClick={() => set('imagen', '')}>Quitar imagen</Button>
            </Box>
          ) : cand.imagen.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {cand.imagen.map((c, i) => (
                <Box key={i} onClick={() => set('imagen', c.val)}
                  sx={{ cursor: 'pointer', border: '2px solid #e0e0e0', borderRadius: 1, p: 0.5, textAlign: 'center',
                    transition: 'border-color 0.15s', '&:hover': { borderColor: '#0066CC' } }}>
                  <Box component="img" src={c.val} sx={{ width: 90, height: 90, objectFit: 'contain', display: 'block' }}
                    onError={e => { e.target.parentElement.style.display = 'none'; }} />
                  <Box sx={{ mt: 0.4 }}><SrcChip src={c.src} /></Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#bdbdbd', py: 2 }}>
              <ImageIcon sx={{ fontSize: 28 }} />
              <Typography sx={{ fontSize: '0.85rem' }}>No se encontraron imágenes en los enriquecedores</Typography>
            </Box>
          )}
        </Box>
      );

      case 'done': return (
        <Box sx={{ py: 1 }}>
          {/* ── Ficha de producto completa ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <CheckCircle sx={{ color: '#4caf50', fontSize: 28 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Enriquecimiento completado — {completion}% de completitud</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#757575' }}>
                Los {articles.length} artículos quedarán con la misma información, respetando el proveedor de cada uno.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <ProductCard />
          </Box>

          {/* Tabla final: todos los artículos con datos enriquecidos + proveedor propio */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e4e4e7', mb: 2, overflowX: 'hidden' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  {[['',40],['Código',80],['Descripción',160],['Marca',60],['OEM',90],['Proveedor',90],['Cat.',80],['EAN',100],['Atrib.',110],['Motores',80],['Kit',80],['Vehículos',130],['Equiv.',90]].map(([h,w]) => (
                    <TableCell key={h} sx={{ bgcolor: '#1a237e', color: '#fff !important', fontWeight: 700, fontSize: '0.65rem', py: 0.8, px: 0.8, borderRight: '1px solid rgba(255,255,255,0.15)', whiteSpace: 'nowrap', width: w, overflow: 'hidden' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {articles.map((art, idx) => (
                  <TableRow key={art.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#f8f9ff' }}>
                    {/* Imagen */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.5, py: 0.5 }}>
                      {enriched.imagen
                        ? <Box component="img" src={enriched.imagen} sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />
                        : <Box sx={{ width: 40, height: 40, border: '1px dashed #e0e0e0', borderRadius: 1, bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon sx={{ fontSize: 14, color: '#ddd' }} />
                          </Box>}
                    </TableCell>
                    {/* Código */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', fontFamily: 'monospace', fontWeight: 700, color: '#1a237e', fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 0.8 }}>
                      {art.articulo}
                    </TableCell>
                    {/* Descripción enriquecida */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', overflow: 'hidden', px: 0.8 }}>
                      <Typography sx={{ fontSize: '0.62rem', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{enriched.descripcion || art.descripcion || '—'}</Typography>
                    </TableCell>
                    {/* Marca enriquecida */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.8 }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>{enriched.marca || art.marca || '—'}</Typography>
                    </TableCell>
                    {/* Original OEM enriquecido */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.8, overflow: 'hidden' }}>
                      {(enriched.original || art.original)
                        ? <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#283593', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enriched.original || art.original}</Typography>
                        : <Typography sx={{ fontSize: '0.65rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                    {/* Proveedor ORIGINAL del artículo */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.8, overflow: 'hidden' }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#E65100', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.proveedor || art.idProveedor || '—'}</Typography>
                    </TableCell>
                    {/* Categoría */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.8, overflow: 'hidden' }}>
                      {enriched.categoria
                        ? <Typography sx={{ fontSize: '0.58rem', color: '#283593', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enriched.categoria}</Typography>
                        : <Typography sx={{ fontSize: '0.6rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                    {/* EAN */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.8, overflow: 'hidden' }}>
                      {enriched.ean
                        ? <Typography sx={{ fontSize: '0.58rem', fontFamily: 'monospace', fontWeight: 700, color: '#37474f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enriched.ean}</Typography>
                        : <Typography sx={{ fontSize: '0.6rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                    {/* Atrib. Técnicos (sin motores) */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.5, overflow: 'hidden' }}>
                      {(enriched.atributos || []).filter(a => a.nombre !== 'Motor').length > 0
                        ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                            {enriched.atributos.filter(a => a.nombre !== 'Motor').map((a, i) => (
                              <Chip key={i} label={`${a.nombre}: ${a.valor}`} size="small"
                                sx={{ fontSize: '0.52rem', height: 14, bgcolor: '#E8EAF6', color: '#283593', fontWeight: 600, maxWidth: '100%' }} />
                            ))}
                          </Box>
                        : <Typography sx={{ fontSize: '0.6rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                    {/* Motores */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.5, overflow: 'hidden' }}>
                      {(enriched.atributos || []).filter(a => a.nombre === 'Motor').length > 0
                        ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                            {enriched.atributos.filter(a => a.nombre === 'Motor').map((a, i) => (
                              <Chip key={i} label={a.valor} size="small"
                                sx={{ fontSize: '0.52rem', height: 14, bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, maxWidth: '100%' }} />
                            ))}
                          </Box>
                        : <Typography sx={{ fontSize: '0.6rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                    {/* Cód. KIT */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.5, overflow: 'hidden' }}>
                      {(enriched.componentes_kit || []).length > 0
                        ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                            {enriched.componentes_kit.map((c, i) => (
                              <Chip key={i} label={c.codigo} size="small"
                                sx={{ fontSize: '0.52rem', height: 14, bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, maxWidth: '100%' }} />
                            ))}
                          </Box>
                        : <Typography sx={{ fontSize: '0.6rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                    {/* Vehículos con años */}
                    <TableCell sx={{ borderRight: '1px solid #ede7f6', px: 0.5, overflow: 'hidden' }}>
                      {(enriched.vehiculos || []).length > 0
                        ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, maxHeight: 100, overflowY: 'auto' }}>
                            {enriched.vehiculos.map((v, i) => (
                              <Typography key={i} sx={{ fontSize: '0.58rem', color: '#2E7D32', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {v.marca} {v.modelo}{v.version ? ` · ${v.version}` : ''}
                                {(v.desde || v.hasta) && <span style={{ color: '#9e9e9e', marginLeft: 3 }}>{v.desde}{v.hasta && v.desde !== v.hasta ? `–${v.hasta}` : ''}</span>}
                              </Typography>
                            ))}
                          </Box>
                        : <Typography sx={{ fontSize: '0.6rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                    {/* Equivalencias */}
                    <TableCell sx={{ px: 0.5, overflow: 'hidden' }}>
                      {(enriched.equivalencias || []).length > 0
                        ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.2 }}>
                            {enriched.equivalencias.map((e, i) => (
                              <Chip key={i} label={e.codigo || e} size="small"
                                sx={{ fontSize: '0.52rem', height: 14, bgcolor: '#FFF8E1', color: '#E65100', fontWeight: 700, maxWidth: '100%' }} />
                            ))}
                          </Box>
                        : <Typography sx={{ fontSize: '0.6rem', color: '#bdbdbd' }}>—</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onClose} sx={{ textTransform: 'none' }}>Cerrar</Button>
            <Button variant="contained" onClick={onClose}
              sx={{ textTransform: 'none', bgcolor: '#0066CC', '&:hover': { bgcolor: '#004C99' } }}>
              Guardar {articles.length} artículo{articles.length !== 1 ? 's' : ''} en Boxer
            </Button>
          </Box>
        </Box>
      );

      default: return null;
    }
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, pt: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <IconButton size="small" onClick={onClose}><ArrowBack sx={{ fontSize: 18 }} /></IconButton>
              <Typography variant="caption" sx={{ color: '#757575', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                CATÁLOGO · ENRIQUECEDOR
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, pl: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e', fontFamily: 'monospace' }}>
                {mainCode}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#757575' }}>
                {articles.length} artículo{articles.length !== 1 ? 's' : ''} seleccionados
                {allCodes.length > 1 && ` · ${allCodes.length} variantes de código`}
              </Typography>
            </Box>
          </Box>
          {/* Completitud badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: pctColor }}>{completion}%</Typography>
            <Box sx={{ width: 100 }}>
              <LinearProgress variant="determinate" value={completion}
                sx={{ height: 8, borderRadius: 4, bgcolor: '#eeeeee', '& .MuiLinearProgress-bar': { bgcolor: pctColor, borderRadius: 4, transition: 'width 0.4s' } }} />
            </Box>
            <IconButton onClick={onClose}><Close /></IconButton>
          </Box>
        </Box>

        {/* ── Step navigator ── */}
        <Box sx={{ mt: 1.5 }}>
          <StepNav />
        </Box>
      </Box>

      {/* ── Step content ── */}
      <Box sx={{ bgcolor: '#fff', px: 3, py: 2, borderBottom: '1px solid #e4e4e7', flex: '0 0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a237e', mb: 1.5 }}>
              {STEPS.find(s => s.id === stepId)?.label}
            </Typography>
            {renderStep()}
          </Box>
          {/* Nav buttons (don't show during search or done) */}
          {stepId !== 'search' && stepId !== 'done' && (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, pt: 3, flexShrink: 0, alignItems: 'center' }}>
              {/* Anterior — siempre ocupa espacio para que Siguiente no se mueva */}
              <Button size="small" variant="outlined" startIcon={<NavigateBefore />} onClick={goPrev}
                disabled={!canPrev}
                sx={{ textTransform: 'none', minWidth: 100,
                  borderColor: canPrev ? '#9e9e9e' : 'transparent',
                  color: canPrev ? '#555' : 'transparent',
                  bgcolor: 'transparent',
                  visibility: canPrev ? 'visible' : 'hidden',
                  '&.Mui-disabled': { borderColor: 'transparent', color: 'transparent' } }}>
                Anterior
              </Button>
              <Button size="small" variant="contained" endIcon={<NavigateNext />} onClick={goNext}
                disabled={!canNext}
                sx={{ textTransform: 'none', minWidth: 100,
                  bgcolor: canNext ? '#1a237e' : '#c5cae9',
                  visibility: canNext ? 'visible' : 'hidden',
                  '&:hover': { bgcolor: '#0d147a' },
                  '&.Mui-disabled': { bgcolor: 'transparent' } }}>
                Siguiente
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Live article preview ── */}
      <Box sx={{ px: 3, py: 2, flex: 1, display: stepId === 'done' ? 'none' : 'block' }}>
        {/* Toggle card / tabla */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Vista previa
            <Typography component="span" sx={{ ml: 1, fontWeight: 400, fontSize: '0.7rem', color: '#9e9e9e' }}>
              ({articles.length} art. · {allCodes.length} código{allCodes.length !== 1 ? 's' : ''})
            </Typography>
          </Typography>
          <ToggleButtonGroup value={previewMode} exclusive onChange={(_, v) => v && setPreviewMode(v)} size="small"
            sx={{ '& .MuiToggleButton-root': { py: 0.3, px: 1, fontSize: '0.68rem', textTransform: 'none', border: '1px solid #e0e0e0' },
                  '& .Mui-selected': { bgcolor: '#1a237e !important', color: '#fff !important' } }}>
            <ToggleButton value="card"><CardViewIcon sx={{ fontSize: 14, mr: 0.5 }} />Ficha</ToggleButton>
            <ToggleButton value="table"><TableViewIcon sx={{ fontSize: 14, mr: 0.5 }} />Tabla</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {previewMode === 'card' ? <ProductCard /> : <PreviewTable />}
      </Box>
    </Box>
  );
};

export default EnriquecerMasivo;
