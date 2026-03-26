const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

// ─── Token Helpers ─────────────────────────────────────────────────────────────

const generateAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// ─── Register ──────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existingUser) {
    return sendError(res, 'An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: uuidv4(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name,
      last_name,
      role: 'subscriber',
      subscription_status: 'inactive',
      is_active: true,
    })
    .select('id, email, first_name, last_name, role, subscription_status')
    .single();

  if (error) {
    logger.error('Register error:', error);
    return sendError(res, 'Failed to create account. Please try again.', 500);
  }

  const accessToken = generateAccessToken(newUser.id);
  const refreshToken = generateRefreshToken(newUser.id);

  logger.info(`New user registered: ${newUser.email}`);

  return sendSuccess(
    res,
    { user: newUser, accessToken, refreshToken },
    'Account created successfully.',
    201
  );
};

// ─── Login ─────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, first_name, last_name, role, subscription_status, is_active')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !user) {
    return sendError(res, 'Invalid email or password.', 401);
  }

  if (!user.is_active) {
    return sendError(res, 'Your account has been deactivated. Please contact support.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password.', 401);
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const { password_hash, ...safeUser } = user;

  logger.info(`User logged in: ${user.email}`);

  return sendSuccess(res, { user: safeUser, accessToken, refreshToken }, 'Login successful.');
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'Refresh token required.', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch {
    return sendError(res, 'Invalid or expired refresh token.', 401);
  }

  if (decoded.type !== 'refresh') {
    return sendError(res, 'Invalid token type.', 401);
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('id', decoded.sub)
    .single();

  if (!user || !user.is_active) {
    return sendError(res, 'User not found or deactivated.', 401);
  }

  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  return sendSuccess(
    res,
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    'Token refreshed.'
  );
};

// ─── Get Current User ──────────────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select(
      `id, email, first_name, last_name, role, subscription_status, 
       charity_id, charity_contribution_percent, created_at,
       charities ( id, name, logo_url )`
    )
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return sendError(res, 'Failed to fetch user profile.', 500);
  }

  return sendSuccess(res, user, 'Profile fetched.');
};

// ─── Change Password ───────────────────────────────────────────────────────────

exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    return sendError(res, 'Current password is incorrect.', 400);
  }

  const newHash = await bcrypt.hash(new_password, 12);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash, updated_at: new Date() })
    .eq('id', req.user.id);

  if (error) {
    return sendError(res, 'Failed to update password.', 500);
  }

  return sendSuccess(res, null, 'Password updated successfully.');
};
