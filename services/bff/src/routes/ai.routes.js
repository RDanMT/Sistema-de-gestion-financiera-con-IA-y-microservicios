const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(aiLimiter);

router.post(
  '/chat',
  [body('pregunta').trim().notEmpty().isLength({ max: 500 })],
  aiController.chat
);

module.exports = router;
