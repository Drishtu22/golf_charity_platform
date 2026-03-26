import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '@/context/authStore';
import { FormField, Spinner } from '@/components/common';

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    const result = await registerUser({
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
    });
    if (result.success) {
      toast.success('Account created! Welcome to GolfGives.');
      navigate('/subscribe');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-white/50 text-sm">Start playing golf with purpose today</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name" error={errors.first_name?.message} required>
                <input
                  className="input-field"
                  placeholder="Alex"
                  {...register('first_name', { required: 'Required.' })}
                />
              </FormField>
              <FormField label="Last name" error={errors.last_name?.message} required>
                <input
                  className="input-field"
                  placeholder="Smith"
                  {...register('last_name', { required: 'Required.' })}
                />
              </FormField>
            </div>

            <FormField label="Email address" error={errors.email?.message} required>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required.' })}
              />
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              <input
                type="password"
                className="input-field"
                placeholder="Min 8 chars, upper + lower + number"
                {...register('password', {
                  required: 'Password is required.',
                  minLength: { value: 8, message: 'Minimum 8 characters.' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Must contain uppercase, lowercase, and a number.',
                  },
                })}
              />
            </FormField>

            <FormField label="Confirm password" error={errors.confirm_password?.message} required>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                {...register('confirm_password', {
                  validate: (v) => v === password || 'Passwords do not match.',
                })}
              />
            </FormField>

            <p className="text-xs text-white/40">
              By registering you agree to our Terms of Service. A subscription is required to participate in draws.
            </p>

            <button type="submit" className="btn-primary w-full py-3.5" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
