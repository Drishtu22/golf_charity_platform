import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/context/authStore';

const navLinks = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/charities', label: 'Charities' },
];

export default function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-sm font-bold">
              G
            </div>
            <span className="font-display font-semibold text-white group-hover:text-brand-400 transition-colors">
              GolfGives
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive ? 'text-brand-400 bg-brand-500/10' : 'text-white/60 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>
                <button onClick={handleLogout} className="btn-secondary text-sm px-4 py-2">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/subscribe" className="btn-primary text-sm px-4 py-2">
                  Join Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-surface/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-2"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/70 hover:text-white py-2 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="divider my-2" />
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm text-center">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary text-sm">Log Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm text-center">
                    Sign In
                  </Link>
                  <Link to="/subscribe" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">
                    Join Now
                  </Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Page Content ───────────────────────────────────────────── */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-sm font-bold">G</div>
                <span className="font-display font-semibold text-white">GolfGives</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                Play golf. Win prizes. Change lives. A subscription platform where every swing supports a cause you care about.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Platform</p>
              <div className="flex flex-col gap-2">
                {navLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="text-sm text-white/50 hover:text-white transition-colors">{l.label}</Link>
                ))}
                <Link to="/subscribe" className="text-sm text-white/50 hover:text-white transition-colors">Subscribe</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Account</p>
              <div className="flex flex-col gap-2">
                <Link to="/login" className="text-sm text-white/50 hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="text-sm text-white/50 hover:text-white transition-colors">Register</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-xs text-white/30">© {new Date().getFullYear()} GolfGives. All rights reserved.</p>
            <p className="text-xs text-white/30">Built by Digital Heroes · digitalheroes.co.in</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
