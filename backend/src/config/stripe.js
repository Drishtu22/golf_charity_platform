const Stripe = require('stripe');
const logger = require('../utils/logger');

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('❌ Missing STRIPE_SECRET_KEY environment variable.');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Golf Charity Platform',
    version: '1.0.0',
  },
});

/**
 * Subscription price IDs — set these in your Stripe dashboard and .env
 */
const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  YEARLY: process.env.STRIPE_PRICE_YEARLY,
};

// Validate price IDs
if (!STRIPE_PRICES.MONTHLY) {
  logger.warn('⚠️ STRIPE_PRICE_MONTHLY is not configured in .env');
} else {
  logger.info(`✅ Monthly price ID configured: ${STRIPE_PRICES.MONTHLY}`);
}

if (!STRIPE_PRICES.YEARLY) {
  logger.warn('⚠️ STRIPE_PRICE_YEARLY is not configured in .env');
} else {
  logger.info(`✅ Yearly price ID configured: ${STRIPE_PRICES.YEARLY}`);
}

module.exports = { stripe, STRIPE_PRICES };