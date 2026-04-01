const fastapiService = require('../services/fastapi.service');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { logger } = require('../config/env');

// POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { pregunta, loanId } = req.body;

    if (!pregunta || pregunta.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'La pregunta es requerida' });
    }

    // Recopilar contexto financiero real del usuario
    const [loans, recentTransactions] = await Promise.all([
      Loan.find({ userId: req.user._id, estado: 'activo' }).lean(),
      Transaction.find({ userId: req.user._id })
        .sort({ fecha: -1 })
        .limit(30)
        .lean(),
    ]);

    // Si se especifica un préstamo, incluirlo específicamente
    let loanEspecifico = null;
    if (loanId) {
      loanEspecifico = await Loan.findOne({ _id: loanId, userId: req.user._id }).lean();
    }

    // Calcular métricas de gastos
    const gastosPorCategoria = recentTransactions
      .filter((t) => t.tipo === 'gasto')
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.monto;
        return acc;
      }, {});

    const contextoFinanciero = {
      prestamos_activos: loans.map((l) => ({
        nombre: l.nombre,
        capital_inicial: l.capitalInicial,
        saldo_actual: l.saldoActual || l.capitalInicial,
        tasa_anual: l.tasaInteresAnual,
        plazo_meses: l.plazoMeses,
        cuota_mensual: l.cuotaMensual,
        pagos_realizados: l.pagos?.length || 0,
        total_intereses_pagados: l.totalInteresesPagados || 0,
      })),
      prestamo_especifico: loanEspecifico
        ? {
            nombre: loanEspecifico.nombre,
            capital_inicial: loanEspecifico.capitalInicial,
            saldo_actual: loanEspecifico.saldoActual,
            tasa_anual: loanEspecifico.tasaInteresAnual,
            plazo_meses: loanEspecifico.plazoMeses,
            cuota_mensual: loanEspecifico.cuotaMensual,
          }
        : null,
      gastos_por_categoria: gastosPorCategoria,
      total_gastos_recientes: recentTransactions
        .filter((t) => t.tipo === 'gasto')
        .reduce((sum, t) => sum + t.monto, 0),
      total_ingresos_recientes: recentTransactions
        .filter((t) => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + t.monto, 0),
    };

    logger.info(`Consulta AI de usuario ${req.user._id}: "${pregunta.substring(0, 50)}..."`);

    const respuesta = await fastapiService.chatWithAI({
      pregunta,
      contexto_financiero: contextoFinanciero,
      usuario_nombre: req.user.nombre,
    });

    res.json({ success: true, data: respuesta });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat };
