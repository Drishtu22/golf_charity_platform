const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

const MAX_SCORES = 5;
const MIN_SCORE = 1;
const MAX_SCORE = 45;

// ─── Get User Scores ───────────────────────────────────────────────────────────

exports.getMyScores = async (req, res) => {
  const { data: scores, error } = await supabase
    .from('scores')
    .select('id, score_value, played_at, created_at')
    .eq('user_id', req.user.id)
    .order('played_at', { ascending: false })
    .limit(MAX_SCORES);

  if (error) {
    logger.error('Get scores error:', error);
    return sendError(res, 'Failed to fetch scores.', 500);
  }

  return sendSuccess(res, scores, 'Scores fetched.');
};

// ─── Add Score ─────────────────────────────────────────────────────────────────
/**
 * Rolling logic:
 * 1. Count existing scores for this user.
 * 2. If count >= MAX_SCORES, delete the oldest one before inserting.
 * 3. Insert the new score.
 */
exports.addScore = async (req, res) => {
  const { score_value, played_at } = req.body;
  const userId = req.user.id;

  if (score_value < MIN_SCORE || score_value > MAX_SCORE) {
    return sendError(res, `Score must be between ${MIN_SCORE} and ${MAX_SCORE} (Stableford).`, 400);
  }

  // Fetch existing scores ordered oldest first
  const { data: existingScores, error: fetchError } = await supabase
    .from('scores')
    .select('id, played_at')
    .eq('user_id', userId)
    .order('played_at', { ascending: true });

  if (fetchError) {
    return sendError(res, 'Failed to process score.', 500);
  }

  // Remove oldest if at cap
  if (existingScores.length >= MAX_SCORES) {
    const oldest = existingScores[0];
    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .eq('id', oldest.id);

    if (deleteError) {
      logger.error('Failed to delete oldest score:', deleteError);
      return sendError(res, 'Failed to process score rollover.', 500);
    }
  }

  const { data: newScore, error: insertError } = await supabase
    .from('scores')
    .insert({
      user_id: userId,
      score_value,
      played_at: played_at || new Date().toISOString(),
    })
    .select('id, score_value, played_at, created_at')
    .single();

  if (insertError) {
    logger.error('Insert score error:', insertError);
    return sendError(res, 'Failed to save score.', 500);
  }

  return sendSuccess(res, newScore, 'Score added successfully.', 201);
};

// ─── Update Score ──────────────────────────────────────────────────────────────

exports.updateScore = async (req, res) => {
  const { id } = req.params;
  const { score_value, played_at } = req.body;

  if (score_value !== undefined && (score_value < MIN_SCORE || score_value > MAX_SCORE)) {
    return sendError(res, `Score must be between ${MIN_SCORE} and ${MAX_SCORE}.`, 400);
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('scores')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return sendError(res, 'Score not found.', 404);
  }

  if (existing.user_id !== req.user.id) {
    return sendError(res, 'Forbidden.', 403);
  }

  const updates = {};
  if (score_value !== undefined) updates.score_value = score_value;
  if (played_at !== undefined) updates.played_at = played_at;
  updates.updated_at = new Date();

  const { data: updated, error } = await supabase
    .from('scores')
    .update(updates)
    .eq('id', id)
    .select('id, score_value, played_at, created_at')
    .single();

  if (error) {
    return sendError(res, 'Failed to update score.', 500);
  }

  return sendSuccess(res, updated, 'Score updated.');
};

// ─── Delete Score ──────────────────────────────────────────────────────────────

exports.deleteScore = async (req, res) => {
  const { id } = req.params;

  const { data: existing } = await supabase
    .from('scores')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) return sendError(res, 'Score not found.', 404);
  if (existing.user_id !== req.user.id) return sendError(res, 'Forbidden.', 403);

  const { error } = await supabase.from('scores').delete().eq('id', id);
  if (error) return sendError(res, 'Failed to delete score.', 500);

  return sendSuccess(res, null, 'Score deleted.');
};

// ─── Admin: Get scores for any user ───────────────────────────────────────────

exports.getUserScoresAdmin = async (req, res) => {
  const { userId } = req.params;

  const { data: scores, error } = await supabase
    .from('scores')
    .select('id, score_value, played_at, created_at')
    .eq('user_id', userId)
    .order('played_at', { ascending: false });

  if (error) return sendError(res, 'Failed to fetch scores.', 500);

  return sendSuccess(res, scores, 'Scores fetched.');
};

// ─── Admin: Update any score ───────────────────────────────────────────────────

exports.updateScoreAdmin = async (req, res) => {
  const { id } = req.params;
  const { score_value, played_at } = req.body;

  const { data: updated, error } = await supabase
    .from('scores')
    .update({ score_value, played_at, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, 'Failed to update score.', 500);

  return sendSuccess(res, updated, 'Score updated by admin.');
};
