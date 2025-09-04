import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  PointOfSale,
  AccountBalanceWallet,
  Description,
} from '@mui/icons-material';
import MainSale from './MainSale';
import Caja from './Caja';
import Presupuestos from './Presupuestos';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ventas-tabpanel-${index}`}
      aria-labelledby={`ventas-tab-${index}`}
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

const VentasContainer = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🚗 Sistema de Ventas
        </Typography>
        
        <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ minHeight: 48 }}
          >
            <Tab 
              icon={<PointOfSale />} 
              label="Venta Principal" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<AccountBalanceWallet />} 
              label="Caja" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<Description />} 
              label="Presupuestos" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Paper>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <MainSale />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <Caja />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <Presupuestos />
      </TabPanel>
    </Container>
  );
};

export default VentasContainer;
