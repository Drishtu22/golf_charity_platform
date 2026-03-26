const { stripe, STRIPE_PRICES } = require('../config/stripe');
const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

// ─── Create Checkout Session ───────────────────────────────────────────────────

exports.createCheckoutSession = async (req, res) => {
  const { plan } = req.body; // 'monthly' | 'yearly'
  const user = req.user;

  const priceId = plan === 'yearly' ? STRIPE_PRICES.YEARLY : STRIPE_PRICES.MONTHLY;

  if (!priceId) {
    return sendError(res, `Stripe price ID for "${plan}" plan is not configured.`, 500);
  }

  // Create or retrieve Stripe customer
  let stripeCustomerId = null;
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_customer_id) {
    stripeCustomerId = profile.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;

    await supabase
      .from('users')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
    cancel_url: `${process.env.FRONTEND_URL}/subscribe?cancelled=true`,
    metadata: { userId: user.id, plan },
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
  });

  return sendSuccess(res, { sessionUrl: session.url, sessionId: session.id }, 'Checkout session created.');
};

// ─── Get Subscription Status ───────────────────────────────────────────────────

exports.getSubscriptionStatus = async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status, subscription_plan, subscription_renewal_date, stripe_subscription_id')
    .eq('id', req.user.id)
    .single();

  return sendSuccess(res, user, 'Subscription status fetched.');
};

// ─── Cancel Subscription ───────────────────────────────────────────────────────

exports.cancelSubscription = async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('id', req.user.id)
    .single();

  if (!user?.stripe_subscription_id) {
    return sendError(res, 'No active subscription found.', 400);
  }

  // Cancel at period end (not immediately)
  await stripe.subscriptions.update(user.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await supabase
    .from('users')
    .update({ subscription_status: 'cancelling' })
    .eq('id', req.user.id);

  return sendSuccess(res, null, 'Subscription will be cancelled at the end of the billing period.');
};

// ─── Customer Portal ───────────────────────────────────────────────────────────

exports.createPortalSession = async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', req.user.id)
    .single();

  if (!user?.stripe_customer_id) {
    return sendError(res, 'No billing account found.', 400);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
  });

  return sendSuccess(res, { url: session.url }, 'Portal session created.');
};
