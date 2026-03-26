const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const scoreController = require('../controllers/score.controller');
const { authenticate, requireActiveSubscription } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const scoreValidation = [
  body('score_value')
    .isInt({ min: 1, max: 45 })
    .withMessage('Score must be a whole number between 1 and 45 (Stableford).'),
  body('played_at')
    .isISO8601()
    .withMessage('played_at must be a valid ISO date.')
    .custom((val) => new Date(val) <= new Date())
    .withMessage('Score date cannot be in the future.'),
];

const idParam = [param('id').isUUID().withMessage('Invalid score ID.')];

// All score routes require authentication + active subscription
router.use(authenticate, requireActiveSubscription);

router.get('/', scoreController.getMyScores);
router.post('/', scoreValidation, validate, scoreController.addScore);
router.patch('/:id', idParam, validate, scoreController.updateScore);
router.delete('/:id', idParam, validate, scoreController.deleteScore);

module.exports = router;
