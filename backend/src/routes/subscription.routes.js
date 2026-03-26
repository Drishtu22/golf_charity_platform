// subscription.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);
router.post('/checkout', [body('plan').isIn(['monthly', 'yearly']).withMessage('Plan must be monthly or yearly.')], validate, subscriptionController.createCheckoutSession);
router.get('/status', subscriptionController.getSubscriptionStatus);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/portal', subscriptionController.createPortalSession);

module.exports = router;
