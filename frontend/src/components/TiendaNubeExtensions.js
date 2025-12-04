import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Grid,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

// ============================================
// COMPONENTE: Selector de Cuentas
// ============================================
export function AccountSelector({ onAccountChange }) {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    store_id: '',
    access_token: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/tiendanube/accounts');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
        const active = data.accounts.find(acc => acc.is_active);
        if (active) {
          setActiveAccount(active.id);
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleAddAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tiendanube/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Cuenta agregada exitosamente');
        setOpenDialog(false);
        setNewAccount({ name: '', store_id: '', access_token: '' });
        loadAccounts();
      }
    } catch (error) {
      alert('Error al agregar cuenta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (accountId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tiendanube/accounts/${accountId}/activate`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        setActiveAccount(accountId);
        alert(`✅ ${data.message}`);
        if (onAccountChange) {
          onAccountChange(data.account);
        }
        loadAccounts();
      }
    } catch (error) {
      alert('Error al activar cuenta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cuenta?')) return;
    
    try {
      const response = await fetch(`/api/tiendanube/accounts/${accountId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Cuenta eliminada');
        loadAccounts();
      }
    } catch (error) {
      alert('Error al eliminar cuenta: ' + error.message);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Cuentas de Tienda Nube</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Agregar Cuenta
        </Button>
      </Box>

      {accounts.length === 0 ? (
        <Alert severity="info">No hay cuentas guardadas. Agrega una para comenzar.</Alert>
      ) : (
        <List>
          {accounts.map((account) => (
            <ListItem
              key={account.id}
              sx={{
                border: account.is_active ? '2px solid #4caf50' : '1px solid #ddd',
                borderRadius: 1,
                mb: 1,
                bgcolor: account.is_active ? '#f1f8f4' : 'white'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {account.name}
                    {account.is_active && <Chip label="Activa" color="success" size="small" />}
                  </Box>
                }
                secondary={`Store ID: ${account.store_id}`}
              />
              <ListItemSecondaryAction>
                {!account.is_active && (
                  <Button
                    size="small"
                    onClick={() => handleActivateAccount(account.id)}
                    disabled={loading}
                  >
                    Activar
                  </Button>
                )}
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteAccount(account.id)}
                  disabled={account.is_active}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Dialog para agregar cuenta */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nueva Cuenta</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre de la Cuenta"
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            margin="normal"
            helperText="Ej: Mi Tienda Principal"
          />
          <TextField
            fullWidth
            label="Store ID"
            value={newAccount.store_id}
            onChange={(e) => setNewAccount({ ...newAccount, store_id: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Access Token"
            value={newAccount.access_token}
            onChange={(e) => setNewAccount({ ...newAccount, access_token: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleAddAccount}
            variant="contained"
            disabled={loading || !newAccount.name || !newAccount.store_id || !newAccount.access_token}
          >
            {loading ? <CircularProgress size={24} /> : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

// ============================================
// COMPONENTE: Carga Masiva de Productos
// ============================================
export function BulkProductUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/tiendanube/excel/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_productos_tiendanube.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error al descargar plantilla: ' + error.message);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/tiendanube/excel/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        alert(`✅ Carga completada: ${data.created} productos creados, ${data.failed} fallidos`);
      } else {
        alert('Error en la carga: ' + data.message);
      }
    } catch (error) {
      alert('Error al cargar productos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Carga Masiva de Productos</Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleDownloadTemplate}
            size="large"
          >
            Descargar Plantilla Excel
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="upload-excel-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="upload-excel-file" style={{ width: '100%' }}>
            <Button
              fullWidth
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              size="large"
            >
              {selectedFile ? selectedFile.name : 'Seleccionar Archivo'}
            </Button>
          </label>
        </Grid>
      </Grid>

      {selectedFile && (
        <Button
          fullWidth
          variant="contained"
          onClick={handleUpload}
          disabled={uploading}
          size="large"
        >
          {uploading ? <CircularProgress size={24} /> : 'Cargar Productos'}
        </Button>
      )}

      {results && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>Resumen:</strong> {results.created} productos creados exitosamente de {results.total} totales
          </Alert>
          
          {results.results.errors.length > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>Errores encontrados:</Typography>
              {results.results.errors.slice(0, 5).map((error, idx) => (
                <Typography key={idx} variant="caption" display="block">
                  Fila {error.row}: {error.name} - {error.error}
                </Typography>
              ))}
              {results.results.errors.length > 5 && (
                <Typography variant="caption">... y {results.results.errors.length - 5} más</Typography>
              )}
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
}

// ============================================
// COMPONENTE: Exportar/Importar Stock
// ============================================
export function BulkStockUpdate() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/tiendanube/excel/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos_tiendanube_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('✅ Productos exportados exitosamente');
    } catch (error) {
      alert('Error al exportar: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setResults(null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setUpdating(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/tiendanube/excel/update', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        alert(`✅ Actualización completada: ${data.updated} productos actualizados, ${data.failed} fallidos`);
      } else {
        alert('Error en la actualización: ' + data.message);
      }
    } catch (error) {
      alert('Error al actualizar productos: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Actualización Masiva de Stock y Precios</Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        1. Exporta los productos actuales<br/>
        2. Modifica precios, stock y dimensiones en Excel<br/>
        3. Importa el archivo modificado para actualizar
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
            size="large"
          >
            {exporting ? <CircularProgress size={24} /> : 'Exportar Productos a Excel'}
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="import-excel-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="import-excel-file" style={{ width: '100%' }}>
            <Button
              fullWidth
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              size="large"
            >
              {selectedFile ? selectedFile.name : 'Seleccionar Archivo Modificado'}
            </Button>
          </label>
        </Grid>
      </Grid>

      {selectedFile && (
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleImport}
          disabled={updating}
          size="large"
        >
          {updating ? <CircularProgress size={24} /> : 'Actualizar Productos'}
        </Button>
      )}

      {results && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>Resumen:</strong> {results.updated} productos actualizados exitosamente
          </Alert>
          
          {results.results.errors.length > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>Errores encontrados:</Typography>
              {results.results.errors.slice(0, 5).map((error, idx) => (
                <Typography key={idx} variant="caption" display="block">
                  Fila {error.row}: {error.name} - {error.error}
                </Typography>
              ))}
              {results.results.errors.length > 5 && (
                <Typography variant="caption">... y {results.results.errors.length - 5} más</Typography>
              )}
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
}
