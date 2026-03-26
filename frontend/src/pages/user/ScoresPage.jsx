import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { scoreService } from '@/services';
import { PageHeader, FormField, EmptyState, Spinner, ConfirmDialog } from '@/components/common';

function ScoreCard({ score, onEdit, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="card flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <span className="text-2xl font-display font-bold text-brand-400">{score.score_value}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">Stableford Score</p>
          <p className="text-xs text-white/40 mt-0.5">{format(new Date(score.played_at), 'EEEE, d MMMM yyyy')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(score)}
          className="text-xs text-white/40 hover:text-white transition-colors px-2 py-1"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(score.id)}
          className="text-xs text-white/40 hover:text-red-400 transition-colors px-2 py-1"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
}

function ScoreForm({ onSubmit, isLoading, defaultValues, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues });

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Stableford Score (1–45)" error={errors.score_value?.message} required>
          <input
            type="number"
            min={1} max={45}
            className="input-field"
            placeholder="e.g. 28"
            {...register('score_value', {
              required: 'Score is required.',
              min: { value: 1, message: 'Min score is 1.' },
              max: { value: 45, message: 'Max score is 45.' },
              valueAsNumber: true,
            })}
          />
        </FormField>

        <FormField label="Date Played" error={errors.played_at?.message} required>
          <input
            type="date"
            className="input-field"
            max={new Date().toISOString().split('T')[0]}
            {...register('played_at', { required: 'Date is required.' })}
          />
        </FormField>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1 py-2.5" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : defaultValues ? 'Update Score' : 'Add Score'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary px-4 py-2.5" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function ScoresPage() {
  const qc = useQueryClient();
  const [editingScore, setEditingScore] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['scores'],
    queryFn: scoreService.getMyScores,
  });

  const addMutation = useMutation({
    mutationFn: scoreService.addScore,
    onSuccess: () => { toast.success('Score added!'); qc.invalidateQueries(['scores']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add score.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => scoreService.updateScore(id, data),
    onSuccess: () => { toast.success('Score updated!'); qc.invalidateQueries(['scores']); setEditingScore(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update score.'),
  });

  const deleteMutation = useMutation({
    mutationFn: scoreService.deleteScore,
    onSuccess: () => { toast.success('Score deleted.'); qc.invalidateQueries(['scores']); },
    onError: () => toast.error('Failed to delete score.'),
  });

  const handleAdd = (data) => addMutation.mutate(data);
  const handleUpdate = (data) => updateMutation.mutate({ id: editingScore.id, ...data });
  const handleDelete = () => deleteMutation.mutate(deleteId);

  return (
    <div>
      <PageHeader
        title="My Scores"
        subtitle="Track your last 5 Stableford scores. Adding a 6th automatically removes the oldest."
      />

      {/* Progress indicator */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white/70">Score Slots Used</p>
          <p className="text-sm font-mono text-white">{scores.length} / 5</p>
        </div>
        <div className="flex gap-1.5">
          {Array(5).fill(0).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < scores.length ? 'bg-brand-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        {scores.length === 5 && (
          <p className="text-xs text-gold-400 mt-2">
            ⚡ All 5 slots filled — next score will replace the oldest.
          </p>
        )}
      </div>

      {/* Add / Edit Form */}
      <div className="card mb-6">
        <h2 className="text-sm font-medium text-white/70 mb-4">
          {editingScore ? 'Edit Score' : 'Log a New Score'}
        </h2>
        {editingScore ? (
          <ScoreForm
            defaultValues={{ score_value: editingScore.score_value, played_at: editingScore.played_at }}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            onCancel={() => setEditingScore(null)}
          />
        ) : (
          <ScoreForm onSubmit={handleAdd} isLoading={addMutation.isPending} />
        )}
      </div>

      {/* Score List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : scores.length === 0 ? (
        <EmptyState icon="⛳" title="No scores logged yet" description="Add your first Stableford score to start participating in draws." />
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {scores.map((score) => (
              <ScoreCard
                key={score.id}
                score={score}
                onEdit={setEditingScore}
                onDelete={setDeleteId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Score?"
        message="This will permanently remove this score from your record."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
