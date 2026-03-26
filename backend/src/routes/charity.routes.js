const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const charityController = require('../controllers/charity.controller');
const { authenticate, requireAdmin, requireActiveSubscription } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Public
router.get('/', charityController.listCharities);
router.get('/:id', [param('id').isUUID()], validate, charityController.getCharity);

// Subscriber
router.patch(
  '/me/selection',
  authenticate,
  requireActiveSubscription,
  [
    body('charity_id').isUUID().withMessage('Valid charity ID required.'),
    body('contribution_percent').isInt({ min: 10, max: 100 }).withMessage('Contribution must be 10–100%.'),
  ],
  validate,
  charityController.setMyCharity
);

// Admin
router.post('/', authenticate, requireAdmin, charityController.createCharity);
router.patch('/:id', authenticate, requireAdmin, [param('id').isUUID()], validate, charityController.updateCharity);
router.delete('/:id', authenticate, requireAdmin, [param('id').isUUID()], validate, charityController.deleteCharity);
router.get('/admin/stats', authenticate, requireAdmin, charityController.getCharityStats);

module.exports = router;
