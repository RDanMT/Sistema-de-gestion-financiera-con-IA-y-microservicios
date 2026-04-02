const mongoose = require('mongoose');
const { logger } = require('./env');
const User = require('../models/User');

const seedDatabase = async () => {
  try {
    const defaultUser = await User.findOne({ email: 'evaluador@finanzas.com' });
    if (!defaultUser) {
      logger.info('🌱 Primera corrida detectada. Inyectando usuario semilla...');
      await User.create({
        nombre: 'Profesor Evaluador',
        email: 'evaluador@finanzas.com',
        password: 'password123',
        role: 'admin'
      });
      logger.info('✅ Usuario inyectado (evaluador@finanzas.com : password123)');
    }
  } catch (error) {
    logger.error(`Error al plantar semilla: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Plantar la semilla inicial
    await seedDatabase();

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB desconectado. Intentando reconectar...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconectado');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB conexión cerrada por terminación de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    logger.error(`❌ Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
