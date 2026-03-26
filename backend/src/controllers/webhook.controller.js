const { stripe } = require('../config/stripe');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

const POOL_CONTRIBUTION_PERCENT = Number(process.env.POOL_CONTRIBUTION_PERCENT || 0.3);
const CHARITY_MIN_PERCENT = 0.1;

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    logger.error(`Error processing webhook ${event.type}:`, err);
    return res.status(500).json({ error: 'Webhook handler failed.' });
  }

  res.status(200).json({ received: true });
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session) {
  const { userId, plan } = session.metadata;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_plan: plan,
      stripe_subscription_id: subscription.id,
      subscription_renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);

  logger.info(`Subscription activated for user ${userId}, plan: ${plan}`);
}

async function handlePaymentSucceeded(invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata.userId;
  if (!userId) return;

  const amountPaid = invoice.amount_paid / 100; // Convert from pence/cents

  // Record payment
  await supabase.from('payments').insert({
    user_id: userId,
    stripe_invoice_id: invoice.id,
    amount: amountPaid,
    pool_contribution: amountPaid * POOL_CONTRIBUTION_PERCENT,
    charity_contribution: amountPaid * CHARITY_MIN_PERCENT,
    paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
  });

  // Update renewal date
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);

  logger.info(`Payment recorded for user ${userId}: £${amountPaid}`);
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  const statusMap = {
    active: 'active',
    past_due: 'past_due',
    unpaid: 'lapsed',
    canceled: 'cancelled',
    trialing: 'trialing',
  };

  await supabase
    .from('users')
    .update({
      subscription_status: statusMap[subscription.status] || subscription.status,
      subscription_renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      stripe_subscription_id: null,
    })
    .eq('id', userId);

  logger.info(`Subscription cancelled for user ${userId}`);
}
