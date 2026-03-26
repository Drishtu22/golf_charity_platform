import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { drawService } from '@/services';
import { PageHeader, StatusBadge, Spinner, Modal, FormField } from '@/components/common';

function CreateDrawModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ draw_month: '', draw_mode: 'random', weighted_bias: 'most' });

  const mutation = useMutation({
    mutationFn: drawService.create,
    onSuccess: () => { toast.success('Draw created!'); qc.invalidateQueries(['adminDraws']); onClose(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create draw.'),
  });

  return (
    <Modal isOpen title="Create New Draw" onClose={onClose} size="sm">
      <div className="flex flex-col gap-4">
        <FormField label="Draw Month">
          <input type="month" className="input-field" value={form.draw_month}
            onChange={(e) => setForm({ ...form, draw_month: e.target.value + '-01' })} />
        </FormField>
        <FormField label="Draw Mode">
          <select className="input-field" value={form.draw_mode} onChange={(e) => setForm({ ...form, draw_mode: e.target.value })}>
            <option value="random">Random</option>
            <option value="weighted">Weighted Algorithm</option>
          </select>
        </FormField>
        {form.draw_mode === 'weighted' && (
          <FormField label="Algorithm Bias">
            <select className="input-field" value={form.weighted_bias} onChange={(e) => setForm({ ...form, weighted_bias: e.target.value })}>
              <option value="most">Most Frequent Scores</option>
              <option value="least">Least Frequent Scores</option>
            </select>
          </FormField>
        )}
        <div className="flex gap-3 mt-2">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.draw_month}>
            {mutation.isPending ? <Spinner size="sm" /> : 'Create Draft'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SimulateModal({ drawId, onClose }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['simulate', drawId],
    queryFn: () => drawService.simulate(drawId),
    enabled: !!drawId,
  });

  return (
    <Modal isOpen title="Draw Simulation" onClose={onClose} size="sm">
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-white/40 mb-3 text-center">Simulated Draw Numbers</p>
            <div className="flex justify-center gap-3">
              {data.simulatedNumbers.map((n, i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-gold-500/50 bg-gold-500/10 flex items-center justify-center text-gold-400 font-bold font-mono text-base">
                  {n}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/20">
              <p className="text-gold-400 font-bold">£{data.pools.match5Pool.toFixed(2)}</p>
              <p className="text-white/40 mt-0.5">5-Match</p>
            </div>
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <p className="text-brand-400 font-bold">£{data.pools.match4Pool.toFixed(2)}</p>
              <p className="text-white/40 mt-0.5">4-Match</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-400 font-bold">£{data.pools.match3Pool.toFixed(2)}</p>
              <p className="text-white/40 mt-0.5">3-Match</p>
            </div>
          </div>
          <p className="text-xs text-white/30 text-center">{data.note}</p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm" onClick={() => refetch()}>Re-simulate</button>
            <button className="btn-secondary flex-1 text-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default function AdminDrawsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [simDrawId, setSimDrawId] = useState(null);

  const { data: draws = [], isLoading } = useQuery({
    queryKey: ['adminDraws'],
    queryFn: drawService.adminList,
  });

  const publishMutation = useMutation({
    mutationFn: drawService.publish,
    onSuccess: (result) => {
      toast.success(`Draw published! ${result.winners.match5.length} jackpot winner(s).`);
      qc.invalidateQueries(['adminDraws']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to publish draw.'),
  });

  return (
    <div>
      <PageHeader
        title="Draws"
        subtitle="Create, simulate and publish monthly draws."
        action={
          <button className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>
            + New Draw
          </button>
        }
      />

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
        ) : draws.length === 0 ? (
          <p className="text-center text-white/40 py-10">No draws created yet.</p>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr>
                <th className="table-header">Month</th>
                <th className="table-header">Mode</th>
                <th className="table-header">Pool</th>
                <th className="table-header">Numbers</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draws.map((draw) => (
                <tr key={draw.id} className="hover:bg-white/3 transition-colors">
                  <td className="table-cell font-medium text-white">
                    {format(new Date(draw.draw_month), 'MMMM yyyy')}
                  </td>
                  <td className="table-cell capitalize text-white/60">{draw.draw_mode}</td>
                  <td className="table-cell text-gold-400">£{(draw.total_pool + draw.jackpot_carry_over).toFixed(2)}</td>
                  <td className="table-cell">
                    {draw.draw_numbers ? (
                      <div className="flex gap-1">
                        {draw.draw_numbers.map((n, i) => (
                          <span key={i} className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-[10px] font-mono">
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-white/30">—</span>}
                  </td>
                  <td className="table-cell"><StatusBadge status={draw.status} /></td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {draw.status === 'draft' && (
                        <>
                          <button className="text-xs text-white/40 hover:text-white transition-colors" onClick={() => setSimDrawId(draw.id)}>
                            Simulate
                          </button>
                          <button
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                            onClick={() => publishMutation.mutate(draw.id)}
                            disabled={publishMutation.isPending}
                          >
                            {publishMutation.isPending ? '…' : 'Publish'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && <CreateDrawModal onClose={() => setCreateOpen(false)} />}
      {simDrawId && <SimulateModal drawId={simDrawId} onClose={() => setSimDrawId(null)} />}
    </div>
  );
}
