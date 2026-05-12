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
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/tree"
          className="flex items-center gap-2.5 text-lg font-bold text-gradient hover:opacity-80 transition-opacity"
        >
          <TreePine className="w-6 h-6 text-emerald-400" />
          <span className="hidden sm:inline">Silsilah Keluarga</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            title="Cari anggota keluarga (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline">Cari...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white/5 rounded border border-white/10 text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* User */}
          {userEmail && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400">
              <User className="w-4 h-4" />
              <span className="max-w-[120px] truncate">{userEmail}</span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
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
        <div className="md:hidden border-t border-white/10 py-3 animate-fade-in">
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
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          {userEmail && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 border-t border-white/5 mt-2 pt-2">
              <User className="w-5 h-5" />
              <span>{userEmail}</span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
