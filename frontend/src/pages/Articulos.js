import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Checkbox,
  Divider, Chip, IconButton, InputAdornment, Tooltip,
} from '@mui/material';
import {
  Add, Download, Print, CloudUpload, Label,
  Edit, Bookmark, Category, GridView, ShoppingCart,
  MoreVert, ViewList, AddShoppingCart,
  FilterList, Clear, AutoAwesome,
} from '@mui/icons-material';
import NuevoArticulo from './NuevoArticulo';
import EnriquecerArticulo from './EnriquecerArticulo';

const mockArticulos = [
  {
    id: 1, codigo: 'GAS61403', original: '—', auxiliar: '—',
    descripcion: 'GASPRING VW PASSAT VARIANT PORTÓN 11/.. Nº ORIG 3AE827550D RESORTE EQUILIBRADOR NEUMÁTICOS',
    costoSinIva: '4.860,32', costoConIva: '', ventaSinIva: '', ventaConIva: '10.673,39',
    stock: -1, stockDeseado: '—', proveedor: 'FAZIO',
  },
  {
    id: 2, codigo: 'GAS61454', original: '—', auxiliar: '—',
    descripcion: 'GASPRING RENAULT CLIO MIO PORTÓN 11/14 Nº ORIG 8443237312 RESORTE EQUILIBRADOR NEUMÁTICOS',
    costoSinIva: '2.989,26', costoConIva: '', ventaSinIva: '', ventaConIva: '6.564,87',
    stock: '—', stockDeseado: '—', proveedor: 'FAZIO',
  },
  {
    id: 3, codigo: 'GAS61460', original: '—', auxiliar: '—',
    descripcion: 'GASPRING CHERY TIGGO 3ª PUERTA 06/.. Nº ORIG T11-5005010 RESORTE EQUILIBRADOR NEUMÁTICOS',
    costoSinIva: '1.300,39', costoConIva: '', ventaSinIva: '', ventaConIva: '2.855,85',
    stock: '—', stockDeseado: '—', proveedor: 'FAZIO',
  },
  {
    id: 4, codigo: 'GAS62101', original: '—', auxiliar: '—',
    descripcion: 'GASPRING CHEVROLET CORSA 3ª PUERTA 96/.. Nº ORIG 90481270-93299289 RESORTE EQUILIBRADOR NEUMÁTICOS',
    costoSinIva: '2.350,83', costoConIva: '', ventaSinIva: '', ventaConIva: '5.180,34',
    stock: '—', stockDeseado: '—', proveedor: 'FAZIO',
  },
];

const Articulos = () => {
  const [showNuevo, setShowNuevo] = useState(false);
  const [articuloEnriquecer, setArticuloEnriquecer] = useState(null);
  const [search, setSearch] = useState('');
  const [ordenar, setOrdenar] = useState('auto');
  const [mostrar, setMostrar] = useState('todos');
  const [ordenSecundario, setOrdenSecundario] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
    setSelectedRows(e.target.checked ? mockArticulos.map(a => a.id) : []);
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  if (showNuevo) return <NuevoArticulo onBack={() => setShowNuevo(false)} />;
  if (articuloEnriquecer) return <EnriquecerArticulo onBack={() => setArticuloEnriquecer(null)} initialArticulo={articuloEnriquecer} />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, py: 2 }}>
        <Typography variant="caption" sx={{ color: '#757575', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
          CATÁLOGO
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', mt: 0.5 }}>
          Artículos
        </Typography>
      </Box>

      <Box sx={{ px: 3, py: 2 }}>
        {/* Search & Filter Bar */}
        <Paper sx={{ p: 2, mb: 2, border: '1px solid #e4e4e7', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: '1 1 300px', minWidth: 200 }}>
              <Chip
                label="V4"
                size="small"
                sx={{ bgcolor: '#0066CC', color: '#fff', borderRadius: 1, mr: 1, fontWeight: 700, fontSize: '0.7rem', height: 28 }}
              />
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por código o descripción"
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}><Clear fontSize="small" /></IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { borderRadius: 1, fontSize: '0.875rem' },
                }}
              />
            </Box>

            {/* Ordenar por */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Ordenar por</InputLabel>
              <Select value={ordenar} label="Ordenar por" onChange={e => setOrdenar(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="nombre">Nombre</MenuItem>
                <MenuItem value="codigo">Código</MenuItem>
                <MenuItem value="stock">Stock</MenuItem>
              </Select>
            </FormControl>

            {/* Mostrar */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Mostrar</InputLabel>
              <Select value={mostrar} label="Mostrar" onChange={e => setMostrar(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="activos">Activos</MenuItem>
                <MenuItem value="inactivos">Inactivos</MenuItem>
              </Select>
            </FormControl>

            {/* Orden secundario */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Orden secundario</InputLabel>
              <Select value={ordenSecundario} label="Orden secundario" onChange={e => setOrdenSecundario(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                <MenuItem value=""><em>Ninguno</em></MenuItem>
                <MenuItem value="proveedor">Proveedor</MenuItem>
                <MenuItem value="rubro">Rubro</MenuItem>
              </Select>
            </FormControl>

            {/* Filtros avanzados */}
            <Button
              size="small"
              startIcon={<FilterList />}
              sx={{ color: '#0066CC', textTransform: 'none', fontWeight: 500, fontSize: '0.8rem', ml: 'auto', whiteSpace: 'nowrap' }}
            >
              FILTROS AVANZADOS
            </Button>
          </Box>
        </Paper>

        {/* Action Buttons Row 1 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<Bookmark sx={{ fontSize: 16 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            STOCK DESEADO
          </Button>
          <Button size="small" startIcon={<Download sx={{ fontSize: 16 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            DESCARGAR ARTÍCULOS
          </Button>
          <Button size="small" startIcon={<Print sx={{ fontSize: 16 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            IMPRIMIR
          </Button>
          <Button size="small" startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            CARGA MASIVA STOCK
          </Button>
          <Button size="small" startIcon={<Label sx={{ fontSize: 16 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            IMPRESIÓN ETIQUETAS
          </Button>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
              onClick={() => setArticuloEnriquecer({})}
              sx={{ fontSize: '0.8rem', color: '#2E7D32', border: '1px solid #2E7D32', bgcolor: '#fff',
                '&:hover': { bgcolor: '#E8F5E9' }, textTransform: 'none', fontWeight: 600, px: 2 }}>
              ENRIQUECER
            </Button>
            <Button size="small" startIcon={<Add sx={{ fontSize: 16 }} />}
              onClick={() => setShowNuevo(true)}
              sx={{ fontSize: '0.8rem', color: '#0066CC', border: '1px solid #0066CC', bgcolor: '#fff',
                '&:hover': { bgcolor: '#E3F2FD' }, textTransform: 'none', fontWeight: 600, px: 2 }}>
              NUEVO ARTÍCULO
            </Button>
          </Box>
        </Box>

        {/* Action Buttons Row 2 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button size="small" endIcon={<Edit sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            CAMBIAR DESCRIPCIÓN DE ARTÍCULOS ▾
          </Button>
          <Button size="small" endIcon={<Edit sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            AGREGAR CÓDIGO AUXILIAR ▾
          </Button>
          <Button size="small" endIcon={<Edit sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            CAMBIAR RUBRO ▾
          </Button>
          <Button size="small" endIcon={<Edit sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            CAMBIAR SUBRUBRO ▾
          </Button>
          <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.75rem', color: '#444', border: '1px solid #ddd', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', px: 1.5 }}>
            AGRUPAR
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} sx={{ border: '1px solid #e4e4e7', boxShadow: 'none', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#0066CC' }}>
                <TableCell padding="checkbox" sx={{ bgcolor: '#0066CC', borderBottom: 'none' }}>
                  <Checkbox
                    size="small"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' }, '&.MuiCheckbox-indeterminate': { color: '#fff' } }}
                  />
                </TableCell>
                {[
                  'Repuesto\nAgrupado', 'Imagen', 'Artículo', 'Original', 'Auxiliar',
                  'Descripción', 'Observaciones', 'P. Costo', 'P. Venta',
                  'Stock', 'Stock\ndeseado', 'Proveedor', 'Opciones',
                ].map(col => (
                  <TableCell key={col} sx={{
                    color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                    bgcolor: '#0066CC', borderBottom: 'none',
                    whiteSpace: 'pre-line', textAlign: 'center', py: 1.5,
                  }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {mockArticulos
                .filter(a => !search || a.descripcion.toLowerCase().includes(search.toLowerCase()) || a.codigo.toLowerCase().includes(search.toLowerCase()))
                .map((art, idx) => (
                  <TableRow
                    key={art.id}
                    sx={{
                      bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa',
                      '&:hover': { bgcolor: '#F0F7FF' },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedRows.includes(art.id)}
                        onChange={() => handleSelectRow(art.id)}
                      />
                    </TableCell>
                    {/* Repuesto Agrupado */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#9e9e9e' }}>—</TableCell>
                    {/* Imagen */}
                    <TableCell align="center">
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '1px solid #ccc', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: '#f5f5f5', mx: 'auto',
                      }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', position: 'relative', overflow: 'hidden' }}>
                          <Box sx={{ position: 'absolute', width: '100%', height: '1px', bgcolor: '#aaa', top: '50%', transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Artículo */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#212121', fontWeight: 500 }}>{art.codigo}</TableCell>
                    {/* Original */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#9e9e9e' }}>—</TableCell>
                    {/* Auxiliar */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#9e9e9e' }}>—</TableCell>
                    {/* Descripción */}
                    <TableCell sx={{ fontSize: '0.78rem', color: '#0066CC', maxWidth: 320 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#0066CC', lineHeight: 1.4 }}>
                        {art.descripcion}
                      </Typography>
                    </TableCell>
                    {/* Observaciones */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#9e9e9e' }}>—</TableCell>
                    {/* P. Costo */}
                    <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                      <Box>
                        <Typography variant="caption" display="block" sx={{ color: '#757575', fontSize: '0.65rem' }}>Costo</Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#757575', fontSize: '0.65rem' }}>Sin IVA:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{art.costoSinIva}</Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#757575', fontSize: '0.65rem' }}>Con IVA: ●</Typography>
                      </Box>
                    </TableCell>
                    {/* P. Venta */}
                    <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                      <Box>
                        <Typography variant="caption" display="block" sx={{ color: '#757575', fontSize: '0.65rem' }}>Venta</Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#757575', fontSize: '0.65rem' }}>Con IVA:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{art.ventaConIva}</Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#757575', fontSize: '0.65rem' }}>Sin IVA: ●</Typography>
                      </Box>
                    </TableCell>
                    {/* Stock */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: art.stock < 0 ? '#F44336' : '#212121', fontWeight: art.stock < 0 ? 700 : 400 }}>
                      {art.stock}
                    </TableCell>
                    {/* Stock Deseado */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#9e9e9e' }}>—</TableCell>
                    {/* Proveedor */}
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#212121' }}>{art.proveedor}</TableCell>
                    {/* Opciones */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Enriquecer" arrow>
                          <IconButton size="small"
                            onClick={() => setArticuloEnriquecer(art)}
                            sx={{ color: '#2E7D32', border: '1px solid #2E7D32', borderRadius: 1, p: 0.5, '&:hover': { bgcolor: '#E8F5E9' } }}>
                            <AutoAwesome sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" sx={{ color: '#757575', border: '1px solid #ddd', borderRadius: 1, p: 0.5 }}>
                          <ViewList sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#757575', border: '1px solid #ddd', borderRadius: 1, p: 0.5 }}>
                          <AddShoppingCart sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#757575', border: '1px solid #ddd', borderRadius: 1, p: 0.5 }}>
                          <MoreVert sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Articulos;
