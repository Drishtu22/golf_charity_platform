const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

// ─── Token Helpers ─────────────────────────────────────────────────────────────

const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing!');
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_REFRESH_SECRET/JWT_SECRET is missing!');
    throw new Error('JWT secret not configured');
  }
  
  return jwt.sign({ sub: userId, type: 'refresh' }, secret, {
    expiresIn: '7d',
  });
};

// ─── Register ──────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  console.log('=== REGISTER ENDPOINT HIT ===');
  
  try {
    const { email, password, first_name, last_name } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.error('Missing required fields');
      return sendError(res, 'Email and password are required.', 400);
    }

    // Check if email already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error checking existing user:', fetchError);
      return sendError(res, 'Database error. Please try again.', 500);
    }

    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: newUser, error: insertError } = await supabase
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

    if (insertError) {
      console.error('Register error:', insertError);
      return sendError(res, 'Failed to create account. Please try again.', 500);
    }

    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    logger.info(`New user registered: ${newUser.email}`);
    console.log(`Registration successful for: ${newUser.email}`);

    return sendSuccess(
      res,
      { user: newUser, accessToken, refreshToken },
      'Account created successfully.',
      201
    );
  } catch (error) {
    console.error('Unhandled error in register:', error);
    return sendError(res, 'An unexpected error occurred.', 500);
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  console.log('=== LOGIN ENDPOINT HIT ===');
  console.log('Request body:', { ...req.body, password: '[REDACTED]' });
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_ANON_KEY
  });
  
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.error('Missing email or password');
      return sendError(res, 'Email and password are required.', 400);
    }

    console.log(`Attempting login for: ${email.toLowerCase()}`);

    // Query user from database
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, email, password_hash, first_name, last_name, role, subscription_status, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (queryError) {
      console.error('Database query error:', queryError);
      console.error('Query error code:', queryError.code);
      console.error('Query error message:', queryError.message);
      
      // Check for common Supabase errors
      if (queryError.code === 'PGRST116') {
        return sendError(res, 'Invalid email or password.', 401);
      }
      
      return sendError(res, 'Database error. Please try again.', 500);
    }

    if (!user) {
      console.log('No user found with this email');
      return sendError(res, 'Invalid email or password.', 401);
    }

    console.log(`User found: ${user.id}, active: ${user.is_active}`);

    if (!user.is_active) {
      console.log('User account is deactivated');
      return sendError(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log('Password mismatch');
      return sendError(res, 'Invalid email or password.', 401);
    }

    console.log('Password verified, generating tokens');

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Remove sensitive data
    const { password_hash, ...safeUser } = user;

    logger.info(`User logged in: ${user.email}`);
    console.log(`Login successful for: ${user.email}`);

    return sendSuccess(
      res,
      { user: safeUser, accessToken, refreshToken },
      'Login successful.'
    );
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return sendError(res, 'An unexpected error occurred during login.', 500);
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────

exports.refreshToken = async (req, res) => {
  console.log('=== REFRESH TOKEN ENDPOINT HIT ===');
  
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token required.', 400);
    }

    let decoded;
    try {
      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
      decoded = jwt.verify(refreshToken, secret);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return sendError(res, 'Invalid or expired refresh token.', 401);
    }

    if (decoded.type !== 'refresh') {
      return sendError(res, 'Invalid token type.', 401);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', decoded.sub)
      .single();

    if (userError || !user || !user.is_active) {
      console.error('User not found or inactive:', userError);
      return sendError(res, 'User not found or deactivated.', 401);
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    return sendSuccess(
      res,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      'Token refreshed.'
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return sendError(res, 'Failed to refresh token.', 500);
  }
};

// ─── Get Current User ──────────────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  console.log('=== GET CURRENT USER ENDPOINT HIT ===');
  
  try {
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
      console.error('Failed to fetch user:', error);
      return sendError(res, 'Failed to fetch user profile.', 500);
    }

    return sendSuccess(res, user, 'Profile fetched.');
  } catch (error) {
    console.error('GetMe error:', error);
    return sendError(res, 'Failed to fetch user profile.', 500);
  }
};

// ─── Change Password ───────────────────────────────────────────────────────────

exports.changePassword = async (req, res) => {
  console.log('=== CHANGE PASSWORD ENDPOINT HIT ===');
  
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return sendError(res, 'Current password and new password are required.', 400);
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (fetchError || !user) {
      console.error('Failed to fetch user:', fetchError);
      return sendError(res, 'User not found.', 404);
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect.', 400);
    }

    const newHash = await bcrypt.hash(new_password, 12);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date() })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return sendError(res, 'Failed to update password.', 500);
    }

    return sendSuccess(res, null, 'Password updated successfully.');
  } catch (error) {
    console.error('Change password error:', error);
    return sendError(res, 'Failed to update password.', 500);
  }
};