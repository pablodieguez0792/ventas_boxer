import React, { useState, useContext, createContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Dashboard,
  LocalShipping,
  Calculate,
  Receipt,
  Analytics,
  Settings,
  Label,
  Inventory,
} from '@mui/icons-material';
import MisPublicaciones from './mercadolibre/MisPublicaciones';
import VentasUnificadas from './mercadolibre/VentasUnificadas';
import CalculadoraPrecios from './mercadolibre/CalculadoraPrecios';
import Facturacion from './mercadolibre/Facturacion';
import Analisis from './mercadolibre/Analisis';
import Configuracion from './mercadolibre/Configuracion';
import { mockSales } from '../data/mockData';

// Context for managing sales data across MercadoLibre modules
const MercadoLibreContext = createContext();

export const useMercadoLibreContext = () => {
  const context = useContext(MercadoLibreContext);
  if (!context) {
    throw new Error('useMercadoLibreContext must be used within MercadoLibreProvider');
  }
  return context;
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-tabpanel-${index}`}
      aria-labelledby={`ml-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MercadoLibreContainer = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sales, setSales] = useState(mockSales);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const updateSaleStatus = (saleId, newStatus) => {
    setSales(prevSales => 
      prevSales.map(sale => 
        sale.id === saleId 
          ? { ...sale, logisticsStatus: newStatus }
          : sale
      )
    );
  };

  const updateMultipleSalesStatus = (saleIds, newStatus) => {
    setSales(prevSales => 
      prevSales.map(sale => 
        saleIds.includes(sale.id)
          ? { ...sale, logisticsStatus: newStatus }
          : sale
      )
    );
  };

  const contextValue = {
    sales,
    setSales,
    updateSaleStatus,
    updateMultipleSalesStatus
  };

  return (
    <MercadoLibreContext.Provider value={contextValue}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            🛒 MercadoLibre - Gestión Integral
          </Typography>
          
          <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                icon={<Inventory />} 
                label="Mis Publicaciones" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<Dashboard />} 
                label="Dashboard Ventas" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<Calculate />} 
                label="Calculadora Precios" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<Receipt />} 
                label="Facturación" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<Analytics />} 
                label="Análisis" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<Settings />} 
                label="Configuración" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            </Tabs>
          </Paper>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <MisPublicaciones />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <VentasUnificadas />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <CalculadoraPrecios />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Facturacion />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <Analisis />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <Configuracion />
        </TabPanel>
      </Container>
    </MercadoLibreContext.Provider>
  );
};

export default MercadoLibreContainer;
