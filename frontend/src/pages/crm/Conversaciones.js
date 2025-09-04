import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { chatApi } from '../../services/chatService';

export default function Conversaciones() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null); // conversation detail
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((c) => `${c.title}`.toLowerCase().includes(s));
  }, [list, search]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await chatApi.listConversations();
      setList(data);
      if (data?.length && !selected) {
        loadDetail(data[0].id);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    setSelected({ loading: true, id });
    try {
      const detail = await chatApi.getConversation(id);
      setSelected(detail);
    } catch (e) {
      setSelected(null);
    }
  };

  useEffect(() => { loadList(); }, []);

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Paper sx={{ width: 360, flexShrink: 0, p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>Conversaciones</Typography>
          <Tooltip title="Actualizar">
            <IconButton size="small" onClick={loadList}>
              {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ px: 1, pb: 1 }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título"
            fullWidth
            size="small"
          />
        </Box>
        <Divider />
        <List dense sx={{ maxHeight: 560, overflowY: 'auto' }}>
          {filtered.map((c) => (
            <ListItemButton key={c.id} selected={selected?.id === c.id} onClick={() => loadDetail(c.id)}>
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <ListItemText
                  primary={c.title || `Conversación #${c.id}`}
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(c.started_at).toLocaleString()}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
          {filtered.length === 0 && (
            <Box sx={{ p: 2, color: 'text.secondary' }}>
              <Typography variant="body2">No hay conversaciones.</Typography>
            </Box>
          )}
        </List>
      </Paper>

      <Paper sx={{ flex: 1, p: 2, minHeight: 640 }}>
        {!selected && (
          <Typography variant="body1" color="text.secondary">Seleccioná una conversación.</Typography>
        )}
        {selected?.loading && (
          <Typography variant="body2" color="text.secondary">Cargando...</Typography>
        )}
        {selected && !selected.loading && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>{selected.title || `Conversación #${selected.id}`}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Inicio: {new Date(selected.started_at).toLocaleString()} | Última actividad: {selected.last_activity_at ? new Date(selected.last_activity_at).toLocaleString() : '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selected.messages?.map((m) => (
                <Box key={m.id} sx={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  bgcolor: m.role === 'user' ? 'primary.light' : 'background.paper',
                  color: m.role === 'user' ? 'white' : 'text.primary',
                  p: 1.2,
                  borderRadius: 1.5,
                  maxWidth: '75%',
                  boxShadow: 1,
                  border: m.role === 'assistant' ? '1px solid #eee' : 'none'
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{m.role}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                </Box>
              ))}
              {(!selected.messages || selected.messages.length === 0) && (
                <Typography variant="body2" color="text.secondary">Sin mensajes.</Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
