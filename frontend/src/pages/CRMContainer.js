import React, { useState } from 'react';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper
} from '@mui/material';
import {
  Person,
  Build
} from '@mui/icons-material';
import Particulares from './crm/Particulares';
import SistemaTaller from './crm/SistemaTaller';
import Conversaciones from './crm/Conversaciones';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`crm-tabpanel-${index}`}
      aria-labelledby={`crm-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `crm-tab-${index}`,
    'aria-controls': `crm-tabpanel-${index}`,
  };
}

const CRMContainer = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🤝 CRM - Gestión de Clientes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Sistema de gestión de relaciones con clientes particulares y sistema de taller
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="CRM tabs"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<Person />} 
              label="PARTICULARES" 
              {...a11yProps(0)}
              sx={{ 
                minHeight: 72,
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            />
            <Tab 
              icon={<Build />} 
              label="SISTEMA TALLER" 
              {...a11yProps(1)}
              sx={{ 
                minHeight: 72,
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            />
            <Tab 
              label="CONVERSACIONES" 
              {...a11yProps(2)}
              sx={{ 
                minHeight: 72,
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <Particulares />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <SistemaTaller />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <Conversaciones />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default CRMContainer;
