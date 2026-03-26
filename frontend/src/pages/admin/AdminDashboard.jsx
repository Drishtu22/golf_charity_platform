import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminService } from '@/services';
import { PageHeader, StatCard, StatusBadge, Skeleton } from '@/components/common';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getStats,
  });

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and key metrics." />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats?.totalUsers ?? '—'} icon="👥" color="green" />
          <StatCard label="Active Subscribers" value={stats?.activeSubscribers ?? '—'} icon="💳" color="green" />
          <StatCard label="Total Prize Pool" value={`£${(stats?.totalPrizePool || 0).toFixed(2)}`} icon="🏆" color="gold" />
          <StatCard label="Charity Contributions" value={`£${(stats?.totalCharityContributions || 0).toFixed(2)}`} icon="💚" color="green" />
        </div>
      )}

      {/* Recent Winners */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Recent Winners</h2>
        {!stats?.recentWinners?.length ? (
          <p className="text-sm text-white/40 py-6 text-center">No winners yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header">Winner</th>
                  <th className="table-header">Match</th>
                  <th className="table-header">Prize</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentWinners.map((w) => (
                  <tr key={w.id} className="hover:bg-white/3 transition-colors">
                    <td className="table-cell">
                      <p className="font-medium text-white">{w.users?.first_name} {w.users?.last_name}</p>
                      <p className="text-xs text-white/40">{w.users?.email}</p>
                    </td>
                    <td className="table-cell font-mono text-white/80">{w.match_tier}-Match</td>
                    <td className="table-cell text-gold-400 font-semibold">£{w.prize_amount?.toFixed(2)}</td>
                    <td className="table-cell"><StatusBadge status={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
