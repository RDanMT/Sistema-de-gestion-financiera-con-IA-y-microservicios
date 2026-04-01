const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tipo: {
      type: String,
      enum: ['ingreso', 'gasto', 'transferencia'],
      required: [true, 'El tipo de transacción es requerido'],
    },
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: [0.01, 'El monto debe ser mayor a 0'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es requerida'],
      enum: [
        'alimentacion',
        'transporte',
        'vivienda',
        'salud',
        'educacion',
        'entretenimiento',
        'ropa',
        'servicios',
        'inversiones',
        'salario',
        'freelance',
        'prestamo',
        'ahorro',
        'otro',
      ],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede superar 200 caracteres'],
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
      default: Date.now,
      index: true,
    },
    etiquetas: {
      type: [String],
      default: [],
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
    },
    metadatos: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Índice compuesto para queries frecuentes
transactionSchema.index({ userId: 1, fecha: -1 });
transactionSchema.index({ userId: 1, categoria: 1 });
transactionSchema.index({ userId: 1, tipo: 1, fecha: -1 });

// Virtual: mes y año para agrupación
transactionSchema.virtual('mesAño').get(function () {
  return `${this.fecha.getFullYear()}-${String(this.fecha.getMonth() + 1).padStart(2, '0')}`;
});

module.exports = mongoose.model('Transaction', transactionSchema);
