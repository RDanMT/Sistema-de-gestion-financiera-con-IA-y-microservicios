const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../config/env');

// Lista negra en memoria (en producción usar Redis)
const tokenBlacklist = new Set();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar si el token está en la lista negra
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario aún existe y está activo
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado o inactivo',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.warn(`Intento de acceso con token inválido: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Token inválido',
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requieren permisos de administrador',
    });
  }
  next();
};

const invalidateToken = (token) => {
  tokenBlacklist.add(token);
  // Limpiar tokens expirados periódicamente (cada hora)
  setTimeout(() => tokenBlacklist.delete(token), 15 * 60 * 1000);
};

module.exports = { authenticate, authorizeAdmin, invalidateToken };
