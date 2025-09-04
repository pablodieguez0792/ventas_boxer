import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import SendIcon from '@mui/icons-material/Send';
import { chatApi } from '../services/chatService';

const HEADER_BG = '#1976d2';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', content, suggestions?}

  const panelRef = useRef(null);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [open, messages]);

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    setInput('');
    setLoading(true);
    const newUserMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, newUserMsg]);
    try {
      const res = await chatApi.send({ conversationId, message: text });
      const { conversationId: cid, reply, suggestions } = res;
      setConversationId(cid);
      const asst = { role: 'assistant', content: reply, suggestions: suggestions || [] };
      setMessages((prev) => [...prev, asst]);
    } catch (e) {
      const asst = { role: 'assistant', content: 'Hubo un problema enviando tu mensaje. Intentá de nuevo.' };
      setMessages((prev) => [...prev, asst]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (s) => {
    // For MVP, send label as message to elaborate
    sendMessage(s.label);
  };

  const BubbleButton = (
    <Tooltip title="Asistente CRM" placement="left">
      <IconButton
        onClick={() => setOpen((v) => !v)}
        size="large"
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1400,
          bgcolor: HEADER_BG,
          color: 'white',
          boxShadow: 6,
          '&:hover': { bgcolor: '#1565c0' }
        }}
      >
        <ChatBubbleOutlineIcon />
      </IconButton>
    </Tooltip>
  );

  if (!open) return BubbleButton;

  return (
    <>
      {BubbleButton}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 96,
          width: { xs: 340, sm: 380 },
          height: 520,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 3,
          zIndex: 1400
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: HEADER_BG, color: 'white' }}>
          <Avatar sx={{ bgcolor: 'white', color: HEADER_BG, width: 28, height: 28, mr: 1 }}>
            <ChatBubbleOutlineIcon fontSize="small" />
          </Avatar>
          <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
            Asistente CRM
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box ref={panelRef} sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: '#fafafa' }}>
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ¡Hola! Soy tu Asistente CRM. Preguntame sobre clientes, artículos, proveedores o métricas.
              </Typography>
              <Typography variant="body2">
                Ejemplos: "Top 10 más vendidos", "Deuda CUIT 20123456789", "Proveedores con mayor deuda".
              </Typography>
            </Box>
          )}

          {messages.map((m, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Box
                  sx={{
                    maxWidth: '85%',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: m.role === 'user' ? 'primary.light' : 'white',
                    color: m.role === 'user' ? 'white' : 'text.primary',
                    boxShadow: 1,
                    border: m.role === 'assistant' ? '1px solid #eee' : 'none'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                  {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {m.suggestions.map((s, i) => (
                        <Chip key={i} label={s.label} size="small" onClick={() => handleSuggestion(s)} />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
              {m.role === 'assistant' && (
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, pl: 0.5 }}>
                  <Tooltip title="Útil">
                    <IconButton size="small"><ThumbUpAltOutlinedIcon fontSize="inherit" /></IconButton>
                  </Tooltip>
                  <Tooltip title="No útil">
                    <IconButton size="small"><ThumbDownAltOutlinedIcon fontSize="inherit" /></IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Divider />
        <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading) sendMessage();
              }
            }}
            placeholder="Escribí tu consulta..."
            fullWidth
            size="small"
          />
          <Button
            variant="contained"
            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={() => !loading && sendMessage()}
          >
            Enviar
          </Button>
        </Box>
      </Paper>
    </>
  );
}
