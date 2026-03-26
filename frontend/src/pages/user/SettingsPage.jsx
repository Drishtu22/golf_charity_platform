import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { userService, subscriptionService, charityService } from '@/services';
import useAuthStore from '@/context/authStore';
import { PageHeader, FormField, Spinner } from '@/components/common';

function ProfileSection() {
  const { user, fetchMe } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { first_name: user?.first_name, last_name: user?.last_name },
  });

  const mutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => { toast.success('Profile updated.'); fetchMe(); },
    onError: () => toast.error('Failed to update profile.'),
  });

  return (
    <div className="card">
      <h2 className="font-semibold text-white mb-5">Profile Information</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First name" error={errors.first_name?.message}>
            <input className="input-field" {...register('first_name', { required: 'Required.' })} />
          </FormField>
          <FormField label="Last name" error={errors.last_name?.message}>
            <input className="input-field" {...register('last_name', { required: 'Required.' })} />
          </FormField>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input-field opacity-50" value={user?.email} disabled readOnly />
          <p className="text-xs text-white/30 mt-1">Email cannot be changed.</p>
        </div>
        <button type="submit" className="btn-primary w-fit px-6 py-2.5" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner size="sm" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function PasswordSection() {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const mutation = useMutation({
    mutationFn: (d) => api.patch('/auth/change-password', d),
    onSuccess: () => { toast.success('Password updated.'); reset(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update password.'),
  });
  const newPass = watch('new_password');

  return (
    <div className="card">
      <h2 className="font-semibold text-white mb-5">Change Password</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4 max-w-sm">
        <FormField label="Current password" error={errors.current_password?.message}>
          <input type="password" className="input-field" {...register('current_password', { required: 'Required.' })} />
        </FormField>
        <FormField label="New password" error={errors.new_password?.message}>
          <input type="password" className="input-field" {...register('new_password', {
            required: 'Required.',
            minLength: { value: 8, message: 'Min 8 characters.' },
            pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Needs upper, lower & number.' },
          })} />
        </FormField>
        <FormField label="Confirm new password" error={errors.confirm?.message}>
          <input type="password" className="input-field" {...register('confirm', {
            validate: (v) => v === newPass || 'Passwords do not match.',
          })} />
        </FormField>
        <button type="submit" className="btn-primary w-fit px-6 py-2.5" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner size="sm" /> : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

function CharitySection() {
  const { user, fetchMe } = useAuthStore();
  const qc = useQueryClient();
  const { data: charitiesData } = useQuery({ queryKey: ['charities-all'], queryFn: () => charityService.list({ limit: 50 }) });
  const { register, handleSubmit } = useForm({
    defaultValues: { charity_id: user?.charity_id, contribution_percent: user?.charity_contribution_percent || 10 },
  });

  const mutation = useMutation({
    mutationFn: (d) => charityService.setMyCharity(d),
    onSuccess: () => { toast.success('Charity preference saved.'); fetchMe(); qc.invalidateQueries(['me']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save.'),
  });

  return (
    <div className="card">
      <h2 className="font-semibold text-white mb-5">Charity Preference</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate({ ...d, contribution_percent: Number(d.contribution_percent) }))} className="flex flex-col gap-4 max-w-sm">
        <FormField label="Selected Charity">
          <select className="input-field" {...register('charity_id')}>
            <option value="">— Select a charity —</option>
            {(charitiesData?.charities || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Contribution (min 10%)">
          <input type="number" min={10} max={100} className="input-field" {...register('contribution_percent')} />
        </FormField>
        <button type="submit" className="btn-primary w-fit px-6 py-2.5" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner size="sm" /> : 'Save Charity'}
        </button>
      </form>
    </div>
  );
}

function SubscriptionSection() {
  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancel,
    onSuccess: () => toast.success('Subscription will cancel at the end of this billing period.'),
    onError: () => toast.error('Failed to cancel subscription.'),
  });

  const portalMutation = useMutation({
    mutationFn: subscriptionService.openPortal,
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: () => toast.error('Failed to open billing portal.'),
  });

  return (
    <div className="card border border-white/10">
      <h2 className="font-semibold text-white mb-5">Subscription</h2>
      <div className="flex flex-wrap gap-3">
        <button className="btn-secondary text-sm px-5 py-2.5" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
          {portalMutation.isPending ? <Spinner size="sm" /> : 'Manage Billing ↗'}
        </button>
        <button
          className="text-sm px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? <Spinner size="sm" /> : 'Cancel Subscription'}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, charity, and subscription." />
      <div className="flex flex-col gap-5 max-w-2xl">
        <ProfileSection />
        <CharitySection />
        <PasswordSection />
        <SubscriptionSection />
      </div>
    </div>
  );
}
