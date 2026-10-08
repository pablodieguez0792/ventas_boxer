import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Table,
  TableBody,
  TableHead,
  TableContainer,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  DirectionsCar,
  Search,
  Close,
  ExpandLess,
  ExpandMore,
  CheckCircle,
  ErrorOutline,
  ArrowBackIos,
  ArrowForwardIos,
  ZoomIn,
  ImageNotSupported,
} from "@mui/icons-material";

/* ---------------------------------------------------------------------------
   Categorías madre (las 10 que se muestran siempre en la barra lateral).
   Cada una agrupa las "category" de SpecParts (p. ej. "SISTEMA DE MOTOR") por
   palabra clave. Las subcategorías son el "product" de SpecParts.
--------------------------------------------------------------------------- */
const PARENTS = [
  { id: "motor", label: "Motor y distribución", words: ["MOTOR", "DISTRIBUCI"] },
  { id: "refrigeracion", label: "Refrigeración", words: ["REFRIGERACI"] },
  { id: "embrague", label: "Embrague y transmisión", words: ["EMBRAGUE", "TRANSMISI", "CAJA", "DIFERENCIAL", "HOMOCIN"] },
  { id: "frenos", label: "Frenos", words: ["FRENO"] },
  { id: "suspension", label: "Suspensión", words: ["SUSPENSI", "AMORTIGU"] },
  { id: "direccion", label: "Dirección", words: ["DIRECCI"] },
  { id: "electrico", label: "Eléctrico y encendido", words: ["ELECTR", "ENCENDIDO", "ILUMIN", "ARRANQUE", "ALTERNADOR"] },
  { id: "combustible", label: "Combustible y alimentación", words: ["COMBUSTIBLE", "ALIMENTACI", "INYECC"] },
  { id: "filtros", label: "Filtros y lubricación", words: ["FILTRO", "LUBRICACI", "ACEITE"] },
  { id: "escape", label: "Escape y emisiones", words: ["ESCAPE", "EMISION"] },
];
const OTROS = { id: "otros", label: "Otros", words: [] };
// Orden de evaluación: lo específico antes que "MOTOR", que aparece en muchos nombres.
const ORDEN_MATCH = ["refrigeracion", "frenos", "suspension", "direccion", "embrague", "electrico", "combustible", "filtros", "escape", "motor"];

const sinTildes = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
const bonito = (s) => {
  const t = (s || "").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const parentDe = (categoria) => {
  const c = sinTildes(categoria);
  for (const id of ORDEN_MATCH) {
    const p = PARENTS.find((x) => x.id === id);
    if (p.words.some((w) => c.includes(w))) return p.id;
  }
  return OTROS.id;
};
const normCodigo = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const plata = (v) => (v == null || v === "" ? null : `$${Number(v).toLocaleString("es-AR")}`);

const ETIQUETAS_VEHICULO = {
  brand: "Marca",
  master_model: "Modelo",
  model: "Modelo / carrocería",
  model_range: "Rango de modelo",
  version: "Versión",
  segment: "Segmento",
  engine_code: "Código de motor",
  engine_family: "Familia de motor",
  engine_displacement_liters: "Cilindrada (L)",
  fuel_type: "Combustible",
  sold_from_year: "Vendido desde",
  sold_until_year: "Vendido hasta",
  reference_year: "Año de referencia",
  mileage: "Kilometraje",
  id: "ID de vehículo",
  code: "Código de vehículo",
};
const OCULTAR_VEHICULO = ["security_hash", "grouped_segment", "market_id", "vehicle_id_count", "vehicle_ids"];

const imagenesDe = (d) =>
  (d.pictures || [])
    .filter((p) => !p.blueprint && !p.is_blueprint)
    .map((p) => p.image_url || p.url)
    .filter(Boolean);

/* Línea de datos de Boxer (verde) ---------------------------------------- */
const BoxerInfo = ({ m, titulo }) => {
  const campos = [
    ["Artículo", m.name],
    ["Código", m.internal_code],
    ["Original", m.original_code],
    ["Auxiliar", m.supplier_code],
    ["Marca", m.brand],
    ["Proveedor", m.proveedor],
    ["Rubro", m.rubro],
    ["Subrubro", m.subrubro],
    ["Stock", m.stock],
    ["Venta", plata(m.price)],
    ["Lista", plata(m.price_list)],
    ["Costo", plata(m.price_cost)],
    ["IVA", m.iva != null ? `${m.iva}%` : null],
    ["Últ. venta", m.fecha_ultima_venta],
    ["Últ. compra", m.fecha_ultima_compra],
    ["Ubicación", m.location],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== "—");
  return (
    <Box sx={{ bgcolor: "#e8f5e9", borderLeft: "4px solid #2e7d32", borderRadius: 1, px: 1.5, py: 1, mt: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "baseline" }}>
        <Chip
          size="small"
          color="success"
          icon={<CheckCircle />}
          label={`${titulo ? titulo + " · " : ""}${m.propio ? "En Boxer (propio)" : "En Boxer (catálogo proveedor)"}`}
        />
        {campos.map(([k, v]) => (
          <Typography key={k} variant="body2">
            <b>{k}:</b> {String(v)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

/* Tarjeta de un repuesto -------------------------------------------------- */
const TarjetaRepuesto = ({ d, vehiculo, checks, onBuscar, onFoto }) => {
  const [verCruces, setVerCruces] = useState(false);
  const [verVehiculos, setVerVehiculos] = useState(false);
  const imgs = imagenesDe(d);
  const aplica = (d.vehicles || []).some(
    (v) => String(v.code) === String(vehiculo.code) || (v.model === vehiculo.model && v.version === vehiculo.version)
  );
  const cruces = d.cross || [];
  const porMarca = cruces.reduce((acc, c) => {
    (acc[c.brand] = acc[c.brand] || []).push(c);
    return acc;
  }, {});
  const codigosChequeados = [d.code, ...cruces.map((c) => c.code)].filter((c) => checks[normCodigo(c)]);
  const chkPrincipal = checks[normCodigo(d.code)];

  return (
    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
      <Box sx={{ width: 120, flexShrink: 0, alignSelf: "flex-start", position: { sm: "sticky" }, top: { sm: 80 } }}>
        {imgs.length > 0 ? (
          <Box
            onClick={() => onFoto(imgs, 0, `${d.brand} ${d.code}`)}
            sx={{ position: "relative", cursor: "zoom-in", border: "1px solid #ddd", borderRadius: 1, overflow: "hidden", width: 120, height: 120, bgcolor: "#fff" }}
          >
            <img src={imgs[0]} alt={d.code} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            <ZoomIn sx={{ position: "absolute", right: 2, bottom: 2, fontSize: 18, color: "#555", bgcolor: "rgba(255,255,255,.8)", borderRadius: 1 }} />
            {imgs.length > 1 && (
              <Chip size="small" label={`+${imgs.length - 1}`} sx={{ position: "absolute", left: 2, top: 2, height: 18, fontSize: 11 }} />
            )}
          </Box>
        ) : (
          <Box sx={{ width: 120, height: 120, border: "1px dashed #ccc", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>
            <ImageNotSupported />
          </Box>
        )}
        {imgs.length > 1 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.5, mt: 0.5 }}>
            {imgs.slice(1).map((u, i) => (
              <Box
                key={u}
                onClick={() => onFoto(imgs, i + 1, `${d.brand} ${d.code}`)}
                sx={{ cursor: "zoom-in", border: "1px solid #ddd", borderRadius: 0.5, overflow: "hidden", height: 36, bgcolor: "#fff" }}
              >
                <img src={u} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip size="small" color="primary" label={d.brand} />
          <Typography variant="h6" sx={{ fontFamily: "monospace" }}>
            {d.code}
          </Typography>
          {aplica && <Chip size="small" color="success" variant="outlined" icon={<CheckCircle />} label="Aplica a este vehículo" />}
          {d.is_kit ? <Chip size="small" label="Kit" /> : null}
          {d.oem ? <Chip size="small" label="OEM" /> : null}
          {d.discontinued ? <Chip size="small" color="warning" label="Discontinuado" /> : null}
          {d.national_industry ? <Chip size="small" label="Industria nacional" /> : null}
        </Box>
        <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
          {bonito(d.product)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {bonito(d.category)}
          {d.description && sinTildes(d.description) !== sinTildes(d.product) ? ` · ${d.description}` : ""}
          {d.observation && d.observation !== d.description ? ` · ${d.observation}` : ""}
        </Typography>

        {(d.attributes || []).length > 0 && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <b>Atributos:</b> {d.attributes.map((a) => `${a.name}: ${a.value}${a.unit ? " " + a.unit : ""}`).join(" · ")}
          </Typography>
        )}
        {(d.components || []).length > 0 && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <b>Componentes:</b> {d.components.map((c) => `${c.product} (${c.brand} ${c.code})`).join(" · ")}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
          {(d.ean || []).length > 0 && (
            <Typography variant="body2">
              <b>EAN:</b> {d.ean.join(", ")}
            </Typography>
          )}
          {["package_weight", "package_length", "package_width", "package_height"].some((k) => d[k]) && (
            <Typography variant="body2">
              <b>Embalaje:</b> peso {d.package_weight ?? "-"} · largo {d.package_length ?? "-"} · ancho {d.package_width ?? "-"} · alto {d.package_height ?? "-"}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            ID SpecParts {d.id}
          </Typography>
        </Box>
        {(d.links || []).length > 0 && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <b>Links:</b>{" "}
            {d.links.map((l, i) => (
              <a key={i} href={l.link} target="_blank" rel="noreferrer" style={{ marginRight: 10 }}>
                {l.link}
              </a>
            ))}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={chkPrincipal?.status === "loading" ? <CircularProgress size={14} color="inherit" /> : <Search />}
            disabled={chkPrincipal?.status === "loading"}
            onClick={() => onBuscar(d.code, d.brand)}
          >
            Buscar en Boxer
          </Button>
          {chkPrincipal?.status === "not_found" && <Chip size="small" icon={<ErrorOutline />} color="warning" variant="outlined" label="No está en Boxer" />}
          {chkPrincipal?.status === "error" && <Chip size="small" color="error" variant="outlined" label="Error al buscar" />}
          {cruces.length > 0 && (
            <Button size="small" onClick={() => setVerCruces((v) => !v)} endIcon={verCruces ? <ExpandLess /> : <ExpandMore />}>
              Referencias cruzadas ({cruces.length})
            </Button>
          )}
          {(d.vehicles || []).length > 0 && (
            <Button size="small" onClick={() => setVerVehiculos((v) => !v)} endIcon={verVehiculos ? <ExpandLess /> : <ExpandMore />}>
              Vehículos compatibles ({d.vehicles.length})
            </Button>
          )}
        </Box>

        {chkPrincipal?.status === "found" && chkPrincipal.matches.map((m, i) => <BoxerInfo key={`p${i}`} m={m} />)}

        <Collapse in={verCruces} unmountOnExit>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Tocá un código para buscarlo en Boxer.
            </Typography>
            {Object.entries(porMarca).map(([marca, lista]) => (
              <Box key={marca} sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                <Typography variant="body2" sx={{ minWidth: 90, fontWeight: 600 }}>
                  {marca}
                </Typography>
                {lista.map((c) => {
                  const st = checks[normCodigo(c.code)]?.status;
                  return (
                    <Chip
                      key={c.code}
                      size="small"
                      variant={st === "found" ? "filled" : "outlined"}
                      color={st === "found" ? "success" : st === "not_found" ? "warning" : c.oem ? "primary" : "default"}
                      label={c.code}
                      onClick={() => onBuscar(c.code, c.brand)}
                      sx={{ fontFamily: "monospace" }}
                    />
                  );
                })}
              </Box>
            ))}
          </Box>
        </Collapse>

        <Collapse in={verVehiculos} unmountOnExit>
          <TableContainer sx={{ mt: 1, maxHeight: 320, border: "1px solid #e0e0e0", borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {["Marca", "Modelo", "Versión", "Motor", "Cilindrada", "Combustible", "Desde", "Hasta"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...(d.vehicles || [])]
                  .sort((a, b) => (a.brand || "").localeCompare(b.brand || "") || (a.model || "").localeCompare(b.model || "", undefined, { numeric: true }) || (a.version || "").localeCompare(b.version || "", undefined, { numeric: true }))
                  .map((v, i) => {
                  const es = String(v.code) === String(vehiculo.code) || (v.model === vehiculo.model && v.version === vehiculo.version);
                  return (
                    <TableRow key={i} sx={es ? { bgcolor: "#e8f5e9", "& td": { fontWeight: 600 } } : undefined}>
                      <TableCell>{v.brand}</TableCell>
                      <TableCell>{v.model}</TableCell>
                      <TableCell>{v.version}</TableCell>
                      <TableCell>{v.engine_code || "—"}</TableCell>
                      <TableCell>{v.engine_displacement_liters || "—"}</TableCell>
                      <TableCell>{v.fuel_type || "—"}</TableCell>
                      <TableCell>{v.sold_from_year || "—"}</TableCell>
                      <TableCell>{v.sold_until_year || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>

        {codigosChequeados
          .filter((c) => normCodigo(c) !== normCodigo(d.code))
          .map((c) => {
            const chk = checks[normCodigo(c)];
            if (chk.status === "found") return chk.matches.map((m, i) => <BoxerInfo key={`${c}${i}`} m={m} titulo={c} />);
            if (chk.status === "not_found")
              return (
                <Typography key={c} variant="caption" color="warning.main" sx={{ display: "block", mt: 0.5 }}>
                  {c}: no está en Boxer
                </Typography>
              );
            return null;
          })}
      </Box>
    </Paper>
  );
};

/* Página ------------------------------------------------------------------ */
const RepuestosVehiculo = () => {
  const [valor, setValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [modalAuto, setModalAuto] = useState(false);
  const [seleccion, setSeleccion] = useState({ parent: null, sub: null });
  const [abiertos, setAbiertos] = useState({});
  const [checks, setChecks] = useState({});
  const [foto, setFoto] = useState(null); // { imgs, i, titulo }

  const buscar = async () => {
    const v = valor.trim().toUpperCase().replace(/\s+/g, "");
    if (!v) return;
    const esVin = v.length === 17;
    setCargando(true);
    setError(null);
    setData(null);
    setChecks({});
    setSeleccion({ parent: null, sub: null });
    setAbiertos({});
    try {
      const params = new URLSearchParams({ [esVin ? "vin" : "plate"]: v, include_parts: true });
      const r = await fetch(`/api/promotive/vehicle/complete?${params}`, { headers: { Accept: "application/json" } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "Error en la consulta");
      if (!j.success) throw new Error(j.message || "Vehículo no encontrado");
      setData(j.data);
      setModalAuto(true);
    } catch (e) {
      setError(e.message || "Error en la búsqueda");
    } finally {
      setCargando(false);
    }
  };

  const buscarEnBoxer = useCallback(async (code, brand) => {
    const key = normCodigo(code);
    setChecks((p) => ({ ...p, [key]: { status: "loading" } }));
    try {
      const params = new URLSearchParams({ code });
      if (brand) params.set("brand", brand);
      const r = await fetch(`/api/products/check-code?${params}`, { headers: { Accept: "application/json" } });
      const j = await r.json();
      setChecks((p) => ({ ...p, [key]: { status: j.found ? "found" : "not_found", matches: j.matches || [] } }));
    } catch (e) {
      setChecks((p) => ({ ...p, [key]: { status: "error" } }));
    }
  }, []);

  const vehiculo = data?.basic_info || {};

  // Partes con su categoría madre y subcategoría
  const partes = useMemo(() => {
    const base = data?.parts_detail?.length
      ? data.parts_detail
      : (data?.compatible_parts || []).filter((p) => !p.is_cross_reference);
    return base.map((d) => ({ ...d, _parent: parentDe(d.category), _sub: bonito(d.product || "Sin clasificar") }));
  }, [data]);

  const arbol = useMemo(() => {
    const todos = [...PARENTS, ...(partes.some((p) => p._parent === OTROS.id) ? [OTROS] : [])];
    return todos.map((p) => {
      const delPadre = partes.filter((x) => x._parent === p.id);
      const subs = {};
      delPadre.forEach((x) => (subs[x._sub] = (subs[x._sub] || 0) + 1));
      return { ...p, total: delPadre.length, subs: Object.entries(subs).sort((a, b) => a[0].localeCompare(b[0])) };
    });
  }, [partes]);

  const visibles = useMemo(
    () => partes.filter((p) => (!seleccion.parent || p._parent === seleccion.parent) && (!seleccion.sub || p._sub === seleccion.sub)),
    [partes, seleccion]
  );

  const tituloSeleccion = seleccion.parent
    ? `${arbol.find((a) => a.id === seleccion.parent)?.label}${seleccion.sub ? " › " + seleccion.sub : ""}`
    : "Todos los repuestos";

  const filasVehiculo = useMemo(() => {
    const filas = [];
    const agregar = (obj) =>
      Object.entries(obj || {}).forEach(([k, v]) => {
        if (OCULTAR_VEHICULO.includes(k) || v === null || v === undefined || v === "" || typeof v === "object") return;
        if (filas.some(([kk]) => kk === k)) return;
        filas.push([k, v]);
      });
    agregar(data?.basic_info);
    agregar(data?.technical_details);
    return filas;
  }, [data]);

  const etiqueta = (k) => ETIQUETAS_VEHICULO[k] || bonito(k.replace(/_/g, " "));
  const resumen = [vehiculo.brand, vehiculo.master_model || vehiculo.model, vehiculo.version].filter(Boolean).join(" ");

  return (
    <Box sx={{ p: 2 }}>
      {/* Barra de búsqueda siempre visible */}
      <Paper sx={{ p: 1.5, mb: 2, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", position: "sticky", top: 0, zIndex: 5 }}>
        <TextField
          size="small"
          autoFocus
          placeholder="Patente o número de chasis (VIN)"
          value={valor}
          onChange={(e) => setValor(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          sx={{ width: { xs: "100%", sm: 380 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: valor.trim().length > 0 && (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  {valor.trim().replace(/\s+/g, "").length === 17 ? "Chasis" : "Patente"}
                </Typography>
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" onClick={buscar} disabled={cargando || !valor.trim()}>
          {cargando ? <CircularProgress size={20} color="inherit" /> : "Buscar repuestos"}
        </Button>
        {data && (
          <>
            <Tooltip title="Ver datos del vehículo">
              <IconButton color="primary" onClick={() => setModalAuto(true)} sx={{ border: "1px solid", borderColor: "primary.main" }}>
                <DirectionsCar />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {resumen}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[vehiculo.engine_code, vehiculo.fuel_type, vehiculo.reference_year].filter(Boolean).join(" · ")}
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {cargando && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Identificando el vehículo y buscando repuestos…
          </Typography>
        </Box>
      )}

      {!cargando && !data && !error && (
        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
          <DirectionsCar sx={{ fontSize: 80, opacity: 0.4 }} />
          <Typography variant="h6">Ingresá una patente o un número de chasis</Typography>
          <Typography variant="body2">Vas a ver los repuestos que corresponden al vehículo, organizados por categoría.</Typography>
        </Box>
      )}

      {data && !cargando && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexDirection: { xs: "column", md: "row" } }}>
          {/* Barra lateral de categorías */}
          <Paper sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0, position: { md: "sticky" }, top: { md: 80 }, maxHeight: { md: "calc(100vh - 110px)" }, overflowY: "auto" }}>
            <List dense disablePadding>
              <ListItemButton selected={!seleccion.parent} onClick={() => setSeleccion({ parent: null, sub: null })}>
                <ListItemText primary="Todas las categorías" primaryTypographyProps={{ fontWeight: 600 }} />
                <Chip size="small" label={partes.length} color="primary" />
              </ListItemButton>
              <Divider />
              {arbol.map((p) => {
                const vacio = p.total === 0;
                const abierto = !!abiertos[p.id];
                return (
                  <React.Fragment key={p.id}>
                    <ListItemButton
                      disabled={vacio}
                      selected={seleccion.parent === p.id && !seleccion.sub}
                      onClick={() => {
                        setSeleccion({ parent: p.id, sub: null });
                        setAbiertos((a) => ({ ...a, [p.id]: !a[p.id] }));
                      }}
                    >
                      <ListItemText primary={p.label} primaryTypographyProps={{ fontWeight: vacio ? 400 : 600 }} />
                      <Chip size="small" label={p.total} color={vacio ? "default" : "primary"} variant={vacio ? "outlined" : "filled"} sx={{ mr: 0.5 }} />
                      {!vacio && (abierto ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                    </ListItemButton>
                    <Collapse in={abierto && !vacio} unmountOnExit>
                      <List dense disablePadding sx={{ bgcolor: "#f7f9fc" }}>
                        {p.subs.map(([sub, n]) => (
                          <ListItemButton
                            key={sub}
                            sx={{ pl: 4 }}
                            selected={seleccion.parent === p.id && seleccion.sub === sub}
                            onClick={() => setSeleccion({ parent: p.id, sub })}
                          >
                            <ListItemText primary={sub} />
                            <Chip size="small" variant="outlined" label={n} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>

          {/* Repuestos */}
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
              <Typography variant="h6">{tituloSeleccion}</Typography>
              <Typography variant="body2" color="text.secondary">
                {visibles.length} repuesto{visibles.length === 1 ? "" : "s"} para este vehículo
              </Typography>
            </Box>
            {visibles.length === 0 ? (
              <Alert severity="info">No hay repuestos en esta categoría para el vehículo consultado.</Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {visibles.map((d) => (
                  <TarjetaRepuesto
                    key={d.id}
                    d={d}
                    vehiculo={vehiculo}
                    checks={checks}
                    onBuscar={buscarEnBoxer}
                    onFoto={(imgs, i, titulo) => setFoto({ imgs, i, titulo })}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Datos del vehículo */}
      <Dialog open={modalAuto} onClose={() => setModalAuto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DirectionsCar color="primary" />
          <Box sx={{ flex: 1 }}>{resumen || "Vehículo"}</Box>
          <IconButton onClick={() => setModalAuto(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableBody>
              {filasVehiculo.map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell sx={{ fontWeight: 600, width: "45%" }}>{etiqueta(k)}</TableCell>
                  <TableCell>{String(v)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ textAlign: "right", mt: 2 }}>
            <Button variant="contained" onClick={() => setModalAuto(false)}>
              Ver repuestos
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Foto ampliada */}
      <Dialog open={!!foto} onClose={() => setFoto(null)} maxWidth="md" fullWidth>
        {foto && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ flex: 1 }}>
                {foto.titulo} · {foto.i + 1}/{foto.imgs.length}
              </Box>
              <IconButton onClick={() => setFoto(null)}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <IconButton disabled={foto.imgs.length < 2} onClick={() => setFoto((f) => ({ ...f, i: (f.i - 1 + f.imgs.length) % f.imgs.length }))}>
                  <ArrowBackIos />
                </IconButton>
                <img src={foto.imgs[foto.i]} alt={foto.titulo} style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain" }} />
                <IconButton disabled={foto.imgs.length < 2} onClick={() => setFoto((f) => ({ ...f, i: (f.i + 1) % f.imgs.length }))}>
                  <ArrowForwardIos />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap", mt: 2 }}>
                {foto.imgs.map((u, i) => (
                  <img
                    key={u}
                    src={u}
                    alt=""
                    onClick={() => setFoto((f) => ({ ...f, i }))}
                    style={{ width: 56, height: 56, objectFit: "contain", cursor: "pointer", border: i === foto.i ? "2px solid #1976d2" : "1px solid #ddd", borderRadius: 4 }}
                  />
                ))}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RepuestosVehiculo;
