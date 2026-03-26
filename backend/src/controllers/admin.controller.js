const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// ─── Dashboard Analytics ───────────────────────────────────────────────────────

exports.getDashboardStats = async (req, res) => {
  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: poolData },
    { data: charityData },
    { data: recentWinners },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('payments').select('pool_contribution'),
    supabase.from('payments').select('charity_contribution'),
    supabase
      .from('draw_winners')
      .select('id, prize_amount, match_tier, status, users(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalPrizePool = (poolData || []).reduce((sum, r) => sum + (r.pool_contribution || 0), 0);
  const totalCharityContributions = (charityData || []).reduce((sum, r) => sum + (r.charity_contribution || 0), 0);

  return sendSuccess(
    res,
    {
      totalUsers,
      activeSubscribers,
      totalPrizePool: Math.round(totalPrizePool * 100) / 100,
      totalCharityContributions: Math.round(totalCharityContributions * 100) / 100,
      recentWinners,
    },
    'Dashboard stats fetched.'
  );
};

// ─── User Management ───────────────────────────────────────────────────────────

exports.listUsers = async (req, res) => {
  const { page = 1, limit = 20, search, subscription_status } = req.query;
  const from = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select(
      'id, email, first_name, last_name, role, subscription_status, subscription_plan, is_active, created_at, charity_id, charities(name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, from + Number(limit) - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  if (subscription_status) {
    query = query.eq('subscription_status', subscription_status);
  }

  const { data, error, count } = await query;
  if (error) return sendError(res, 'Failed to fetch users.', 500);

  return sendSuccess(res, { users: data, total: count, page: Number(page), limit: Number(limit) }, 'Users fetched.');
};

exports.getUser = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('users')
    .select('*, charities(id, name), scores(id, score_value, played_at)')
    .eq('id', id)
    .single();

  if (error || !data) return sendError(res, 'User not found.', 404);

  const { password_hash, ...safeUser } = data;
  return sendSuccess(res, safeUser, 'User fetched.');
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, is_active, role } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ first_name, last_name, is_active, role, updated_at: new Date() })
    .eq('id', id)
    .select('id, email, first_name, last_name, role, is_active')
    .single();

  if (error) return sendError(res, 'Failed to update user.', 500);

  return sendSuccess(res, data, 'User updated.');
};

// ─── Winner Management ─────────────────────────────────────────────────────────

exports.listWinners = async (req, res) => {
  const { status } = req.query;

  let query = supabase
    .from('draw_winners')
    .select(`
      id, match_tier, prize_amount, status, proof_url, paid_at, created_at,
      users ( id, first_name, last_name, email ),
      draws ( id, draw_month, draw_numbers )
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return sendError(res, 'Failed to fetch winners.', 500);

  return sendSuccess(res, data, 'Winners fetched.');
};

exports.verifyWinner = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' | 'reject'

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await supabase
    .from('draw_winners')
    .update({ status: newStatus, reviewed_by: req.user.id, reviewed_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, 'Failed to update winner status.', 500);

  return sendSuccess(res, data, `Winner ${newStatus}.`);
};

exports.markWinnerPaid = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('draw_winners')
    .update({ status: 'paid', paid_at: new Date(), paid_by: req.user.id })
    .eq('id', id)
    .eq('status', 'approved')
    .select()
    .single();

  if (error || !data) return sendError(res, 'Failed to mark as paid. Ensure winner is approved first.', 400);

  return sendSuccess(res, data, 'Winner marked as paid.');
};
