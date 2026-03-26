const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

// Update profile
router.patch(
  '/me',
  [
    body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty.'),
    body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty.'),
  ],
  validate,
  async (req, res) => {
    const { first_name, last_name } = req.body;
    const updates = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    updates.updated_at = new Date();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, first_name, last_name')
      .single();

    if (error) return sendError(res, 'Failed to update profile.', 500);
    return sendSuccess(res, data, 'Profile updated.');
  }
);

// Get user's winnings summary
router.get('/me/winnings', async (req, res) => {
  const { data, error } = await supabase
    .from('draw_winners')
    .select(`
      id, match_tier, prize_amount, status, proof_url, paid_at,
      draws ( id, draw_month, draw_numbers )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return sendError(res, 'Failed to fetch winnings.', 500);
  return sendSuccess(res, data, 'Winnings fetched.');
});

// Upload proof of win
router.patch('/me/winnings/:winnerId/proof', async (req, res) => {
  const { winnerId } = req.params;
  const { proof_url } = req.body;

  if (!proof_url) return sendError(res, 'proof_url is required.', 400);

  const { data: winner } = await supabase
    .from('draw_winners')
    .select('id, user_id, status')
    .eq('id', winnerId)
    .single();

  if (!winner) return sendError(res, 'Winner record not found.', 404);
  if (winner.user_id !== req.user.id) return sendError(res, 'Forbidden.', 403);
  if (winner.status !== 'pending_verification') {
    return sendError(res, 'Proof can only be submitted for pending verifications.', 400);
  }

  const { data, error } = await supabase
    .from('draw_winners')
    .update({ proof_url, status: 'proof_submitted', updated_at: new Date() })
    .eq('id', winnerId)
    .select()
    .single();

  if (error) return sendError(res, 'Failed to submit proof.', 500);
  return sendSuccess(res, data, 'Proof submitted successfully.');
});

module.exports = router;
