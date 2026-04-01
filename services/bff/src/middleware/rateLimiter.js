const rateLimit = require('express-rate-limit');
const { logger } = require('../config/env');

// Rate limiter general
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Rate limiter estricto para auth (previene brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Brute force detectado en auth desde IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de login. Espera 15 minutos.',
    });
  },
});

// Rate limiter para LLM (más restrictivo por costo)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Límite de consultas AI alcanzado. Disponible en 1 hora.',
    });
  },
});

module.exports = { generalLimiter, authLimiter, aiLimiter };
