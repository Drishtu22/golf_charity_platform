const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const scoreController = require('../controllers/score.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate, requireAdmin);

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Users
router.get('/users', adminController.listUsers);
router.get('/users/:id', [param('id').isUUID()], validate, adminController.getUser);
router.patch('/users/:id', [param('id').isUUID()], validate, adminController.updateUser);

// Scores (admin can edit any user's score)
router.get('/users/:userId/scores', [param('userId').isUUID()], validate, scoreController.getUserScoresAdmin);
router.patch('/scores/:id', [param('id').isUUID()], validate, scoreController.updateScoreAdmin);

// Winners
router.get('/winners', adminController.listWinners);
router.patch(
  '/winners/:id/verify',
  [
    param('id').isUUID(),
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject.'),
  ],
  validate,
  adminController.verifyWinner
);
router.patch('/winners/:id/paid', [param('id').isUUID()], validate, adminController.markWinnerPaid);

module.exports = router;
