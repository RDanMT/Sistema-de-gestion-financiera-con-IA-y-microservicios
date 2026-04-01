const axios = require('axios');
const { logger } = require('../config/env');

const fastapiClient = axios.create({
  baseURL: process.env.FASTAPI_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Key': process.env.FASTAPI_INTERNAL_KEY || '',
  },
});

// Retry logic
fastapiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    if (response?.status >= 500 && !config._retry) {
      config._retry = true;
      logger.warn('FastAPI error, reintentando en 1s...');
      await new Promise((r) => setTimeout(r, 1000));
      return fastapiClient(config);
    }

    const errorMsg = response?.data?.detail || error.message;
    logger.error(`FastAPI error: ${errorMsg}`);
    throw new Error(`Servicio financiero no disponible: ${errorMsg}`);
  }
);

const calculateLoan = async (params) => {
  const { data } = await fastapiClient.post('/api/loans/calculate', params);
  return data;
};

const getAmortizationTable = async (params) => {
  const { data } = await fastapiClient.post('/api/loans/amortization', params);
  return data;
};

const simulateExtraPayment = async (params) => {
  const { data } = await fastapiClient.post('/api/loans/simulate-extra-payment', params);
  return data;
};

const analyzeSpending = async (params) => {
  const { data } = await fastapiClient.post('/api/analytics/spending', params);
  return data;
};

const chatWithAI = async (params) => {
  const { data } = await fastapiClient.post('/api/ai/chat', params);
  return data;
};

module.exports = { calculateLoan, getAmortizationTable, simulateExtraPayment, analyzeSpending, chatWithAI };
