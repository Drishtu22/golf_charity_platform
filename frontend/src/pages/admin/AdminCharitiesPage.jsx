import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { charityService } from '@/services';
import { PageHeader, Spinner, Modal, FormField, ConfirmDialog, EmptyState } from '@/components/common';

const emptyForm = { name: '', description: '', logo_url: '', website_url: '', is_featured: false };

function CharityFormModal({ charity, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!charity;
  const [form, setForm] = useState(charity ? {
    name: charity.name,
    description: charity.description || '',
    logo_url: charity.logo_url || '',
    website_url: charity.website_url || '',
    is_featured: charity.is_featured || false,
  } : emptyForm);

  const mutation = useMutation({
    mutationFn: isEdit ? (d) => charityService.update(charity.id, d) : charityService.create,
    onSuccess: () => {
      toast.success(isEdit ? 'Charity updated.' : 'Charity created.');
      qc.invalidateQueries(['adminCharities']);
      onClose();
    },
    onError: () => toast.error('Failed to save charity.'),
  });

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <Modal isOpen title={isEdit ? 'Edit Charity' : 'Add Charity'} onClose={onClose} size="md">
      <div className="flex flex-col gap-4">
        <FormField label="Charity Name" required>
          <input className="input-field" placeholder="e.g. British Heart Foundation" {...field('name')} />
        </FormField>
        <FormField label="Description">
          <textarea className="input-field resize-none" rows={3} placeholder="Brief description…" {...field('description')} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Logo URL">
            <input className="input-field" placeholder="https://…" {...field('logo_url')} />
          </FormField>
          <FormField label="Website URL">
            <input className="input-field" placeholder="https://…" {...field('website_url')} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            className="w-4 h-4 accent-brand-500"
          />
          <span className="text-sm text-white/70">Feature on homepage</span>
        </label>
        <div className="flex gap-3 mt-2">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary flex-1"
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.name.trim()}
          >
            {mutation.isPending ? <Spinner size="sm" /> : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminCharitiesPage() {
  const qc = useQueryClient();
  const [modalCharity, setModalCharity] = useState(undefined); // undefined = closed, null = create, obj = edit
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminCharities'],
    queryFn: () => charityService.list({ limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: charityService.delete,
    onSuccess: () => { toast.success('Charity removed.'); qc.invalidateQueries(['adminCharities']); },
    onError: () => toast.error('Failed to remove charity.'),
  });

  return (
    <div>
      <PageHeader
        title="Charities"
        subtitle="Manage the charity directory."
        action={
          <button className="btn-primary text-sm" onClick={() => setModalCharity(null)}>
            + Add Charity
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !data?.charities?.length ? (
        <EmptyState
          icon="💚"
          title="No charities yet"
          description="Add your first charity to the directory."
          action={<button className="btn-primary text-sm mt-2" onClick={() => setModalCharity(null)}>Add Charity</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.charities.map((charity) => (
            <div key={charity.id} className="card flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {charity.logo_url
                    ? <img src={charity.logo_url} alt={charity.name} className="w-9 h-9 object-contain rounded-lg" />
                    : <span className="text-xl">💚</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white text-sm truncate">{charity.name}</p>
                    {charity.is_featured && <span className="badge-gold text-[10px]">Featured</span>}
                  </div>
                  {charity.description && (
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{charity.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1 border-t border-white/8">
                <button
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  onClick={() => setModalCharity(charity)}
                >
                  Edit
                </button>
                <button
                  className="text-xs text-white/30 hover:text-red-400 transition-colors ml-2"
                  onClick={() => setDeleteId(charity.id)}
                >
                  Remove
                </button>
                {charity.website_url && (
                  <a
                    href={charity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/30 hover:text-white transition-colors ml-auto"
                  >
                    Visit ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal: modalCharity === null → create, object → edit */}
      {modalCharity !== undefined && (
        <CharityFormModal
          charity={modalCharity || undefined}
          onClose={() => setModalCharity(undefined)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Remove Charity?"
        message="This will soft-delete the charity and remove it from the public directory. Users with this charity selected will keep their preference."
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
