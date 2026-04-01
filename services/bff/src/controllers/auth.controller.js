const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { invalidateToken } = require('../middleware/auth');
const { logger } = require('../config/env');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { nombre, email, password, monedaBase } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado',
      });
    }

    const user = await User.create({ nombre, email, password, monedaBase });
    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
      ultimoAcceso: new Date(),
    });

    logger.info(`Nuevo usuario registrado: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, activo: true }).select('+password +refreshTokens');
    
    if (!user || !(await user.comparePassword(password))) {
      logger.warn(`Intento de login fallido para: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
      ultimoAcceso: new Date(),
    });

    logger.info(`Login exitoso: ${email}`);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, error: 'Refresh token inválido' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
    
    // Rotar refresh token
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: refreshToken },
      $push: { refreshTokens: newRefreshToken },
    });

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    invalidateToken(req.token);
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, refresh, logout, getProfile };
