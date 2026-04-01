const Transaction = require('../models/Transaction');
const { logger } = require('../config/env');

// POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { tipo, monto, categoria, descripcion, fecha, etiquetas, loanId } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      tipo,
      monto,
      categoria,
      descripcion,
      fecha: fecha || new Date(),
      etiquetas,
      loanId,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      tipo,
      categoria,
      fechaInicio,
      fechaFin,
      ordenar = 'fecha',
      direccion = 'desc',
    } = req.query;

    const filtro = { userId: req.user._id };
    if (tipo) filtro.tipo = tipo;
    if (categoria) filtro.categoria = categoria;
    if (fechaInicio || fechaFin) {
      filtro.fecha = {};
      if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) filtro.fecha.$lte = new Date(fechaFin);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = direccion === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filtro)
        .sort({ [ordenar]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(filtro),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/summary
const getSummary = async (req, res, next) => {
  try {
    const { mes, anio } = req.query;
    const now = new Date();
    const year = parseInt(anio) || now.getFullYear();
    const month = parseInt(mes) || now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const resumen = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          fecha: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { tipo: '$tipo', categoria: '$categoria' },
          total: { $sum: '$monto' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.tipo',
          totalGeneral: { $sum: '$total' },
          categorias: {
            $push: {
              categoria: '$_id.categoria',
              total: '$total',
              count: '$count',
            },
          },
        },
      },
    ]);

    res.json({ success: true, data: resumen, periodo: { mes: month, anio: year } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    }

    res.json({ success: true, message: 'Transacción eliminada' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTransaction, getTransactions, getSummary, deleteTransaction };
