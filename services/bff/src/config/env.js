require('dotenv').config();
const winston = require('winston');

// Configuración del logger enterprise
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `[${timestamp}] ${level}: ${message}\n${stack}`
        : `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
    }),
  ],
});

// Validar variables de entorno requeridas
const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'FASTAPI_URL',
  'FRONTEND_URL',
];

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    logger.error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    logger.error('Copia .env.example a .env y configura los valores');
    process.exit(1);
  }
};

module.exports = { logger, validateEnv };
