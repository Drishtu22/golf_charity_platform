import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '@/services';
import { PageHeader, StatusBadge, Spinner, EmptyState, ConfirmDialog } from '@/components/common';

const STATUS_FILTERS = [
  { label: 'All',           value: ''                    },
  { label: 'Pending',       value: 'pending_verification' },
  { label: 'Proof In',      value: 'proof_submitted'      },
  { label: 'Approved',      value: 'approved'             },
  { label: 'Rejected',      value: 'rejected'             },
  { label: 'Paid',          value: 'paid'                 },
];

export default function AdminWinnersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { id, action: 'approve'|'reject'|'paid' }

  const { data: winners = [], isLoading } = useQuery({
    queryKey: ['adminWinners', filter],
    queryFn: () => adminService.listWinners(filter ? { status: filter } : {}),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, action }) => adminService.verifyWinner(id, action),
    onSuccess: (_, vars) => {
      toast.success(`Winner ${vars.action === 'approve' ? 'approved' : 'rejected'}.`);
      qc.invalidateQueries(['adminWinners']);
    },
    onError: () => toast.error('Action failed.'),
  });

  const paidMutation = useMutation({
    mutationFn: (id) => adminService.markPaid(id),
    onSuccess: () => { toast.success('Marked as paid.'); qc.invalidateQueries(['adminWinners']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const tierLabel = (tier) => ({ 5: 'Jackpot', 4: '4-Match', 3: '3-Match' }[tier] || `${tier}-Match`);
  const tierColor = (tier) => ({ 5: 'text-gold-400', 4: 'text-brand-400', 3: 'text-blue-400' }[tier] || '');

  return (
    <div>
      <PageHeader title="Winners" subtitle="Review, verify and pay out prize winners." />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === f.value
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                : 'border-white/15 text-white/50 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : winners.length === 0 ? (
        <EmptyState icon="🏆" title="No winners found" description="Winners will appear here after draws are published." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr>
                <th className="table-header">Winner</th>
                <th className="table-header">Draw</th>
                <th className="table-header">Tier</th>
                <th className="table-header">Prize</th>
                <th className="table-header">Status</th>
                <th className="table-header">Proof</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w) => (
                <tr key={w.id} className="hover:bg-white/3 transition-colors">
                  <td className="table-cell">
                    <p className="font-medium text-white">{w.users?.first_name} {w.users?.last_name}</p>
                    <p className="text-xs text-white/40">{w.users?.email}</p>
                  </td>
                  <td className="table-cell text-white/60 text-xs">
                    {w.draws?.draw_month ? format(new Date(w.draws.draw_month), 'MMM yyyy') : '—'}
                  </td>
                  <td className={`table-cell font-semibold ${tierColor(w.match_tier)}`}>
                    {tierLabel(w.match_tier)}
                  </td>
                  <td className="table-cell text-gold-400 font-semibold">
                    £{w.prize_amount?.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="table-cell">
                    {w.proof_url ? (
                      <a
                        href={w.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        View ↗
                      </a>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2 flex-wrap">
                      {w.status === 'proof_submitted' && (
                        <>
                          <button
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                            onClick={() => setConfirmAction({ id: w.id, action: 'approve' })}
                          >
                            Approve
                          </button>
                          <button
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            onClick={() => setConfirmAction({ id: w.id, action: 'reject' })}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {w.status === 'approved' && (
                        <button
                          className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                          onClick={() => setConfirmAction({ id: w.id, action: 'paid' })}
                          disabled={paidMutation.isPending}
                        >
                          Mark Paid
                        </button>
                      )}
                      {w.paid_at && (
                        <span className="text-xs text-white/30">
                          Paid {format(new Date(w.paid_at), 'dd MMM')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={confirmAction?.action === 'approve'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => verifyMutation.mutate({ id: confirmAction.id, action: 'approve' })}
        title="Approve Winner?"
        message="This confirms the winner's submission is valid and marks them for payout."
        confirmLabel="Approve"
      />
      <ConfirmDialog
        isOpen={confirmAction?.action === 'reject'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => verifyMutation.mutate({ id: confirmAction.id, action: 'reject' })}
        title="Reject Submission?"
        message="The winner's proof will be marked as rejected. They will need to resubmit."
        confirmLabel="Reject"
        danger
      />
      <ConfirmDialog
        isOpen={confirmAction?.action === 'paid'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => paidMutation.mutate(confirmAction.id)}
        title="Mark as Paid?"
        message="Confirm you have sent the prize payment to this winner. This action cannot be undone."
        confirmLabel="Confirm Payment"
      />
    </div>
  );
}
