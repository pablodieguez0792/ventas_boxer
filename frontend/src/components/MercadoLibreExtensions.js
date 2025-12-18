import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export function MLAccountSelector({ onAccountChange }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    user_id: '',
    access_token: '',
    refresh_token: ''
  });
  const [editingAccount, setEditingAccount] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/mercadolibre/accounts');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
        const active = data.accounts.find(acc => acc.is_active);
        if (onAccountChange && active) {
          onAccountChange(active);
        }
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.user_id || !newAccount.access_token) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/mercadolibre/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Cuenta agregada exitosamente');
        setOpenDialog(false);
        setNewAccount({ name: '', user_id: '', access_token: '', refresh_token: '' });
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
      const response = await fetch(`/api/mercadolibre/accounts/${accountId}/activate`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Cuenta activada');
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
      const response = await fetch(`/api/mercadolibre/accounts/${accountId}`, {
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

  const handleEditName = (account) => {
    setEditingAccount(account.id);
    setEditName(account.name);
  };

  const handleSaveName = async (accountId) => {
    try {
      const response = await fetch(`/api/mercadolibre/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });
      const data = await response.json();
      if (data.success) {
        setEditingAccount(null);
        loadAccounts();
      }
    } catch (error) {
      alert('Error al actualizar nombre: ' + error.message);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Cuentas de MercadoLibre</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Agregar Cuenta
        </Button>
      </Box>

      {accounts.length === 0 ? (
        <Alert severity="info">
          No hay cuentas guardadas. Agrega una cuenta para comenzar.
        </Alert>
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
                    {editingAccount === account.id ? (
                      <TextField
                        size="small"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleSaveName(account.id)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveName(account.id);
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => handleEditName(account)}
                        style={{ cursor: 'pointer' }}
                        title="Click para editar"
                      >
                        {account.name}
                      </span>
                    )}
                    {account.is_active && <Chip label="Activa" color="success" size="small" />}
                  </Box>
                }
                secondary={`User ID: ${account.user_id}`}
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
        <DialogTitle>Agregar Cuenta de MercadoLibre</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre de la Cuenta *"
              fullWidth
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              placeholder="Ej: Cliente Juan Pérez"
            />
            <TextField
              label="User ID *"
              fullWidth
              value={newAccount.user_id}
              onChange={(e) => setNewAccount({ ...newAccount, user_id: e.target.value })}
              placeholder="Ej: 403794231"
            />
            <TextField
              label="Access Token *"
              fullWidth
              multiline
              rows={3}
              value={newAccount.access_token}
              onChange={(e) => setNewAccount({ ...newAccount, access_token: e.target.value })}
              placeholder="APP_USR-..."
            />
            <TextField
              label="Refresh Token (opcional)"
              fullWidth
              multiline
              rows={2}
              value={newAccount.refresh_token}
              onChange={(e) => setNewAccount({ ...newAccount, refresh_token: e.target.value })}
              placeholder="TG-..."
            />
            <Alert severity="info">
              <Typography variant="body2">
                <strong>¿Cómo obtener los tokens?</strong><br />
                1. El cliente debe autorizar la app en MercadoLibre<br />
                2. Recibirás el access_token y refresh_token<br />
                3. El User ID lo encuentras en la respuesta de autorización
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleAddAccount}
            variant="contained"
            disabled={loading}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
