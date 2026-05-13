'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TreePine, Mail, Lock, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/tree';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Email atau kata sandi salah. Silakan coba lagi.');
        } else if (authError.message.includes('Failed to fetch') || authError.message.includes('fetch')) {
          setError('Tidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil dan konfigurasi Supabase sudah benar.');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui';
      if (message.includes('Konfigurasi Supabase')) {
        setError('Konfigurasi server belum lengkap. Hubungi administrator.');
      } else {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-mesh">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 mb-5 animate-float">
            <TreePine className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Silsilah Keluarga</h1>
          <p className="text-slate-400 mt-3 text-sm">Masuk untuk melihat pohon keluarga Anda</p>
        </div>

        {/* Login Card */}
        <div className="login-card p-8 sm:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white/[0.06] transition-all duration-200 text-base"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-14 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white/[0.06] transition-all duration-200 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-all duration-200"
                  style={{ minHeight: 'unset', minWidth: 'unset' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-emerald-600/50 disabled:to-emerald-600/50 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:shadow-none text-base active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          Hubungi administrator untuk mendapatkan akun
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
