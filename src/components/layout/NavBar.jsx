import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, History, Database } from 'lucide-react';

export default function NavBar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-2xl mx-auto flex items-center justify-between px-5 h-13 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.9), rgba(236,72,153,0.9))' }}>
            <span className="text-[9px] font-bold text-white tracking-tight">SB</span>
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-tight">Support Brain</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/kb"
            className={`p-2 rounded-lg transition-colors ${
              isActive('/kb')
                ? 'text-primary bg-primary/15'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="Wissensdatenbank"
          >
            <Database className="w-4 h-4" />
          </Link>
          {!isHome && (
            <Link
              to="/history"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/history')
                  ? 'text-primary bg-primary/15'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <History className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/settings"
            className={`p-2 rounded-lg transition-colors ${
              isActive('/settings')
                ? 'text-secondary bg-secondary/15'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Heart className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}