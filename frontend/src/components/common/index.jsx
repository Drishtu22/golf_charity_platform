import { motion } from 'framer-motion';
import clsx from 'clsx';

// ─── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg
      className={clsx('animate-spin text-brand-500', sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    active:               'badge-green',
    trialing:             'badge-blue',
    inactive:             'badge-gray',
    cancelling:           'badge-gold',
    cancelled:            'badge-red',
    lapsed:               'badge-red',
    past_due:             'badge-red',
    pending_verification: 'badge-gold',
    proof_submitted:      'badge-blue',
    approved:             'badge-green',
    rejected:             'badge-red',
    paid:                 'badge-green',
    draft:                'badge-gray',
    published:            'badge-green',
  };
  return (
    <span className={map[status] || 'badge-gray'}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-lg font-medium text-white/80">{title}</p>
      {description && <p className="text-sm text-white/40 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return (
    <div className={clsx('animate-pulse bg-white/10 rounded-lg', className)} />
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, trend, color = 'green' }) {
  const colors = {
    green: 'text-brand-400',
    gold:  'text-gold-400',
    blue:  'text-blue-400',
    red:   'text-red-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50 mb-1">{label}</p>
          <p className={clsx('text-3xl font-display font-bold', colors[color])}>{value}</p>
          {trend && <p className="text-xs text-white/40 mt-1">{trend}</p>}
        </div>
        {icon && (
          <div className={clsx('text-2xl p-2 rounded-xl bg-white/5', colors[color])}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={clsx('relative w-full card z-10', sizes[size])}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-white/60 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary text-sm px-4 py-2" onClick={onClose}>Cancel</button>
        <button
          className={clsx('text-sm px-4 py-2 rounded-xl font-medium transition-all', danger
            ? 'bg-red-500 hover:bg-red-400 text-white'
            : 'btn-primary')}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ─── Form Field Wrapper ────────────────────────────────────────────────────────
export function FormField({ label, error, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-30"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        ← Prev
      </button>
      <span className="text-sm text-white/50">Page {page} of {totalPages}</span>
      <button
        className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-30"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next →
      </button>
    </div>
  );
}
