import React, { useState } from 'react';
import {
  TextField,
  Box,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  Search,
} from '@mui/icons-material';

const ProductSearch = ({ onProductSelect }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && searchValue.trim()) {
      // The search will be handled by SearchResults component
      // This is just for quick add functionality
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Búsqueda rápida - escribe y presiona Enter para ver resultados completos"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyPress={handleKeyPress}
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        💡 Tip: Usa la búsqueda completa abajo para ver todos los resultados en cards o lista
      </Typography>
    </Box>
  );
};

export default ProductSearch;
