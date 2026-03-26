const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const drawController = require('../controllers/draw.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// ─── Public Routes ─────────────────────────────────────────────────────────────
router.get('/latest', drawController.getLatestDraw);
router.get('/history', drawController.getDrawHistory);

// ─── Subscriber Routes ─────────────────────────────────────────────────────────
router.get('/:drawId/my-result', authenticate, drawController.getMyDrawResult);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
router.use(authenticate, requireAdmin);

router.get('/admin/all', drawController.adminListDraws);

router.post(
  '/',
  [
    body('draw_month').isISO8601().withMessage('draw_month must be a valid date.'),
    body('draw_mode').optional().isIn(['random', 'weighted']).withMessage('Invalid draw mode.'),
    body('weighted_bias').optional().isIn(['most', 'least']).withMessage('Invalid bias.'),
  ],
  validate,
  drawController.createDraw
);

router.post('/:drawId/simulate', [param('drawId').isUUID()], validate, drawController.simulateDraw);
router.post('/:drawId/publish', [param('drawId').isUUID()], validate, drawController.runAndPublishDraw);

module.exports = router;
