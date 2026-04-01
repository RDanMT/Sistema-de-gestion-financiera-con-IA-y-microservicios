const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const transController = require('../controllers/transactions.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post(
  '/',
  [
    body('tipo').isIn(['ingreso', 'gasto', 'transferencia']),
    body('monto').isFloat({ min: 0.01 }),
    body('categoria').notEmpty(),
  ],
  transController.createTransaction
);

router.get('/', transController.getTransactions);
router.get('/summary', transController.getSummary);
router.delete('/:id', transController.deleteTransaction);

module.exports = router;
