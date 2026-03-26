import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { subscriptionService } from '@/services';
import useAuthStore from '@/context/authStore';
import { Spinner } from '@/components/common';

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '£9.99',
    period: '/month',
    highlight: false,
    features: ['Monthly draw entry', 'Min 10% charity contribution', 'Score tracking', 'Cancel anytime'],
  },
  {
    id: 'yearly',
    label: 'Annual',
    price: '£89.99',
    period: '/year',
    highlight: true,
    badge: 'Best Value — Save 25%',
    features: ['All monthly features', '12 draw entries', 'Priority support', 'Bigger charity impact'],
  },
];

export default function SubscribePage() {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      window.location.href = '/register';
      return;
    }
    setLoading(planId);
    try {
      const { sessionUrl } = await subscriptionService.createCheckout(planId);
      window.location.href = sessionUrl;
    } catch {
      toast.error('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
          Choose your plan
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Every subscription funds a charity you care about and enters you in our monthly prize draw.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className={`relative rounded-2xl border p-7 flex flex-col gap-5 ${
              plan.highlight
                ? 'border-brand-500/40 bg-brand-500/8 glow-green'
                : 'border-white/15 bg-surface-50'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
                {plan.badge}
              </div>
            )}

            <div>
              <p className="text-sm text-white/50 font-medium mb-1">{plan.label}</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-display font-bold text-white">{plan.price}</span>
                <span className="text-white/40 pb-1">{plan.period}</span>
              </div>
            </div>

            <ul className="flex flex-col gap-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-brand-500 text-base">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={plan.highlight ? 'btn-primary w-full py-3.5' : 'btn-secondary w-full py-3.5'}
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id}
            >
              {loading === plan.id ? <Spinner size="sm" /> : isAuthenticated ? `Subscribe ${plan.label}` : 'Get Started →'}
            </button>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-white/30 mt-8 text-center max-w-md">
        Secure payments via Stripe. Cancel anytime. Charity contributions are non-refundable once processed.
        {!isAuthenticated && (
          <> Already have an account? <Link to="/login" className="text-brand-400 underline">Sign in</Link>.</>
        )}
      </p>
    </div>
  );
}
