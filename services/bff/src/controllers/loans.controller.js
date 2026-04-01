const Loan = require('../models/Loan');
const fastapiService = require('../services/fastapi.service');
const { logger } = require('../config/env');

// POST /api/loans
const createLoan = async (req, res, next) => {
  try {
    const { nombre, tipoPrestamo, capitalInicial, tasaInteresAnual, plazoMeses, fechaInicio, entidadFinanciera, notas } = req.body;

    // Calcular la cuota mensual con FastAPI
    const calcResult = await fastapiService.calculateLoan({
      capital: capitalInicial,
      tasa_anual: tasaInteresAnual,
      plazo_meses: plazoMeses,
    });

    const loan = await Loan.create({
      userId: req.user._id,
      nombre,
      tipoPrestamo,
      capitalInicial,
      tasaInteresAnual,
      plazoMeses,
      fechaInicio: fechaInicio || new Date(),
      entidadFinanciera,
      notas,
      cuotaMensual: calcResult.cuota_mensual,
      saldoActual: capitalInicial,
      totalInteresesProyectados: calcResult.total_intereses,
    });

    res.status(201).json({
      success: true,
      data: { loan, proyeccion: calcResult },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/loans
const getLoans = async (req, res, next) => {
  try {
    const { estado } = req.query;
    const filtro = { userId: req.user._id };
    if (estado) filtro.estado = estado;

    const loans = await Loan.find(filtro).sort({ createdAt: -1 });
    res.json({ success: true, data: loans });
  } catch (error) {
    next(error);
  }
};

// GET /api/loans/:id
const getLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
};

// GET /api/loans/:id/amortization
const getAmortization = async (req, res, next) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }

    const tabla = await fastapiService.getAmortizationTable({
      capital: loan.capitalInicial,
      tasa_anual: loan.tasaInteresAnual,
      plazo_meses: loan.plazoMeses,
      pagos_realizados: loan.pagos.length,
    });

    res.json({ success: true, data: tabla });
  } catch (error) {
    next(error);
  }
};

// POST /api/loans/:id/simulate-extra-payment
const simulateExtraPayment = async (req, res, next) => {
  try {
    const { porcentaje_extra } = req.body;
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }

    const simulacion = await fastapiService.simulateExtraPayment({
      capital: loan.capitalInicial,
      tasa_anual: loan.tasaInteresAnual,
      plazo_meses: loan.plazoMeses,
      saldo_actual: loan.saldoActual || loan.capitalInicial,
      porcentaje_extra,
      pagos_realizados: loan.pagos.length,
    });

    res.json({ success: true, data: simulacion });
  } catch (error) {
    next(error);
  }
};

// POST /api/loans/:id/payment
const registerPayment = async (req, res, next) => {
  try {
    const { monto, fecha, tipo } = req.body;
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }

    // Calcular distribución capital/interés
    const tasaMensual = loan.tasaInteresAnual / 100 / 12;
    const interesMes = loan.saldoActual * tasaMensual;
    const capitalMes = Math.min(monto - interesMes, loan.saldoActual);
    const nuevoSaldo = Math.max(0, loan.saldoActual - capitalMes);

    loan.pagos.push({ fecha: fecha || new Date(), monto, capital: capitalMes, interes: interesMes, saldoPendiente: nuevoSaldo, tipo: tipo || 'programado' });
    loan.saldoActual = nuevoSaldo;
    loan.totalInteresesPagados += interesMes;
    loan.totalCapitalPagado += capitalMes;
    if (nuevoSaldo === 0) loan.estado = 'pagado';

    await loan.save();
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLoan, getLoans, getLoan, getAmortization, simulateExtraPayment, registerPayment };
