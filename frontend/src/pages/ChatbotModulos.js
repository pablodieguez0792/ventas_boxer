import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    name: 'ventas',
    display_name: 'Ventas',
    description: 'Gestión de ventas y facturación',
    icon: '💰',
    color: '#4CAF50'
  },
  {
    name: 'cuentas',
    display_name: 'Cuentas',
    description: 'Gestión de cuentas corrientes y pagos',
    icon: '📊',
    color: '#2196F3'
  },
  {
    name: 'compras',
    display_name: 'Compras',
    description: 'Gestión de compras y proveedores',
    icon: '🛒',
    color: '#FF9800'
  },
  {
    name: 'clientes',
    display_name: 'Clientes',
    description: 'Gestión de clientes y relaciones comerciales',
    icon: '👥',
    color: '#9C27B0'
  },
  {
    name: 'proveedores',
    display_name: 'Proveedores',
    description: 'Gestión de proveedores y suministros',
    icon: '🏭',
    color: '#607D8B'
  },
  {
    name: 'articulos',
    display_name: 'Artículos',
    description: 'Gestión de inventario y productos',
    icon: '📦',
    color: '#795548'
  },
  {
    name: 'mercadolibre',
    display_name: 'MercadoLibre',
    description: 'Integración con MercadoLibre',
    icon: '🛍️',
    color: '#FFE500'
  }
];

export default function ChatbotModulos() {
  const navigate = useNavigate();
  const [sectionsData, setSectionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const response = await fetch('/api/chatbot/sections');
      if (response.ok) {
        const data = await response.json();
        setSectionsData(data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionClick = (sectionName) => {
    navigate(`/chatbot/${sectionName}`);
  };

  const getSectionQuestionCount = (sectionName) => {
    const section = sectionsData.find(s => s.name === sectionName);
    return section ? section.questions.length : 0;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>Cargando secciones...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
          📋 CHATBOT X MODULOS
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Selecciona una sección para configurar y usar el chatbot especializado
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {sections.map((section) => {
          const questionCount = getSectionQuestionCount(section.name);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={section.name}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleSectionClick(section.name)}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ mr: 2, fontSize: '2rem' }}
                    >
                      {section.icon}
                    </Typography>
                    <Box>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                        {section.display_name}
                      </Typography>
                      <Chip 
                        label={`${questionCount} preguntas`}
                        size="small"
                        sx={{ 
                          backgroundColor: section.color + '20',
                          color: section.color,
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    sx={{ 
                      color: section.color,
                      '&:hover': {
                        backgroundColor: section.color + '10'
                      }
                    }}
                  >
                    Configurar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          ℹ️ Información
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cada sección del chatbot puede ser configurada independientemente con preguntas y respuestas específicas.
          Esto permite que el equipo de producto esté alineado en las respuestas para cada área del negocio.
        </Typography>
      </Box>
    </Container>
  );
}
