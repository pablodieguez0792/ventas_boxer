import React, { useState, useRef, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, Divider, List, ListItem, ListItemText, TextField, Button } from '@mui/material';

export default function ChatbotContainer() {
  // Left pane: conversations (loaded from backend)
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);

  // Right pane: conversation UI (uses structured conversation endpoint)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef(null);

  // Middle pane: OpenAI request/response and conversation state
  const [openAIRequest, setOpenAIRequest] = useState('');
  const [openAIResponse, setOpenAIResponse] = useState('');
  const [conversationState, setConversationState] = useState('');

  // Logs pane: detailed logs of actions
  const [logs, setLogs] = useState([]);
  const log = (msg, data) => {
    setLogs(prev => [
      { ts: new Date().toISOString(), msg, data },
      ...prev,
    ]);
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/chatbot/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        log('Conversaciones cargadas', { count: data.length });
      }
    } catch (e) {
      log('Error cargando conversaciones', { error: String(e) });
    }
  };

  const loadConversation = async (convId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/chatbot/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data);
        setMessages(data.messages || []);
        setSelectedConvId(convId);
        log('Conversación cargada', { id: convId, messageCount: data.messages?.length || 0 });
      }
    } catch (e) {
      log('Error cargando conversación', { error: String(e) });
    }
  };

  const startNewConversation = () => {
    setSelectedConvId(null);
    setCurrentConversation(null);
    setMessages([]);
    setConversationState('');
    setOpenAIRequest('');
    setOpenAIResponse('');
    log('Nueva conversación iniciada', {});
  };

  const archiveConversation = async () => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/chatbot/conversations/${selectedConvId}/archive`, {
        method: 'POST'
      });
      if (res.ok) {
        log('Conversación archivada', { id: selectedConvId });
        loadConversations(); // Reload list
        startNewConversation(); // Start fresh
      }
    } catch (e) {
      log('Error archivando conversación', { error: String(e) });
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setIsLoading(true);
    
    // Add user message to UI immediately
    const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    
    // Add loading message
    const loadingMsg = { role: 'assistant', content: '🔍 Procesando tu consulta...', created_at: new Date().toISOString(), isLoading: true };
    setMessages(prev => [...prev, loadingMsg]);
    
    log('Usuario envía mensaje', { content: text });
    
    try {
      const payload = { 
        message: text,
        conversation_id: selectedConvId 
      };
      setOpenAIRequest(JSON.stringify(payload, null, 2));
      
      const res = await fetch('http://localhost:8000/api/chatbot/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        setOpenAIResponse(errText || `HTTP ${res.status}`);
        log('Error del backend /api/chatbot/conversation', { status: res.status, body: errText });
        // Remove loading message and add error message
        setMessages(prev => prev.filter(m => !m.isLoading));
        const asstMsg = { role: 'assistant', content: 'Hubo un problema al consultar el servicio. Intenta nuevamente.', created_at: new Date().toISOString() };
        setMessages(prev => [...prev, asstMsg]);
        setIsLoading(false);
        return;
      }
      
      const data = await res.json();
      setOpenAIResponse(JSON.stringify(data, null, 2));
      setConversationState(data.conversation_state || '');
      
      // Update conversation ID if this was a new conversation
      if (!selectedConvId && data.conversation_id) {
        setSelectedConvId(data.conversation_id);
      }
      
      // Remove loading message and add real response
      setMessages(prev => prev.filter(m => !m.isLoading));
      
      const reply = data?.reply || 'Sin respuesta';
      const asstMsg = { role: 'assistant', content: reply, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, asstMsg]);
      
      log('Asistente responde', { 
        reply: reply.substring(0, 50) + '...', 
        state: data.conversation_state,
        conversationId: data.conversation_id 
      });
      
      // Reload conversations list to show updated titles
      loadConversations();
      
    } catch (e) {
      setOpenAIResponse(String(e));
      log('Excepción al llamar /api/chatbot/conversation', { error: String(e) });
      // Remove loading message and add error message
      setMessages(prev => prev.filter(m => !m.isLoading));
      const asstMsg = { role: 'assistant', content: 'Error de red o servidor no disponible.', created_at: new Date().toISOString() };
      setMessages(prev => [...prev, asstMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🤖 CHATBOT
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Flujo estructurado: identificación de cliente, CUIT, conversaciones persistentes. Estado: {conversationState || 'Inicial'}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Conversaciones (izquierda) */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Conversaciones</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" onClick={startNewConversation}>Nueva</Button>
                {selectedConvId && (
                  <Button variant="outlined" size="small" onClick={archiveConversation}>Archivar</Button>
                )}
              </Box>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List dense sx={{ overflowY: 'auto' }}>
              {conversations.map(c => (
                <ListItem
                  key={c.id}
                  button
                  selected={selectedConvId === c.id}
                  onClick={() => loadConversation(c.id)}
                >
                  <ListItemText 
                    primary={c.title} 
                    secondary={
                      <React.Fragment>
                        <Typography variant="caption" component="div">
                          {c.message_count} mensajes • {new Date(c.last_activity_at).toLocaleString()}
                        </Typography>
                        {c.client_cuit && (
                          <Typography variant="caption" component="div" sx={{ color: 'primary.main' }}>
                            CUIT: {c.client_cuit}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* OpenAI (centro) */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">OpenAI (request/response)</Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">Request</Typography>
              <TextField
                value={openAIRequest}
                onChange={(e) => setOpenAIRequest(e.target.value)}
                placeholder="Aquí verás lo que se enviaría a la API"
                multiline
                minRows={6}
                fullWidth
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Response</Typography>
              <TextField
                value={openAIResponse}
                onChange={(e) => setOpenAIResponse(e.target.value)}
                placeholder="Aquí verás la respuesta de la API"
                multiline
                minRows={6}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Logs (detalle de acciones de código)</Typography>
              <Paper variant="outlined" sx={{ p: 1, height: '100%', overflowY: 'auto', bgcolor: '#fafafa' }}>
                {logs.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Sin eventos aún.</Typography>
                )}
                {logs.map((l, idx) => (
                  <Box key={idx} sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>{l.ts}</Typography>
                    <Typography variant="body2"><strong>{l.msg}</strong></Typography>
                    {l.data && (
                      <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(l.data, null, 2)}
                      </Typography>
                    )}
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Paper>
            </Box>
          </Paper>
        </Grid>

        {/* Conversación (derecha) */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6">Conversación</Typography>
            <Divider sx={{ mb: 1 }} />
            <Box ref={panelRef} sx={{ flex: 1, overflowY: 'auto', bgcolor: '#fafafa', p: 1, borderRadius: 1 }}>
              {messages.map((m, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                  <Box sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: m.role === 'user' ? 'primary.main' : 'white',
                    color: m.role === 'user' ? 'white' : 'text.primary',
                    boxShadow: 1,
                    border: m.role !== 'user' ? '1px solid #eee' : 'none'
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Escribe tu mensaje..."
                fullWidth
                size="small"
                disabled={isLoading}
              />
              <Button 
                variant="contained" 
                onClick={sendMessage}
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
