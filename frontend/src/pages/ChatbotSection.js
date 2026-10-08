import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  TextField, 
  Button,
  Collapse,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Chip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const sectionConfig = {
  ventas: { display_name: 'Ventas', icon: '💰', color: '#4CAF50' },
  cuentas: { display_name: 'Cuentas', icon: '📊', color: '#2196F3' },
  compras: { display_name: 'Compras', icon: '🛒', color: '#FF9800' },
  clientes: { display_name: 'Clientes', icon: '👥', color: '#9C27B0' },
  proveedores: { display_name: 'Proveedores', icon: '🏭', color: '#607D8B' },
  articulos: { display_name: 'Artículos', icon: '📦', color: '#795548' },
  mercadolibre: { display_name: 'MercadoLibre', icon: '🛍️', color: '#FFE500' }
};

export default function ChatbotSection() {
  const { sectionName } = useParams();
  const navigate = useNavigate();
  const config = sectionConfig[sectionName] || { display_name: sectionName, icon: '🤖', color: '#666' };
  
  // Chatbot functionality (copied from original)
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef(null);

  // OpenAI section (collapsible)
  const [openAIExpanded, setOpenAIExpanded] = useState(false);
  const [openAIRequest, setOpenAIRequest] = useState('');
  const [openAIResponse, setOpenAIResponse] = useState('');
  const [conversationState, setConversationState] = useState('');
  const [logs, setLogs] = useState([]);

  // Questions management
  const [questions, setQuestions] = useState([]);
  const [questionDialog, setQuestionDialog] = useState({ open: false, question: null });
  const [newQuestion, setNewQuestion] = useState({ question: '', answer: '', observations: '' });
  const [questionsExpanded, setQuestionsExpanded] = useState(true);

  const log = (msg, data) => {
    setLogs(prev => [
      { ts: new Date().toISOString(), msg, data },
      ...prev,
    ]);
  };

  useEffect(() => {
    loadConversations();
    loadQuestions();
  }, [sectionName]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages]);

  const loadQuestions = async () => {
    try {
      const res = await fetch('/api/chatbot/sections');
      if (res.ok) {
        const data = await res.json();
        const section = data.find(s => s.name === sectionName);
        if (section) {
          setQuestions(section.questions || []);
        }
      }
    } catch (e) {
      console.error('Error loading questions:', e);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chatbot/conversations');
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
      const res = await fetch(`/api/chatbot/conversations/${convId}`);
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
      const res = await fetch(`/api/chatbot/conversations/${selectedConvId}/archive`, {
        method: 'POST'
      });
      if (res.ok) {
        log('Conversación archivada', { id: selectedConvId });
        loadConversations();
        startNewConversation();
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
    
    const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    
    const loadingMsg = { role: 'assistant', content: '🔍 Procesando tu consulta...', created_at: new Date().toISOString(), isLoading: true };
    setMessages(prev => [...prev, loadingMsg]);
    
    log('Usuario envía mensaje', { content: text });
    
    try {
      const payload = { 
        message: text,
        conversation_id: selectedConvId,
        section: sectionName
      };
      setOpenAIRequest(JSON.stringify(payload, null, 2));
      
      const res = await fetch('/api/chatbot/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        setOpenAIResponse(errText || `HTTP ${res.status}`);
        log('Error del backend /api/chatbot/conversation', { status: res.status, body: errText });
        setMessages(prev => prev.filter(m => !m.isLoading));
        const asstMsg = { role: 'assistant', content: 'Hubo un problema al consultar el servicio. Intenta nuevamente.', created_at: new Date().toISOString() };
        setMessages(prev => [...prev, asstMsg]);
        setIsLoading(false);
        return;
      }
      
      const data = await res.json();
      setOpenAIResponse(JSON.stringify(data, null, 2));
      setConversationState(data.conversation_state || '');
      
      if (!selectedConvId && data.conversation_id) {
        setSelectedConvId(data.conversation_id);
      }
      
      setMessages(prev => prev.filter(m => !m.isLoading));
      
      const reply = data?.reply || 'Sin respuesta';
      const asstMsg = { role: 'assistant', content: reply, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, asstMsg]);
      
      log('Asistente responde', { 
        reply: reply.substring(0, 50) + '...', 
        state: data.conversation_state,
        conversationId: data.conversation_id 
      });
      
      loadConversations();
      
    } catch (e) {
      setOpenAIResponse(String(e));
      log('Excepción al llamar /api/chatbot/conversation', { error: String(e) });
      setMessages(prev => prev.filter(m => !m.isLoading));
      const asstMsg = { role: 'assistant', content: 'Error de red o servidor no disponible.', created_at: new Date().toISOString() };
      setMessages(prev => [...prev, asstMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.question.trim() || !newQuestion.answer.trim()) return;
    
    try {
      const res = await fetch(`/api/chatbot/sections/${sectionName}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });
      
      if (res.ok) {
        setNewQuestion({ question: '', answer: '', observations: '' });
        setQuestionDialog({ open: false, question: null });
        loadQuestions();
      }
    } catch (e) {
      console.error('Error creating question:', e);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!questionDialog.question || !newQuestion.question.trim() || !newQuestion.answer.trim()) return;
    
    try {
      const res = await fetch(`/api/chatbot/questions/${questionDialog.question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });
      
      if (res.ok) {
        setNewQuestion({ question: '', answer: '', observations: '' });
        setQuestionDialog({ open: false, question: null });
        loadQuestions();
      }
    } catch (e) {
      console.error('Error updating question:', e);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) return;
    
    try {
      const res = await fetch(`/api/chatbot/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        loadQuestions();
      }
    } catch (e) {
      console.error('Error deleting question:', e);
    }
  };

  const openQuestionDialog = (question = null) => {
    if (question) {
      setNewQuestion({ question: question.question, answer: question.answer, observations: question.observations || '' });
    } else {
      setNewQuestion({ question: '', answer: '', observations: '' });
    }
    setQuestionDialog({ open: true, question });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/chatbot')} sx={{ color: 'primary.main' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: config.color, mb: 0 }}>
            {config.icon} CHATBOT - {config.display_name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Estado: {conversationState || 'Inicial'} • {questions.length} preguntas configuradas
          </Typography>
        </Box>
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

        {/* Centro - OpenAI (colapsible) y Preguntas */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '75vh' }}>
            {/* OpenAI Section (Collapsible) */}
            <Paper sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  bgcolor: openAIExpanded ? 'primary.main' : 'background.paper',
                  color: openAIExpanded ? 'white' : 'text.primary'
                }}
                onClick={() => setOpenAIExpanded(!openAIExpanded)}
              >
                <Typography variant="h6">OpenAI (request/response)</Typography>
                {openAIExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              <Collapse in={openAIExpanded}>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Request</Typography>
                    <TextField
                      value={openAIRequest}
                      onChange={(e) => setOpenAIRequest(e.target.value)}
                      placeholder="Aquí verás lo que se enviaría a la API"
                      multiline
                      minRows={4}
                      fullWidth
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Response</Typography>
                    <TextField
                      value={openAIResponse}
                      onChange={(e) => setOpenAIResponse(e.target.value)}
                      placeholder="Aquí verás la respuesta de la API"
                      multiline
                      minRows={4}
                      fullWidth
                      size="small"
                    />
                  </Box>
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">Logs</Typography>
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: '#fafafa' }}>
                      {logs.length === 0 && (
                        <Typography variant="body2" color="text.secondary">Sin eventos aún.</Typography>
                      )}
                      {logs.slice(0, 5).map((l, idx) => (
                        <Box key={idx} sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>{l.ts}</Typography>
                          <Typography variant="body2"><strong>{l.msg}</strong></Typography>
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                </Box>
              </Collapse>
            </Paper>

            {/* Preguntas A Responder */}
            <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    onClick={() => setQuestionsExpanded(!questionsExpanded)}
                    size="small"
                  >
                    {questionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                  <Typography variant="h6">Preguntas A Responder</Typography>
                  <Chip label={`${questions.length} preguntas`} size="small" color="primary" />
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => openQuestionDialog()}
                >
                  Agregar
                </Button>
              </Box>
              <Collapse in={questionsExpanded}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
                  {questions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No hay preguntas configuradas aún.
                      <br />
                      Haz clic en el botón "Agregar" para agregar la primera pregunta.
                    </Typography>
                  ) : (
                    questions.map((q, index) => (
                      <Card key={q.id} sx={{ mb: 2 }}>
                        <CardContent sx={{ pb: 1 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Pregunta {index + 1}:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            {q.question}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {q.answer}
                          </Typography>
                          {q.observations && (
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                              Observaciones: {q.observations}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ pt: 0 }}>
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => openQuestionDialog(q)}
                          >
                            Editar
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            Eliminar
                          </Button>
                        </CardActions>
                      </Card>
                    ))
                  )}
                </Box>
              </Collapse>
            </Paper>
          </Box>
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

      {/* Question Dialog */}
      <Dialog 
        open={questionDialog.open} 
        onClose={() => setQuestionDialog({ open: false, question: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {questionDialog.question ? 'Editar Pregunta' : 'Nueva Pregunta'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Pregunta"
            value={newQuestion.question}
            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Respuesta"
            value={newQuestion.answer}
            onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Observaciones (opcional)"
            value={newQuestion.observations}
            onChange={(e) => setNewQuestion({ ...newQuestion, observations: e.target.value })}
            fullWidth
            multiline
            rows={2}
            placeholder="Notas adicionales, contexto o instrucciones especiales..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialog({ open: false, question: null })}>
            Cancelar
          </Button>
          <Button 
            onClick={questionDialog.question ? handleUpdateQuestion : handleCreateQuestion}
            variant="contained"
            disabled={!newQuestion.question.trim() || !newQuestion.answer.trim()}
          >
            {questionDialog.question ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
