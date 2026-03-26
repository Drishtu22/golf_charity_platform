import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { drawService, charityService } from '@/services';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] } }),
};

function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-grid">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gold-500/5 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <motion.div
            initial="hidden" animate="show"
            variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Monthly draws. Real prizes. Real impact.
          </motion.div>

          <motion.h1
            initial="hidden" animate="show" variants={fadeUp} custom={1}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6"
          >
            Golf that{' '}
            <span className="text-gradient">gives back</span>
            {' '}to the world
          </motion.h1>

          <motion.p
            initial="hidden" animate="show" variants={fadeUp} custom={2}
            className="text-lg sm:text-xl text-white/55 leading-relaxed mb-10 max-w-xl"
          >
            Enter your Stableford scores each month, compete in our prize draw,
            and automatically donate to a charity you believe in — all with one subscription.
          </motion.p>

          <motion.div
            initial="hidden" animate="show" variants={fadeUp} custom={3}
            className="flex flex-wrap gap-3"
          >
            <Link to="/subscribe" className="btn-primary text-base px-8 py-3.5">
              Start Playing →
            </Link>
            <Link to="/how-it-works" className="btn-secondary text-base px-8 py-3.5">
              How It Works
            </Link>
          </motion.div>

          <motion.div
            initial="hidden" animate="show" variants={fadeUp} custom={4}
            className="mt-12 flex flex-wrap gap-6"
          >
            {[
              { value: '£10K+', label: 'Prize Pool This Month' },
              { value: '2,400+', label: 'Active Members' },
              { value: '12', label: 'Charity Partners' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: '01', icon: '⛳', title: 'Subscribe', desc: 'Choose a monthly or annual plan. A portion of every subscription goes straight to your chosen charity.' },
    { n: '02', icon: '📊', title: 'Log Your Scores', desc: 'Enter your last 5 Stableford scores after every round. The system keeps a rolling record automatically.' },
    { n: '03', icon: '🎯', title: 'Enter the Draw', desc: 'Your scores are automatically entered into the monthly draw. Match 3, 4, or all 5 numbers to win.' },
    { n: '04', icon: '🏆', title: 'Win & Give', desc: 'Cash prizes for top matches. Jackpot rolls over until claimed. Your charity gets funded either way.' },
  ];

  return (
    <section className="py-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="section-title mb-4"
          >
            Simple to play. <span className="text-gradient">Meaningful to win.</span>
          </motion.h2>
          <p className="section-subtitle mx-auto text-center">
            Four steps from subscription to potential jackpot — and your favourite charity benefits every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card relative overflow-hidden group hover:border-brand-500/30 transition-colors"
            >
              <span className="absolute top-4 right-4 text-5xl font-display font-bold text-white/5 group-hover:text-white/8 transition-colors select-none">
                {step.n}
              </span>
              <div className="text-3xl mb-4">{step.icon}</div>
              <h3 className="font-display font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrizePoolSection() {
  const { data: draw } = useQuery({ queryKey: ['latestDraw'], queryFn: drawService.getLatest });

  const tiers = [
    { match: 5, share: '40%', label: 'Jackpot', color: 'text-gold-400', border: 'border-gold-500/30', bg: 'bg-gold-500/10', note: 'Rolls over if unclaimed' },
    { match: 4, share: '35%', label: '4-Number Match', color: 'text-brand-400', border: 'border-brand-500/30', bg: 'bg-brand-500/10' },
    { match: 3, share: '25%', label: '3-Number Match', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  ];

  return (
    <section className="py-24 border-t border-white/10 bg-surface-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-title mb-4"
            >
              Three ways to <span className="text-gradient-gold">win every month</span>
            </motion.h2>
            <p className="section-subtitle mb-8">
              Every active subscriber is automatically entered. The more of your 5 scores that match the draw, the bigger your slice of the pool.
            </p>
            <Link to="/subscribe" className="btn-gold px-8 py-3.5 text-base inline-flex">
              See This Month's Draw →
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.match}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`flex items-center justify-between p-5 rounded-2xl border ${tier.border} ${tier.bg}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-mono font-bold text-sm ${tier.color}`}>
                    {tier.match}
                  </div>
                  <div>
                    <p className={`font-semibold ${tier.color}`}>{tier.label}</p>
                    {tier.note && <p className="text-xs text-white/40 mt-0.5">{tier.note}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-display font-bold ${tier.color}`}>{tier.share}</p>
                  <p className="text-xs text-white/40">of prize pool</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCharitiesSection() {
  const { data } = useQuery({
    queryKey: ['charities-featured'],
    queryFn: () => charityService.list({ page: 1, limit: 4 }),
  });

  return (
    <section className="py-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="section-title mb-3">
              Your subscription,{' '}
              <span className="text-gradient">their mission</span>
            </h2>
            <p className="text-white/50">10% of every subscription goes to the charity you choose. You can give more.</p>
          </div>
          <Link to="/charities" className="btn-secondary text-sm shrink-0">Browse All →</Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.charities || Array(4).fill(null)).map((charity, i) => (
            <motion.div
              key={charity?.id || i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-hover text-center group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-500/10 transition-colors">
                {charity?.logo_url
                  ? <img src={charity.logo_url} alt={charity.name} className="w-10 h-10 object-contain rounded-xl" />
                  : <span className="text-2xl">💚</span>
                }
              </div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                {charity?.name || '...'}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 border-t border-white/10">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-brand-500/20 bg-brand-500/5 p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Ready to play with purpose?
            </h2>
            <p className="text-white/55 mb-8 max-w-md mx-auto">
              Join thousands of golfers making every round count. Subscribe today and your very first draw entry is this month.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/subscribe" className="btn-primary px-10 py-4 text-base">
                Join Now — Monthly or Yearly
              </Link>
              <Link to="/charities" className="btn-secondary px-8 py-4 text-base">
                Choose Your Charity
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <PrizePoolSection />
      <FeaturedCharitiesSection />
      <CTASection />
    </>
  );
}
