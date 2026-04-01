const request = require('supertest');

// Mock de mongoose y modelos antes de importar app
jest.mock('../src/config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/models/User', () => {
  const mockUser = {
    _id: 'user123',
    nombre: 'Test User',
    email: 'test@finanzas.com',
    role: 'user',
    activo: true,
    toJSON: () => ({ _id: 'user123', nombre: 'Test User', email: 'test@finanzas.com' }),
    comparePassword: jest.fn().mockResolvedValue(true),
    refreshTokens: [],
  };

  return {
    findOne: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockUser),
  };
});

// Configurar variables de entorno para tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test_jwt_secret_must_be_very_long_for_testing_purposes_256bits';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_must_be_very_long_for_testing_256bits';
process.env.FASTAPI_URL = 'http://localhost:8000';
process.env.FASTAPI_INTERNAL_KEY = 'test_key';

const app = require('../src/app');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('debe rechazar registro con email inválido', async () => {
      const res = await request(app).post('/api/auth/register').send({
        nombre: 'Test',
        email: 'no-es-email',
        password: 'Pass1234',
      });
      expect(res.status).toBe(400);
    });

    it('debe rechazar contraseña débil', async () => {
      const res = await request(app).post('/api/auth/register').send({
        nombre: 'Test',
        email: 'test@test.com',
        password: '1234',
      });
      expect(res.status).toBe(400);
    });

    it('debe rechazar contraseña sin mayúscula/número', async () => {
      const res = await request(app).post('/api/auth/register').send({
        nombre: 'Test',
        email: 'test@test.com',
        password: 'sinmayuscula',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe retornar 401 con credenciales inválidas', async () => {
      const User = require('../src/models/User');
      User.findOne.mockResolvedValueOnce(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'noexiste@test.com',
        password: 'Password123',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe retornar tokens con credenciales válidas', async () => {
      const User = require('../src/models/User');
      const mockUser = {
        _id: 'user123',
        email: 'test@finanzas.com',
        activo: true,
        toJSON: () => ({ _id: 'user123', email: 'test@finanzas.com' }),
        comparePassword: jest.fn().mockResolvedValue(true),
        refreshTokens: [],
      };
      User.findOne.mockResolvedValueOnce(mockUser);
      User.findByIdAndUpdate.mockResolvedValueOnce(mockUser);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@finanzas.com',
        password: 'Password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });
  });

  describe('GET /health', () => {
    it('debe retornar status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
