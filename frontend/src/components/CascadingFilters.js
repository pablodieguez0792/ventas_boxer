import React, { useState, useMemo } from 'react';
import {
  Box,
  Chip,
  Typography,
  Paper,
  Button,
  Divider,
  Badge,
  Stack,
} from '@mui/material';
import {
  FilterList,
  Clear,
} from '@mui/icons-material';

// Estructura jerárquica de filtros basada en el Excel
const FILTER_HIERARCHY = {
  nivel1: {
    label: 'Estado Principal',
    options: ['A_ENVIAR', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'FINALIZADO'],
    labels: {
      'A_ENVIAR': 'A Enviar',
      'ENVIADO': 'Enviado', 
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado',
      'FINALIZADO': 'Finalizado'
    }
  },
  nivel2: {
    label: 'Tipo de Envío',
    options: ['FLEX', 'COLECTA', 'TURBO', 'ENCOMIENDA', 'A_COORDINAR', 'FULL'],
    labels: {
      'FLEX': 'Flex',
      'COLECTA': 'Colecta',
      'TURBO': 'Turbo',
      'ENCOMIENDA': 'Encomienda',
      'A_COORDINAR': 'A Coordinar',
      'FULL': 'Full'
    },
    dependencies: {
      'A_ENVIAR': ['FLEX', 'COLECTA', 'TURBO', 'ENCOMIENDA', 'A_COORDINAR', 'FULL'],
      'ENVIADO': ['FLEX', 'COLECTA', 'TURBO', 'ENCOMIENDA', 'A_COORDINAR', 'FULL'],
      'ENTREGADO': ['FLEX', 'COLECTA', 'TURBO', 'ENCOMIENDA', 'A_COORDINAR', 'FULL'],
      'CANCELADO': ['FLEX', 'COLECTA', 'TURBO', 'ENCOMIENDA', 'A_COORDINAR', 'FULL'],
      'FINALIZADO': ['FLEX', 'COLECTA', 'TURBO', 'ENCOMIENDA', 'A_COORDINAR', 'FULL']
    }
  },
  nivel3: {
    label: 'Ubicación',
    options: ['CABA', 'CORDON_1', 'CORDON_2'],
    labels: {
      'CABA': 'CABA',
      'CORDON_1': 'Cordón 1',
      'CORDON_2': 'Cordón 2'
    },
    dependencies: {
      'FLEX': ['CABA', 'CORDON_1'],
      'COLECTA': ['CABA', 'CORDON_1', 'CORDON_2'],
      'TURBO': ['CABA'],
      'ENCOMIENDA': ['CORDON_1', 'CORDON_2'],
      'A_COORDINAR': ['CABA', 'CORDON_1', 'CORDON_2'],
      'FULL': ['CABA', 'CORDON_1', 'CORDON_2']
    }
  },
  nivel4: {
    label: 'Estado Etiqueta',
    options: ['IMPRIMIR', 'IMPRESAS'],
    labels: {
      'IMPRIMIR': 'Imprimir',
      'IMPRESAS': 'Impresas'
    },
    dependencies: {
      'CABA': ['IMPRIMIR', 'IMPRESAS'],
      'CORDON_1': ['IMPRIMIR', 'IMPRESAS'],
      'CORDON_2': ['IMPRIMIR', 'IMPRESAS']
    }
  },
  nivel5: {
    label: 'Estado Control',
    options: ['CONTROLAR', 'CONTROLADAS'],
    labels: {
      'CONTROLAR': 'Controlar',
      'CONTROLADAS': 'Controladas'
    },
    dependencies: {
      'IMPRIMIR': ['CONTROLAR'],
      'IMPRESAS': ['CONTROLAR', 'CONTROLADAS']
    }
  },
  nivel6: {
    label: 'Mensajería',
    options: ['MENSAJERIA_1', 'MENSAJERIA_2'],
    labels: {
      'MENSAJERIA_1': 'Mensajería 1',
      'MENSAJERIA_2': 'Mensajería 2'
    },
    dependencies: {
      'CONTROLAR': ['MENSAJERIA_1', 'MENSAJERIA_2'],
      'CONTROLADAS': ['MENSAJERIA_1', 'MENSAJERIA_2']
    }
  },
  nivel7: {
    label: 'Control Final',
    options: ['CONTROLAR_FINAL', 'CONTROLADAS_FINAL'],
    labels: {
      'CONTROLAR_FINAL': 'Controlar Final',
      'CONTROLADAS_FINAL': 'Controladas Final'
    },
    dependencies: {
      'MENSAJERIA_1': ['CONTROLAR_FINAL', 'CONTROLADAS_FINAL'],
      'MENSAJERIA_2': ['CONTROLAR_FINAL', 'CONTROLADAS_FINAL']
    }
  },
  nivel8: {
    label: 'Estado Final',
    options: ['LISTO_ENVIO', 'EN_TRANSITO', 'ENTREGADO_FINAL'],
    labels: {
      'LISTO_ENVIO': 'Listo para Envío',
      'EN_TRANSITO': 'En Tránsito',
      'ENTREGADO_FINAL': 'Entregado Final'
    },
    dependencies: {
      'CONTROLAR_FINAL': ['LISTO_ENVIO'],
      'CONTROLADAS_FINAL': ['LISTO_ENVIO', 'EN_TRANSITO', 'ENTREGADO_FINAL']
    }
  }
};

const CascadingFilters = ({ onFiltersChange, initialFilters = {}, salesData = [] }) => {
  const [filters, setFilters] = useState({
    nivel1: [],
    nivel2: [],
    nivel3: [],
    nivel4: [],
    nivel5: [],
    nivel6: [],
    nivel7: [],
    nivel8: [],
    ...initialFilters
  });

  // Map sales data to filter values for counting
  const mapSaleToFilterValue = (sale, level) => {
    switch (level) {
      case 'nivel1':
        const saleStateMap = {
          'para_preparar': 'A_ENVIAR',
          'etiqueta_impresa': 'A_ENVIAR',
          'controlada': 'A_ENVIAR',
          'lista_para_enviar': 'A_ENVIAR',
          'facturada': 'ENVIADO',
          'en_camino': 'ENVIADO',
          'entregada': 'ENTREGADO'
        };
        return saleStateMap[sale.logisticsStatus] || 'A_ENVIAR';
      case 'nivel2':
        const shippingTypeMap = {
          'Flex': 'FLEX',
          'Colecta': 'COLECTA',
          'Turbo': 'TURBO',
          'Full': 'FULL',
          'A convenir': 'A_COORDINAR'
        };
        return shippingTypeMap[sale.shippingType] || 'FLEX';
      default:
        // For levels 3-8, we'll simulate data based on sale ID for demo
        const saleId = sale.id;
        if (level === 'nivel3') {
          return saleId % 3 === 0 ? 'CABA' : saleId % 3 === 1 ? 'CORDON_1' : 'CORDON_2';
        }
        if (level === 'nivel4') {
          return saleId % 2 === 0 ? 'IMPRIMIR' : 'IMPRESAS';
        }
        if (level === 'nivel5') {
          return saleId % 2 === 0 ? 'CONTROLAR' : 'CONTROLADAS';
        }
        if (level === 'nivel6') {
          return saleId % 2 === 0 ? 'MENSAJERIA_1' : 'MENSAJERIA_2';
        }
        if (level === 'nivel7') {
          return saleId % 2 === 0 ? 'CONTROLAR_FINAL' : 'CONTROLADAS_FINAL';
        }
        if (level === 'nivel8') {
          return saleId % 3 === 0 ? 'LISTO_ENVIO' : saleId % 3 === 1 ? 'EN_TRANSITO' : 'ENTREGADO_FINAL';
        }
        return null;
    }
  };

  // Get available options for a level based on previous selections
  const getAvailableOptions = (level) => {
    const levelConfig = FILTER_HIERARCHY[level];
    if (!levelConfig) return [];

    // For nivel1, always show all options
    if (level === 'nivel1') {
      return levelConfig.options;
    }

    // For other levels, filter based on previous level selections
    const prevLevel = `nivel${parseInt(level.slice(-1)) - 1}`;
    const prevSelections = filters[prevLevel];

    if (prevSelections.length === 0) {
      return []; // No options if previous level not selected
    }

    // Get all available options based on dependencies
    const availableOptions = new Set();
    prevSelections.forEach(selection => {
      const dependencies = levelConfig.dependencies?.[selection] || [];
      dependencies.forEach(dep => availableOptions.add(dep));
    });

    return Array.from(availableOptions);
  };

  // Handle filter toggle for a specific option
  const handleFilterToggle = (level, option) => {
    const newFilters = { ...filters };
    const currentSelections = newFilters[level];
    
    if (currentSelections.includes(option)) {
      // Remove option
      newFilters[level] = currentSelections.filter(item => item !== option);
    } else {
      // Add option
      newFilters[level] = [...currentSelections, option];
    }

    // Clear all subsequent levels when a parent level changes
    const currentLevelNum = parseInt(level.slice(-1));
    for (let i = currentLevelNum + 1; i <= 8; i++) {
      newFilters[`nivel${i}`] = [];
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      nivel1: [],
      nivel2: [],
      nivel3: [],
      nivel4: [],
      nivel5: [],
      nivel6: [],
      nivel7: [],
      nivel8: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Calculate counts for each filter option
  const getFilterCounts = useMemo(() => {
    const counts = {};
    
    Object.keys(FILTER_HIERARCHY).forEach(level => {
      counts[level] = {};
      const levelConfig = FILTER_HIERARCHY[level];
      
      levelConfig.options.forEach(option => {
        // Filter sales based on current selections up to this level
        let filteredSales = salesData;
        
        // Apply filters from previous levels
        const currentLevelNum = parseInt(level.slice(-1));
        for (let i = 1; i < currentLevelNum; i++) {
          const prevLevel = `nivel${i}`;
          const prevSelections = filters[prevLevel];
          if (prevSelections.length > 0) {
            filteredSales = filteredSales.filter(sale => {
              const saleValue = mapSaleToFilterValue(sale, prevLevel);
              return prevSelections.includes(saleValue);
            });
          }
        }
        
        // Count sales that match this option
        const matchingSales = filteredSales.filter(sale => {
          const saleValue = mapSaleToFilterValue(sale, level);
          return saleValue === option;
        });
        
        counts[level][option] = matchingSales.length;
      });
    });
    
    return counts;
  }, [salesData, filters]);

  // Get total active filters count
  const getActiveFiltersCount = () => {
    return Object.values(filters).reduce((total, levelFilters) => total + levelFilters.length, 0);
  };

  // Render chips for active filters
  const renderActiveFilters = () => {
    const activeFilters = [];
    Object.entries(filters).forEach(([level, values]) => {
      if (values.length > 0) {
        const levelConfig = FILTER_HIERARCHY[level];
        values.forEach(value => {
          activeFilters.push({
            level,
            value,
            label: `${levelConfig.label}: ${levelConfig.labels[value] || value}`
          });
        });
      }
    });

    return activeFilters;
  };

  const removeFilter = (level, value) => {
    const newValues = filters[level].filter(v => v !== value);
    handleFilterToggle(level, value);
  };

  return (
    <Box>
      {/* Clear Button - Compact */}
      {getActiveFiltersCount() > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            variant="text"
            startIcon={<Clear />}
            onClick={clearAllFilters}
            size="small"
            color="error"
            sx={{ fontSize: '0.75rem' }}
          >
            Limpiar
          </Button>
        </Box>
      )}


      {/* Filter Tags by Level */}
      {Object.entries(FILTER_HIERARCHY).map(([level, config]) => {
        const availableOptions = getAvailableOptions(level);
        const isDisabled = level !== 'nivel1' && availableOptions.length === 0;
        
        if (isDisabled && availableOptions.length === 0) {
          return null; // Don't show disabled levels
        }

        return (
          <Box key={level} sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 'medium', fontSize: '0.7rem', textTransform: 'uppercase' }}>
              {config.label}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {availableOptions.map((option) => {
                const isSelected = filters[level].includes(option);
                const count = getFilterCounts[level]?.[option] || 0;
                
                return (
                  <Chip
                    key={option}
                    label={`${config.labels[option] || option} (${count})`}
                    onClick={() => handleFilterToggle(level, option)}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      height: '32px',
                      fontSize: '0.75rem',
                      '& .MuiChip-label': {
                        paddingRight: '8px',
                        paddingLeft: '8px'
                      },
                      '&:hover': {
                        backgroundColor: isSelected ? 'primary.dark' : 'grey.100'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        );
      })}

      {/* Helper Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        💡 Los filtros funcionan en cascada: selecciona un nivel para habilitar el siguiente
      </Typography>
    </Box>
  );
};

export default CascadingFilters;
