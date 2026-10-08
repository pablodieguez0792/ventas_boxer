import axios from 'axios';

// API base URL
// - Dev/Tunnel: empty string → CRA proxy forwards to localhost:8000
// - Vercel prod: REACT_APP_API_URL env var → backend via tunnel
const API_BASE = process.env.REACT_APP_API_URL || '';
const API_BASE_URLS = [
  API_BASE,
  'http://localhost:8000'    // direct fallback for local dev
];

// Create axios instance with retry logic
const createApiClient = () => {
  const client = axios.create({
    timeout: 10000, // 10 second timeout
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add request interceptor for retry logic
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If request failed and we haven't retried yet
      if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Try alternative base URL
        for (const baseUrl of API_BASE_URLS) {
          if (!originalRequest.url.startsWith(baseUrl)) {
            try {
              const newUrl = originalRequest.url.replace(/^https?:\/\/[^\/]+/, baseUrl);
              const retryResponse = await axios({
                ...originalRequest,
                url: newUrl
              });
              return retryResponse;
            } catch (retryError) {
              console.warn(`Retry failed for ${baseUrl}:`, retryError.message);
            }
          }
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create the API client
const api = createApiClient();

// API methods with error handling
const apiService = {
  // ── Boxer Demo API (proxy via backend) ──────────────────────────────
  // Proveedores desde demo.boxergestion.com
  getBoxerProveedores: async (q = '', page = 1) => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/boxer-demo/proveedores`, {
        params: { q, page },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Boxer proveedores:', error);
      throw error;
    }
  },

  // ── Promotive / SpecParts ─────────────────────────────────────────
  getPromotiveStatus: async () => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/promotive/status`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      return { connected: false, token_valid: false };
    }
  },

  connectPromotive: async () => {
    try {
      const response = await api.post(`${API_BASE_URLS[0]}/api/promotive/login`, {
        client_id: "",
        client_secret: "",
      }, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error('Error connecting Promotive:', error);
      throw error;
    }
  },

  searchPromotiveParts: async (search, page = 1, limit = 20) => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/promotive/search/parts`, {
        params: { search: search.trim(), page, limit },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching Promotive parts:', error);
      throw error;
    }
  },
  // ── Autopartes AR (147.79.81.127:3080) ───────────────────────────────
  getAutpartesARStatus: async () => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/autopartes-ar/status`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      return { connected: false, token_valid: false };
    }
  },

  loginAutpartesAR: async (username, password) => {
    const response = await api.post(`${API_BASE_URLS[0]}/api/autopartes-ar/login`, { username, password }, { timeout: 20000 });
    return response.data;
  },

  searchAutpartesAR: async (q, limit = 20, offset = 0) => {
    const response = await api.get(`${API_BASE_URLS[0]}/api/autopartes-ar/search`, {
      params: { q: q.trim(), limit, offset },
      timeout: 45000,
    });
    return response.data;
  },

  getAutpartesARDetail: async (id) => {
    const response = await api.get(`${API_BASE_URLS[0]}/api/autopartes-ar/detail/${id}`, {
      timeout: 45000,
    });
    return response.data;
  },
  // ─────────────────────────────────────────────────────────────────────

  // Artículos desde demo.boxergestion.com
  getBoxerArticulos: async (q = '', page = 1, proveedorId = '', stock = 0) => {
    if (!q || q.trim().length < 2) return { articulos: [], total: 0, num_pages: 1, page: 1 };
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/boxer-demo/articulos`, {
        params: { q: q.trim(), page, proveedor_id: proveedorId, stock },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Boxer articulos:', error);
      throw error;
    }
  },
  // ─────────────────────────────────────────────────────────────────────

  // Get all products (with optional search and pagination)
  getAllProducts: async (q = null, limit = 100, offset = 0) => {
    try {
      const params = { limit, offset };
      if (q) params.q = q;
      const response = await api.get(`${API_BASE_URLS[0]}/api/products`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Product search
  searchProducts: async (query, limit = 10) => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/products/search`, {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get product details
  getProduct: async (productId) => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  },

  // Customer search
  searchCustomers: async (query) => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/customers/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },

  // Get pending sales
  getPendingSales: async () => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/sales/pending`);
      return response.data;
    } catch (error) {
      console.error('Error loading pending sales:', error);
      throw error;
    }
  },

  // Get quotes
  getQuotes: async () => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/api/quotes`);
      return response.data;
    } catch (error) {
      console.error('Error loading quotes:', error);
      throw error;
    }
  },

  // Create customer
  createCustomer: async (customerData) => {
    try {
      const response = await api.post(`${API_BASE_URLS[0]}/api/customers`, customerData);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Send sale to caja
  sendToCaja: async (saleData) => {
    try {
      const response = await api.post(`${API_BASE_URLS[0]}/api/sales/send-to-caja`, saleData);
      return response.data;
    } catch (error) {
      console.error('Error sending to caja:', error);
      throw error;
    }
  },

  // Create quote
  createQuote: async (quoteData) => {
    try {
      const response = await api.post(`${API_BASE_URLS[0]}/api/quotes`, quoteData);
      return response.data;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  },

  // Invoice sale
  invoiceSale: async (saleId, paymentData) => {
    try {
      const response = await api.post(`${API_BASE_URLS[0]}/api/sales/${saleId}/invoice`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error invoicing sale:', error);
      throw error;
    }
  },

  // Delete quote
  deleteQuote: async (quoteId) => {
    try {
      const response = await api.delete(`${API_BASE_URLS[0]}/api/quotes/${quoteId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  },

  // Convert quote to sale
  convertQuote: async (quoteId) => {
    try {
      const response = await api.post(`${API_BASE_URLS[0]}/quotes/${quoteId}/convert`);
      return response.data;
    } catch (error) {
      console.error('Error converting quote:', error);
      throw error;
    }
  },

  // Get sale items for returns
  getSaleItems: async (saleId) => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/sales/${saleId}/items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sale items:', error);
      throw error;
    }
  },

  // Create return/exchange
  createReturn: async (returnData) => {
    try {
      const response = await api.post(`${API_BASE_URLS[0]}/returns`, returnData);
      return response.data;
    } catch (error) {
      console.error('Error creating return:', error);
      throw error;
    }
  },

  // Get all returns
  getReturns: async () => {
    try {
      const response = await api.get(`${API_BASE_URLS[0]}/returns`);
      return response.data;
    } catch (error) {
      console.error('Error fetching returns:', error);
      throw error;
    }
  },
};

export { apiService };
export default apiService;
