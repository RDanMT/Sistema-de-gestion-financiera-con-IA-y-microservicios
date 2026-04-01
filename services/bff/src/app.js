require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { validateEnv, logger } = require('./config/env');
const { connectDB } = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Rutas
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transactions.routes');
const loanRoutes = require('./routes/loans.routes');
const aiRoutes = require('./routes/ai.routes');

// Validar variables de entorno antes de arrancar
validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// ──────────────────────────────────────────
// Middleware de Seguridad
// ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(generalLimiter);

// ──────────────────────────────────────────
// Logging HTTP
// ──────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// ──────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'financial-bff',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ──────────────────────────────────────────
// Rutas de la API
// ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/ai', aiRoutes);

// ──────────────────────────────────────────
// Manejo de Errores
// ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ──────────────────────────────────────────
// Arranque del Servidor
// ──────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 BFF corriendo en http://localhost:${PORT}`);
    logger.info(`📊 Entorno: ${process.env.NODE_ENV}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
