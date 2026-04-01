const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const loansController = require('../controllers/loans.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post(
  '/',
  [
    body('nombre').trim().notEmpty(),
    body('capitalInicial').isFloat({ min: 1 }),
    body('tasaInteresAnual').isFloat({ min: 0, max: 100 }),
    body('plazoMeses').isInt({ min: 1 }),
  ],
  loansController.createLoan
);

router.get('/', loansController.getLoans);
router.get('/:id', loansController.getLoan);
router.get('/:id/amortization', loansController.getAmortization);
router.post(
  '/:id/simulate-extra-payment',
  [body('porcentaje_extra').isFloat({ min: 0.1, max: 100 })],
  loansController.simulateExtraPayment
);
router.post(
  '/:id/payment',
  [body('monto').isFloat({ min: 0.01 })],
  loansController.registerPayment
);

module.exports = router;
