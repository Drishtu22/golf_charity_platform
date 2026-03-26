const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// ─── Public: List Charities ────────────────────────────────────────────────────

exports.listCharities = async (req, res) => {
  const { search, page = 1, limit = 12 } = req.query;
  const from = (page - 1) * limit;

  let query = supabase
    .from('charities')
    .select('id, name, description, logo_url, website_url, is_featured', { count: 'exact' })
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')
    .range(from, from + Number(limit) - 1);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return sendError(res, 'Failed to fetch charities.', 500);

  return sendSuccess(res, { charities: data, total: count, page: Number(page), limit: Number(limit) }, 'Charities fetched.');
};

// ─── Public: Get Single Charity ────────────────────────────────────────────────

exports.getCharity = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) return sendError(res, 'Charity not found.', 404);

  return sendSuccess(res, data, 'Charity fetched.');
};

// ─── User: Set Charity & Contribution % ───────────────────────────────────────

exports.setMyCharity = async (req, res) => {
  const { charity_id, contribution_percent } = req.body;

  if (contribution_percent < 10 || contribution_percent > 100) {
    return sendError(res, 'Contribution percentage must be between 10% and 100%.', 400);
  }

  // Validate charity exists
  const { data: charity } = await supabase
    .from('charities')
    .select('id')
    .eq('id', charity_id)
    .eq('is_active', true)
    .single();

  if (!charity) return sendError(res, 'Selected charity not found.', 404);

  const { error } = await supabase
    .from('users')
    .update({
      charity_id,
      charity_contribution_percent: contribution_percent,
      updated_at: new Date(),
    })
    .eq('id', req.user.id);

  if (error) return sendError(res, 'Failed to update charity selection.', 500);

  return sendSuccess(res, null, 'Charity preference saved.');
};

// ─── Admin: Create Charity ─────────────────────────────────────────────────────

exports.createCharity = async (req, res) => {
  const { name, description, logo_url, website_url, is_featured = false } = req.body;

  const { data, error } = await supabase
    .from('charities')
    .insert({ id: uuidv4(), name, description, logo_url, website_url, is_featured, is_active: true })
    .select()
    .single();

  if (error) return sendError(res, 'Failed to create charity.', 500);

  return sendSuccess(res, data, 'Charity created.', 201);
};

// ─── Admin: Update Charity ─────────────────────────────────────────────────────

exports.updateCharity = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  updates.updated_at = new Date();

  const { data, error } = await supabase
    .from('charities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, 'Failed to update charity.', 500);

  return sendSuccess(res, data, 'Charity updated.');
};

// ─── Admin: Delete (soft) Charity ─────────────────────────────────────────────

exports.deleteCharity = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('charities')
    .update({ is_active: false, updated_at: new Date() })
    .eq('id', id);

  if (error) return sendError(res, 'Failed to delete charity.', 500);

  return sendSuccess(res, null, 'Charity removed.');
};

// ─── Admin: Get Total Charity Contributions ────────────────────────────────────

exports.getCharityStats = async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      charity_contribution,
      users ( charity_id, charities ( id, name ) )
    `);

  if (error) return sendError(res, 'Failed to fetch charity stats.', 500);

  // Aggregate by charity
  const stats = {};
  data.forEach(({ charity_contribution, users }) => {
    const charity = users?.charities;
    if (!charity) return;
    if (!stats[charity.id]) stats[charity.id] = { id: charity.id, name: charity.name, total: 0 };
    stats[charity.id].total += charity_contribution || 0;
  });

  return sendSuccess(res, Object.values(stats), 'Charity stats fetched.');
};
