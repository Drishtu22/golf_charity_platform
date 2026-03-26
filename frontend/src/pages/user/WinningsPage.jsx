import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { userService } from '@/services';
import { PageHeader, StatusBadge, EmptyState, Spinner, Modal, FormField } from '@/components/common';

function WinningCard({ win, onSubmitProof }) {
  const tierColors = { 5: 'text-gold-400 border-gold-500/30 bg-gold-500/8', 4: 'text-brand-400 border-brand-500/30 bg-brand-500/8', 3: 'text-blue-400 border-blue-500/30 bg-blue-500/8' };
  const colors = tierColors[win.match_tier] || 'text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`card border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${colors}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{win.match_tier === 5 ? '🏆' : win.match_tier === 4 ? '🥇' : '🥉'}</div>
        <div>
          <p className="font-semibold text-white">
            {win.match_tier}-Number Match
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            {win.draws?.draw_month ? format(new Date(win.draws.draw_month), 'MMMM yyyy') : 'N/A'} Draw
          </p>
          {win.draws?.draw_numbers && (
            <div className="flex gap-1 mt-2">
              {win.draws.draw_numbers.map((n, i) => (
                <span key={i} className="w-6 h-6 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-[10px] font-mono text-white/60">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="text-2xl font-display font-bold text-white">£{win.prize_amount.toFixed(2)}</p>
        <StatusBadge status={win.status} />
        {win.status === 'pending_verification' && (
          <button
            className="btn-gold text-xs px-3 py-1.5 mt-1"
            onClick={() => onSubmitProof(win)}
          >
            Submit Proof →
          </button>
        )}
        {win.paid_at && (
          <p className="text-xs text-white/40">Paid {format(new Date(win.paid_at), 'dd MMM yyyy')}</p>
        )}
      </div>
    </motion.div>
  );
}

function ProofModal({ win, onClose }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const mutation = useMutation({
    mutationFn: () => userService.submitProof(win.id, url),
    onSuccess: () => {
      toast.success('Proof submitted! We\'ll review it shortly.');
      qc.invalidateQueries(['winnings']);
      onClose();
    },
    onError: () => toast.error('Failed to submit proof.'),
  });

  return (
    <Modal isOpen title="Submit Proof of Win" onClose={onClose} size="sm">
      <p className="text-sm text-white/50 mb-4">
        Please provide a link to a screenshot of your scores from your golf platform showing the matching scores for this draw.
      </p>
      <FormField label="Screenshot URL">
        <input
          type="url"
          className="input-field"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </FormField>
      <div className="flex gap-3 mt-4">
        <button className="btn-secondary flex-1 py-2.5 text-sm" onClick={onClose}>Cancel</button>
        <button
          className="btn-gold flex-1 py-2.5 text-sm"
          onClick={() => mutation.mutate()}
          disabled={!url || mutation.isPending}
        >
          {mutation.isPending ? <Spinner size="sm" /> : 'Submit'}
        </button>
      </div>
    </Modal>
  );
}

export default function WinningsPage() {
  const [proofWin, setProofWin] = useState(null);
  const { data: winnings = [], isLoading } = useQuery({
    queryKey: ['winnings'],
    queryFn: userService.getWinnings,
  });

  const totalWon = winnings.reduce((sum, w) => w.status === 'paid' ? sum + w.prize_amount : sum, 0);
  const pending = winnings.filter((w) => ['pending_verification', 'proof_submitted', 'approved'].includes(w.status));

  return (
    <div>
      <PageHeader title="My Winnings" subtitle="Your prize history and payout status." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-white/40 mb-1">Total Won</p>
          <p className="text-2xl font-display font-bold text-gold-400">£{totalWon.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-white/40 mb-1">Draw Wins</p>
          <p className="text-2xl font-display font-bold text-white">{winnings.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-white/40 mb-1">Pending</p>
          <p className="text-2xl font-display font-bold text-gold-400">{pending.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : winnings.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No wins yet"
          description="Keep logging scores and participating in draws — your win could be next month!"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {winnings.map((win) => (
            <WinningCard key={win.id} win={win} onSubmitProof={setProofWin} />
          ))}
        </div>
      )}

      {proofWin && <ProofModal win={proofWin} onClose={() => setProofWin(null)} />}
    </div>
  );
}
