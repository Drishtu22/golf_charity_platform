import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import useAuthStore from '@/context/authStore';
import { scoreService, subscriptionService, drawService } from '@/services';
import { StatCard, StatusBadge, Skeleton, EmptyState } from '@/components/common';

function SubscriptionCard({ status }) {
  return (
    <div className={`card border ${status?.subscription_status === 'active' ? 'border-brand-500/25 bg-brand-500/5' : 'border-white/10'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white/70">Subscription</p>
        <StatusBadge status={status?.subscription_status} />
      </div>
      <p className="text-xl font-display font-bold text-white capitalize">
        {status?.subscription_plan || 'No plan'}
      </p>
      {status?.subscription_renewal_date && (
        <p className="text-xs text-white/40 mt-1">
          Renews {format(new Date(status.subscription_renewal_date), 'dd MMM yyyy')}
        </p>
      )}
      {status?.subscription_status !== 'active' && (
        <Link to="/subscribe" className="btn-primary text-sm mt-4 w-full text-center block py-2">
          Activate Subscription →
        </Link>
      )}
    </div>
  );
}

function ScoresPreview({ scores, isLoading }) {
  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white/70">Recent Scores</p>
        <Link to="/dashboard/scores" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
      </div>
      {scores?.length ? (
        <div className="flex flex-wrap gap-2">
          {scores.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/8 min-w-[56px]">
              <span className="text-xl font-display font-bold text-white">{s.score_value}</span>
              <span className="text-[10px] text-white/40">{format(new Date(s.played_at), 'd MMM')}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="⛳" title="No scores yet" description="Log your first round to enter the draw." />
      )}
    </div>
  );
}

function LatestDrawCard({ draw }) {
  if (!draw) return null;
  return (
    <div className="card border border-gold-500/20 bg-gold-500/5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white/70">Latest Draw</p>
        <span className="badge-gold">{format(new Date(draw.draw_month), 'MMM yyyy')}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {(draw.draw_numbers || []).map((n, i) => (
          <div key={i} className="w-9 h-9 rounded-full border-2 border-gold-500/50 bg-gold-500/10 flex items-center justify-center text-gold-400 font-bold font-mono text-sm">
            {n}
          </div>
        ))}
      </div>
      {draw.jackpot_rolled_over > 0 && (
        <p className="text-xs text-gold-400/80 mt-1">🔄 Jackpot rolled over: £{draw.jackpot_rolled_over}</p>
      )}
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { data: scores, isLoading: scoresLoading } = useQuery({ queryKey: ['scores'], queryFn: scoreService.getMyScores });
  const { data: subStatus } = useQuery({ queryKey: ['subStatus'], queryFn: subscriptionService.getStatus });
  const { data: latestDraw } = useQuery({ queryKey: ['latestDraw'], queryFn: drawService.getLatest });

  return (
    <div>
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold text-white"
        >
          Good to see you, {user?.first_name} 👋
        </motion.h1>
        <p className="text-sm text-white/40 mt-1">Here's your GolfGives overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Scores Logged"
          value={scores?.length ?? '—'}
          icon="⛳"
          color="green"
          trend={`Out of 5 max. ${5 - (scores?.length || 0)} slot(s) remaining`}
        />
        <StatCard
          label="Charity Contribution"
          value={`${user?.charity_contribution_percent ?? 10}%`}
          icon="💚"
          color="green"
          trend={user?.charities?.name || 'No charity selected yet'}
        />
        <StatCard
          label="Subscription Plan"
          value={subStatus?.subscription_plan ? subStatus.subscription_plan.charAt(0).toUpperCase() + subStatus.subscription_plan.slice(1) : 'None'}
          icon="💳"
          color={subStatus?.subscription_status === 'active' ? 'green' : 'gold'}
          trend={subStatus?.subscription_status}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubscriptionCard status={subStatus} />
        <ScoresPreview scores={scores} isLoading={scoresLoading} />
        <LatestDrawCard draw={latestDraw} />

        <div className="card">
          <p className="text-sm font-medium text-white/70 mb-3">Quick Actions</p>
          <div className="flex flex-col gap-2">
            <Link to="/dashboard/scores" className="btn-secondary text-sm text-center w-full py-2.5">⛳ Log a Score</Link>
            <Link to="/dashboard/winnings" className="btn-secondary text-sm text-center w-full py-2.5">🏆 My Winnings</Link>
            <Link to="/charities" className="btn-secondary text-sm text-center w-full py-2.5">💚 Change Charity</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
