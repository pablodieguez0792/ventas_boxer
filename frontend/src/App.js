import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import ChatbotContainer from './pages/ChatbotContainer';
import ChatbotSections from './pages/ChatbotSections';
import ChatbotSection from './pages/ChatbotSection';
import ChatbotModulos from './pages/ChatbotModulos';
import RuralSantaFe from './pages/conexiones/RuralSantaFe';
import PromotiveAPI from './pages/conexiones/PromotiveAPI';
import RepuestosVehiculo from './pages/conexiones/RepuestosVehiculo';
import PromotiveArticulos from './pages/conexiones/PromotiveArticulos';
import TiendaNubeAPI from './pages/conexiones/TiendaNubeAPI';
import VentasContainer from './pages/VentasContainer';
import MercadoLibreContainer from './pages/MercadoLibreContainer';
import CRMContainer from './pages/CRMContainer';
import { CartProvider } from './contexts/CartContext';

// Create Material-UI theme matching Boxer CRM aesthetic
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066CC',
      light: '#E3F2FD',
      dark: '#004C99',
    },
    secondary: {
      main: '#757575',
      light: '#F5F5F5',
    },
    success: {
      main: '#00C853',
      light: '#E8F5E9',
    },
    warning: {
      main: '#FFA726',
      light: '#FFF3E0',
    },
    error: {
      main: '#F44336',
    },
    info: {
      main: '#0066CC',
      light: '#E3F2FD',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.875rem',
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#18181b',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#27272a',
          },
        },
        outlined: {
          borderColor: '#e4e4e7',
          color: '#18181b',
          '&:hover': {
            borderColor: '#d4d4d8',
            backgroundColor: '#fafafa',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e4e4e7',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f4f4f5',
          padding: '16px',
          fontSize: '0.875rem',
        },
        head: {
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#71717a',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #e4e4e7',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e4e4e7',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d4d4d8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#18181b',
            borderWidth: '1px',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <CartProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', height: '100vh' }}>
            <Sidebar />
            <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'background.default' }}>
              <Routes>
                <Route path="/ventas/*" element={<VentasContainer />} />
                <Route path="/mercadolibre/*" element={<MercadoLibreContainer />} />
                <Route path="/crm/*" element={<CRMContainer />} />
                <Route path="/chatbot" element={<ChatbotModulos />} />
                <Route path="/chatbot/original" element={<ChatbotContainer />} />
                <Route path="/chatbot/modulos" element={<ChatbotModulos />} />
                <Route path="/chatbot/:sectionName" element={<ChatbotSection />} />
                <Route path="/conexiones-api/rural-santa-fe" element={<RuralSantaFe />} />
                <Route path="/repuestos" element={<RepuestosVehiculo />} />
                <Route path="/conexiones-api/promotive-api" element={<PromotiveAPI />} />
                <Route path="/conexiones-api/promotive-articulos" element={<PromotiveArticulos />} />
                <Route path="/conexiones-api/tiendanube" element={<TiendaNubeAPI />} />
                <Route path="/" element={<VentasContainer />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </CartProvider>
  );
}

export default App;
