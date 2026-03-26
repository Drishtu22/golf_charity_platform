const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const drawService = require('../services/draw.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

// ─── Public: Get Latest Published Draw ────────────────────────────────────────

exports.getLatestDraw = async (req, res) => {
  const { data, error } = await supabase
    .from('draws')
    .select('id, draw_numbers, total_pool, draw_month, published_at, jackpot_rolled_over')
    .eq('status', 'published')
    .order('draw_month', { ascending: false })
    .limit(1)
    .single();

  if (error) return sendError(res, 'No published draw found.', 404);

  return sendSuccess(res, data, 'Latest draw fetched.');
};

// ─── Public: Draw History ─────────────────────────────────────────────────────

exports.getDrawHistory = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('draws')
    .select('id, draw_numbers, total_pool, draw_month, published_at, jackpot_rolled_over', { count: 'exact' })
    .eq('status', 'published')
    .order('draw_month', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return sendError(res, 'Failed to fetch draw history.', 500);

  return sendSuccess(res, { draws: data, total: count, page: Number(page), limit: Number(limit) }, 'Draw history fetched.');
};

// ─── User: Check My Results for a Draw ────────────────────────────────────────

exports.getMyDrawResult = async (req, res) => {
  const { drawId } = req.params;

  const { data, error } = await supabase
    .from('draw_winners')
    .select('id, match_tier, prize_amount, status, proof_url, paid_at')
    .eq('draw_id', drawId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) {
    return sendSuccess(res, null, 'No win recorded for this draw.');
  }

  return sendSuccess(res, data, 'Draw result fetched.');
};

// ─── Admin: Create Draft Draw ─────────────────────────────────────────────────

exports.createDraw = async (req, res) => {
  const { draw_month, draw_mode = 'random', weighted_bias = 'most' } = req.body;

  // Calculate total pool from this month's active subscribers
  const { count: activeSubscribers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active');

  const MONTHLY_POOL_CONTRIBUTION = Number(process.env.POOL_CONTRIBUTION_PER_SUBSCRIBER || 5);
  const totalPool = (activeSubscribers || 0) * MONTHLY_POOL_CONTRIBUTION;

  // Carry over jackpot from last unpaid draw
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('jackpot_rolled_over')
    .eq('status', 'published')
    .order('draw_month', { ascending: false })
    .limit(1)
    .single();

  const jackpotCarryOver = lastDraw?.jackpot_rolled_over || 0;

  const { data: newDraw, error } = await supabase
    .from('draws')
    .insert({
      id: uuidv4(),
      draw_month,
      draw_mode,
      weighted_bias,
      status: 'draft',
      total_pool: totalPool,
      jackpot_carry_over: jackpotCarryOver,
      created_by: req.user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Create draw error:', error);
    return sendError(res, 'Failed to create draw.', 500);
  }

  return sendSuccess(res, newDraw, 'Draw created.', 201);
};

// ─── Admin: Simulate Draw (preview, no commit) ────────────────────────────────

exports.simulateDraw = async (req, res) => {
  const { drawId } = req.params;

  const { data: draw } = await supabase
    .from('draws')
    .select('draw_mode, weighted_bias')
    .eq('id', drawId)
    .single();

  if (!draw) return sendError(res, 'Draw not found.', 404);

  const simulatedNumbers = await drawService.generateDrawNumbers(draw.draw_mode, draw.weighted_bias);
  const pools = await drawService.calculatePrizePools(drawId);

  return sendSuccess(
    res,
    { simulatedNumbers, pools, note: 'This is a simulation only — no results have been saved.' },
    'Draw simulated.'
  );
};

// ─── Admin: Run & Publish Draw ─────────────────────────────────────────────────

exports.runAndPublishDraw = async (req, res) => {
  const { drawId } = req.params;

  const { data: draw } = await supabase
    .from('draws')
    .select('status, draw_mode, weighted_bias')
    .eq('id', drawId)
    .single();

  if (!draw) return sendError(res, 'Draw not found.', 404);
  if (draw.status === 'published') return sendError(res, 'Draw already published.', 400);

  const drawNumbers = await drawService.generateDrawNumbers(draw.draw_mode, draw.weighted_bias);
  const results = await drawService.processDraw(drawId, drawNumbers);

  return sendSuccess(res, results, 'Draw published successfully.');
};

// ─── Admin: List All Draws ────────────────────────────────────────────────────

exports.adminListDraws = async (req, res) => {
  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return sendError(res, 'Failed to fetch draws.', 500);

  return sendSuccess(res, data, 'Draws fetched.');
};
