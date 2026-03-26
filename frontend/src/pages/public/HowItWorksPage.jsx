import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const steps = [
  { n: '01', icon: '💳', title: 'Subscribe', body: 'Choose monthly (£9.99) or annual (£89.99). A portion of your subscription funds the monthly prize pool, and at least 10% goes to your chosen charity.' },
  { n: '02', icon: '⛳', title: 'Enter Your Scores', body: 'After each round, log your Stableford score (1–45). The platform keeps your last 5 scores — when you enter a new one, the oldest is automatically replaced.' },
  { n: '03', icon: '🎯', title: 'The Monthly Draw', body: 'Each month, 5 numbers are drawn (either randomly or via weighted algorithm). All active subscribers are automatically entered using their 5 most recent scores.' },
  { n: '04', icon: '🏆', title: 'Match & Win', body: 'Match 3 numbers → win 25% of the pool. Match 4 → win 35%. Match all 5 → win the 40% jackpot. Multiple winners split equally. The jackpot rolls over if nobody matches 5.' },
  { n: '05', icon: '✅', title: 'Claim Your Prize', body: 'Winners are notified and asked to submit a screenshot of their scores for verification. Once approved, prizes are paid out promptly.' },
  { n: '06', icon: '💚', title: 'Charity Receives Your Contribution', body: 'Every month, your nominated charity automatically receives your contribution — 10% minimum, or more if you choose. No action needed from you.' },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
          How GolfGives Works
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          From subscription to prize to charity impact — everything you need to know about the platform.
        </p>
      </div>

      <div className="flex flex-col gap-5 mb-16">
        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="card flex items-start gap-5"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-mono text-xs font-bold shrink-0 mt-0.5">
              {step.n}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{step.icon}</span>
                <h3 className="font-display font-semibold text-white">{step.title}</h3>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">{step.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Prize table */}
      <div className="card mb-12">
        <h2 className="font-display text-xl font-semibold text-white mb-4">Prize Pool Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Match</th>
                <th className="table-header">Pool Share</th>
                <th className="table-header">Jackpot Rollover?</th>
              </tr>
            </thead>
            <tbody>
              {[
                { match: '5 Numbers (Jackpot)', share: '40%', rollover: 'Yes — rolls to next month', color: 'text-gold-400' },
                { match: '4 Numbers', share: '35%', rollover: 'No', color: 'text-brand-400' },
                { match: '3 Numbers', share: '25%', rollover: 'No', color: 'text-blue-400' },
              ].map((row) => (
                <tr key={row.match}>
                  <td className={`table-cell font-medium ${row.color}`}>{row.match}</td>
                  <td className="table-cell">{row.share}</td>
                  <td className="table-cell text-white/50">{row.rollover}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center">
        <Link to="/subscribe" className="btn-primary px-10 py-4 text-base">
          Start Playing →
        </Link>
      </div>
    </div>
  );
}
