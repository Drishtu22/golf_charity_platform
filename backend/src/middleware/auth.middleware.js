const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Verifies the Bearer token and attaches user to req.user.
 * Also validates that the user's subscription is active for protected routes.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid token.', 401);
    }

    // Fetch fresh user record from DB on every request
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, is_active, subscription_status')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      return sendError(res, 'User not found.', 401);
    }

    if (!user.is_active) {
      return sendError(res, 'Your account has been deactivated. Contact support.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return sendError(res, 'Authentication failed.', 500);
  }
};

/**
 * Restricts access to admin users only.
 * Must be used AFTER authenticate middleware.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Access denied. Admin privileges required.', 403);
  }
  next();
};

/**
 * Requires an active subscription for subscriber-only features.
 * Must be used AFTER authenticate middleware.
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }

  const allowedStatuses = ['active', 'trialing'];
  if (!allowedStatuses.includes(req.user.subscription_status)) {
    return sendError(
      res,
      'An active subscription is required to access this feature.',
      403
    );
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireActiveSubscription };
