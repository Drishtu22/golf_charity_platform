import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '@/services';
import { PageHeader, StatusBadge, Pagination, Spinner, Modal, FormField } from '@/components/common';

function EditUserModal({ user, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ first_name: user.first_name, last_name: user.last_name, is_active: user.is_active });

  const mutation = useMutation({
    mutationFn: (d) => adminService.updateUser(user.id, d),
    onSuccess: () => { toast.success('User updated.'); qc.invalidateQueries(['adminUsers']); onClose(); },
    onError: () => toast.error('Failed to update user.'),
  });

  return (
    <Modal isOpen title="Edit User" onClose={onClose} size="sm">
      <div className="flex flex-col gap-4">
        <FormField label="First name">
          <input className="input-field" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </FormField>
        <FormField label="Last name">
          <input className="input-field" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </FormField>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 accent-brand-500" />
          <span className="text-sm text-white/70">Account Active</span>
        </label>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner size="sm" /> : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, search],
    queryFn: () => adminService.listUsers({ page, limit: 20, search }),
    keepPreviousData: true,
  });

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage all platform members." />

      <div className="mb-4">
        <input
          className="input-field max-w-sm"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Subscription</th>
                <th className="table-header">Charity</th>
                <th className="table-header">Joined</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map((user) => (
                <tr key={user.id} className="hover:bg-white/3 transition-colors">
                  <td className="table-cell">
                    <p className="font-medium text-white">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-white/40">{user.email}</p>
                    {!user.is_active && <span className="badge-red text-[10px] mt-0.5">Deactivated</span>}
                  </td>
                  <td className="table-cell capitalize text-white/70">{user.subscription_plan || '—'}</td>
                  <td className="table-cell"><StatusBadge status={user.subscription_status} /></td>
                  <td className="table-cell text-white/60 text-xs">{user.charities?.name || '—'}</td>
                  <td className="table-cell text-white/40 text-xs">{format(new Date(user.created_at), 'dd MMM yyyy')}</td>
                  <td className="table-cell">
                    <button className="text-brand-400 hover:text-brand-300 text-xs transition-colors" onClick={() => setEditUser(user)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={data?.total || 0} limit={20} onPageChange={setPage} />
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
}
