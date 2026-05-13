'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  TreePine,
  Map,
  LayoutDashboard,
  Search,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '/tree', label: 'Silsilah', icon: TreePine },
  { href: '/map', label: 'Peta Keluarga', icon: Map },
  { href: '/dashboard', label: 'Kelola Data', icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();
  const { openSearch } = useUIStore();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
    };
    getUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,15,26,0.85)] backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/tree"
          className="flex items-center gap-2.5 text-lg font-bold text-gradient hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ minHeight: 'unset' }}
        >
          <TreePine className="w-5 h-5 text-emerald-400" style={{ minHeight: 'unset', minWidth: 'unset' }} />
          <span className="hidden sm:inline text-base">Silsilah Keluarga</span>
        </Link>

        {/* Desktop Nav — centered */}
        <div className="hidden md:flex items-center gap-1 mx-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Search */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            title="Cari anggota keluarga (Ctrl+K)"
          >
            <Search className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
            <span className="hidden lg:inline text-xs">Cari...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white/5 rounded border border-white/10 text-slate-500" style={{ minHeight: 'unset', minWidth: 'unset' }}>
              Ctrl+K
            </kbd>
          </button>

          {/* User email — only show on large screens */}
          {userEmail && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-500" style={{ minHeight: 'unset' }}>
              <User className="w-3.5 h-3.5" style={{ minHeight: 'unset', minWidth: 'unset' }} />
              <span className="max-w-[100px] truncate">{userEmail}</span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] py-2 px-4 animate-fade-in bg-[rgba(10,15,26,0.95)]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                <Icon className="w-5 h-5" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                {link.label}
              </Link>
            );
          })}
          {userEmail && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 border-t border-white/5 mt-2 pt-2">
              <User className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
              <span className="truncate">{userEmail}</span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
