const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  monto: { type: Number, required: true },
  capital: { type: Number, required: true },
  interes: { type: Number, required: true },
  saldoPendiente: { type: Number, required: true },
  tipo: {
    type: String,
    enum: ['programado', 'extra', 'anticipado'],
    default: 'programado',
  },
});

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del préstamo es requerido'],
      trim: true,
    },
    tipoPrestamo: {
      type: String,
      enum: ['personal', 'hipotecario', 'automotriz', 'educativo', 'empresarial', 'otro'],
      default: 'personal',
    },
    capitalInicial: {
      type: Number,
      required: [true, 'El capital inicial es requerido'],
      min: [1, 'El capital debe ser mayor a 0'],
    },
    tasaInteresAnual: {
      type: Number,
      required: [true, 'La tasa de interés anual es requerida'],
      min: [0, 'La tasa no puede ser negativa'],
      max: [100, 'La tasa no puede superar el 100%'],
    },
    plazoMeses: {
      type: Number,
      required: [true, 'El plazo en meses es requerido'],
      min: [1, 'El plazo debe ser al menos 1 mes'],
    },
    fechaInicio: {
      type: Date,
      required: [true, 'La fecha de inicio es requerida'],
      default: Date.now,
    },
    cuotaMensual: {
      type: Number,
    },
    saldoActual: {
      type: Number,
    },
    totalInteresesPagados: {
      type: Number,
      default: 0,
    },
    totalCapitalPagado: {
      type: Number,
      default: 0,
    },
    totalInteresesProyectados: {
      type: Number,
    },
    pagos: [pagoSchema],
    estado: {
      type: String,
      enum: ['activo', 'pagado', 'en_mora', 'refinanciado'],
      default: 'activo',
    },
    entidadFinanciera: {
      type: String,
      trim: true,
    },
    notas: {
      type: String,
      maxlength: [500, 'Las notas no pueden superar 500 caracteres'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Índices para consultas frecuentes
loanSchema.index({ userId: 1, estado: 1 });
loanSchema.index({ userId: 1, fechaInicio: -1 });

// Virtual: porcentaje pagado
loanSchema.virtual('porcentajePagado').get(function () {
  if (!this.capitalInicial) return 0;
  return Math.round((this.totalCapitalPagado / this.capitalInicial) * 100);
});

// Virtual: fecha estimada de liquidación
loanSchema.virtual('mesesRestantes').get(function () {
  if (!this.pagos) return this.plazoMeses;
  return this.plazoMeses - this.pagos.length;
});

module.exports = mongoose.model('Loan', loanSchema);
