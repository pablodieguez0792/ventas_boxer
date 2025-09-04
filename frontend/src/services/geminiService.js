import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.genAI = null;
    
    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isConfigured() {
    return this.genAI !== null;
  }

  async generateCampaignMessage(campaignName, campaignType = 'whatsapp') {
    if (!this.isConfigured()) {
      // Fallback a simulación si no hay API key configurada
      return this.simulateMessageGeneration(campaignName, campaignType);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        Genera un mensaje de campaña de marketing ESPECÍFICO para una tienda de autopartes llamada "Ventas Boxer".
        
        IMPORTANTE: El mensaje debe estar DIRECTAMENTE relacionado con el nombre de la campaña.
        
        Detalles:
        - Nombre de la campaña: "${campaignName}"
        - Tipo: ${campaignType}
        - Analiza el nombre de la campaña y genera contenido específico para ese tema
        - Si menciona "frenos", habla de frenos; si dice "aceite", habla de aceites, etc.
        - Incluir variables {nombre} y {vehiculo} para personalización
        - Máximo 200 caracteres para WhatsApp, 300 para email
        - Incluir emojis relacionados al tema específico
        - Mencionar productos/servicios específicos según el nombre de la campaña
        - Ser creativo y específico, NO genérico
        
        Ejemplos:
        - Si la campaña es "Frenos de Verano": hablar específicamente de frenos, pastillas, discos
        - Si es "Aceites Premium": mencionar tipos de aceite, viscosidades, marcas
        - Si es "Filtros de Aire": hablar de filtros, rendimiento del motor, etc.
        
        Genera SOLO el mensaje, sin explicaciones.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generando mensaje con Gemini:', error);
      // Fallback a simulación en caso de error
      return this.simulateMessageGeneration(campaignName, campaignType);
    }
  }

  async generateCampaignImage(campaignName, description) {
    if (!this.isConfigured()) {
      // Fallback a simulación si no hay API key configurada
      return this.simulateImageGeneration(campaignName);
    }

    try {
      // Nota: Gemini Pro actualmente no soporta generación de imágenes
      // Usamos simulación hasta que esté disponible
      return this.simulateImageGeneration(campaignName);
    } catch (error) {
      console.error('Error generando imagen con Gemini:', error);
      return this.simulateImageGeneration(campaignName);
    }
  }

  // Métodos de simulación para fallback
  simulateMessageGeneration(campaignName, campaignType) {
    const keywords = campaignName.toLowerCase();
    
    // Análisis específico por productos/servicios
    if (keywords.includes('freno') || keywords.includes('brake')) {
      return campaignType === 'whatsapp' 
        ? `¡{nombre}! 🛑 ¿Sientes que los frenos de tu {vehiculo} no responden igual? En Ventas Boxer tenemos pastillas, discos y líquido de frenos de las mejores marcas. ¡Tu seguridad es lo primero!`
        : `Estimado/a {nombre}, la seguridad de tu {vehiculo} es fundamental. Tenemos una línea completa de frenos: pastillas cerámicas, discos ventilados y líquido DOT4. Instalación profesional incluida.`;
    }
    
    if (keywords.includes('aceite') || keywords.includes('oil') || keywords.includes('lubricante')) {
      return campaignType === 'whatsapp'
        ? `¡{nombre}! 🛢️ Tu {vehiculo} merece el mejor aceite. Tenemos sintético, semi-sintético y mineral. Todas las viscosidades: 5W30, 10W40, 20W50. ¡Cambia ya!`
        : `Estimado/a {nombre}, el aceite es la sangre de tu {vehiculo}. Ofrecemos aceites premium: Castrol, Shell, Mobil 1. Todas las viscosidades disponibles con servicio de cambio profesional.`;
    }
    
    if (keywords.includes('filtro') || keywords.includes('filter')) {
      return campaignType === 'whatsapp'
        ? `¡{nombre}! 🌬️ Filtros nuevos = mejor rendimiento para tu {vehiculo}. Aire, aceite, combustible y habitáculo. ¡Respira tranquilo y ahorra combustible!`
        : `Estimado/a {nombre}, los filtros son clave para el rendimiento de tu {vehiculo}. Tenemos filtros de aire, aceite, combustible y habitáculo de marcas reconocidas.`;
    }
    
    if (keywords.includes('bateria') || keywords.includes('battery')) {
      return campaignType === 'whatsapp'
        ? `¡{nombre}! 🔋 ¿Tu {vehiculo} no arranca? Baterías de 12V, libre mantenimiento, 18 meses de garantía. ¡Instalación gratis!`
        : `Estimado/a {nombre}, evita quedarte sin arrancar. Tenemos baterías para tu {vehiculo} con tecnología AGM y gel, garantía extendida e instalación profesional.`;
    }
    
    if (keywords.includes('neumatico') || keywords.includes('llanta') || keywords.includes('tire')) {
      return campaignType === 'whatsapp'
        ? `¡{nombre}! 🚗 Neumáticos nuevos para tu {vehiculo}. Bridgestone, Michelin, Pirelli. ¡Mejor agarre, menor consumo, más seguridad!`
        : `Estimado/a {nombre}, renueva los neumáticos de tu {vehiculo}. Tenemos las mejores marcas en todas las medidas, con balanceado y alineación incluidos.`;
    }
    
    if (keywords.includes('suspension') || keywords.includes('amortiguador')) {
      return campaignType === 'whatsapp'
        ? `¡{nombre}! 🛣️ ¿Tu {vehiculo} rebota mucho? Amortiguadores y espirales nuevos. Monroe, Gabriel, KYB. ¡Viaja cómodo y seguro!`
        : `Estimado/a {nombre}, la suspensión de tu {vehiculo} necesita atención. Ofrecemos amortiguadores, espirales y bujes de las mejores marcas con instalación profesional.`;
    }
    
    if (keywords.includes('escobilla') || keywords.includes('limpiaparabrisas') || keywords.includes('lluvia') || keywords.includes('wiper')) {
      return campaignType === 'whatsapp'
        ? `¡{nombre}! 🌧️ ¿Se acerca la temporada de lluvia? Escobillas limpiaparabrisas nuevas para tu {vehiculo}. Bosch, Valeo, Champion. ¡Visibilidad perfecta garantizada!`
        : `Estimado/a {nombre}, la temporada de lluvia requiere escobillas en perfecto estado para tu {vehiculo}. Tenemos las mejores marcas con tecnología de goma premium para máxima visibilidad.`;
    }
    
    // Fallback genérico pero más específico
    return campaignType === 'whatsapp'
      ? `¡{nombre}! 🔧 En Ventas Boxer encontrás todo para tu {vehiculo}. Repuestos originales, herramientas y accesorios. ¡Calidad garantizada!`
      : `Estimado/a {nombre}, en Ventas Boxer somos especialistas en autopartes para tu {vehiculo}. Repuestos originales, alternos y accesorios con la mejor garantía del mercado.`;
  }

  simulateImageGeneration(campaignName) {
    // Genera URLs de imágenes placeholder más robustas
    const keywords = campaignName.toLowerCase();
    let imageCategory = 'autopartes';
    
    // Determinar categoría de imagen basada en palabras clave
    if (keywords.includes('freno') || keywords.includes('brake')) {
      imageCategory = 'frenos';
    } else if (keywords.includes('aceite') || keywords.includes('oil')) {
      imageCategory = 'aceites';
    } else if (keywords.includes('filtro') || keywords.includes('filter')) {
      imageCategory = 'filtros';
    } else if (keywords.includes('escobilla') || keywords.includes('lluvia')) {
      imageCategory = 'escobillas';
    } else if (keywords.includes('bateria') || keywords.includes('battery')) {
      imageCategory = 'baterias';
    } else if (keywords.includes('neumatico') || keywords.includes('llanta')) {
      imageCategory = 'neumaticos';
    }
    
    // Usar Picsum para imágenes más confiables
    const width = 400;
    const height = 300;
    const seed = Math.abs(campaignName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
    
    // URL más simple y confiable
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
  }
}

export default new GeminiService();
