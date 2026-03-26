import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/context/authStore';

const adminNavItems = [
  { to: '/admin',            icon: '📊', label: 'Dashboard',  end: true },
  { to: '/admin/users',      icon: '👥', label: 'Users'               },
  { to: '/admin/draws',      icon: '🎯', label: 'Draws'               },
  { to: '/admin/charities',  icon: '💚', label: 'Charities'           },
  { to: '/admin/winners',    icon: '🏆', label: 'Winners'             },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <Link to="/admin" className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center text-xs font-bold text-black">A</div>
        <div>
          <span className="font-display font-semibold text-white text-sm">GolfGives</span>
          <span className="block text-[10px] text-gold-400 -mt-0.5 uppercase tracking-widest">Admin</span>
        </div>
      </Link>

      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-bold">
            {user?.first_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-gold-400">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
        <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white transition-colors">
          ← Public Site
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 transition-colors text-left">
          ⏻ Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden lg:flex w-64 bg-surface-50 border-r border-white/10 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 bg-surface-50 border-r border-white/10 z-50 lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-20 bg-surface-50/80 backdrop-blur border-b border-white/10 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white text-xl">☰</button>
          <span className="text-gold-400 text-xs font-mono uppercase tracking-widest">Admin</span>
          <div className="w-7 h-7 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 text-xs font-bold">
            {user?.first_name?.[0]}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
