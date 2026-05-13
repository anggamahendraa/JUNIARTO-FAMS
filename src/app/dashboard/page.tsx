'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  TreePine,
  MapPin,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import SearchCommand from '@/components/search/SearchCommand';
import { createClient } from '@/lib/supabase/client';
import { cn, formatDate, getInitials } from '@/lib/utils';
import type { Family, FamilyMember } from '@/types';

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // New family creation
  const [showNewFamily, setShowNewFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);

  // 1. Fetch families
  useEffect(() => {
    const fetchFamilies = async () => {
      setIsLoadingFamilies(true);
      try {
        const { data, error } = await supabase.from('families').select('*').order('name');
        if (error) {
          console.error('Error fetching families:', error.message);
        }
        if (data && data.length > 0) {
          setFamilies(data as Family[]);
          setCurrentFamily(data[0] as Family);
        } else {
          setFamilies([]);
          setCurrentFamily(null);
        }
      } catch (err) {
        console.error('Fetch families failed:', err);
      } finally {
        setIsLoadingFamilies(false);
      }
    };
    fetchFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch members when family changes
  useEffect(() => {
    if (!currentFamily) {
      setMembers([]);
      setIsLoadingMembers(false);
      return;
    }

    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', currentFamily.id)
          .order('generation')
          .order('full_name');

        if (error) console.error('Error fetching members:', error.message);
        setMembers((data as FamilyMember[]) || []);
      } catch (err) {
        console.error('Fetch members failed:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily]);

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.birth_place?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirm(null);
    }
  };

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) return;
    setIsCreatingFamily(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('families')
        .insert({ name: newFamilyName.trim(), created_by: user?.id })
        .select()
        .single();

      if (error) {
        alert('Gagal membuat keluarga: ' + error.message);
      } else if (data) {
        setFamilies((prev) => [...prev, data as Family]);
        setCurrentFamily(data as Family);
        setNewFamilyName('');
        setShowNewFamily(false);
      }
    } finally {
      setIsCreatingFamily(false);
    }
  };

  const stats = {
    total: members.length,
    alive: members.filter((m) => m.is_alive).length,
    withLocation: members.filter((m) => m.latitude && m.longitude).length,
    generations: new Set(members.map((m) => m.generation)).size,
  };

  // Global loading state
  const isLoading = isLoadingFamilies || isLoadingMembers;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Kelola Data Keluarga</h1>
              <p className="text-sm text-slate-400 mt-1">
                Tambah, ubah, dan hapus data anggota keluarga
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {families.length > 0 && (
                <select
                  value={currentFamily?.id || ''}
                  onChange={(e) => {
                    const f = families.find((f) => f.id === e.target.value);
                    if (f) setCurrentFamily(f);
                  }}
                  className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 min-w-[140px] focus:outline-none focus:border-emerald-500/50 transition-all"
                  style={{ minHeight: 'unset' }}
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id} className="bg-slate-800">
                      {f.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowNewFamily(!showNewFamily)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-all whitespace-nowrap"
                style={{ minHeight: 'unset' }}
                title="Buat keluarga baru"
              >
                <FolderPlus className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                <span className="hidden sm:inline">Keluarga Baru</span>
              </button>

              {currentFamily && (
                <Link
                  href="/dashboard/members/new"
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                  Tambah Anggota
                </Link>
              )}
            </div>
          </div>

          {/* Create new family inline form */}
          {showNewFamily && (
            <div className="stat-card p-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
              <input
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="Nama keluarga baru (contoh: Keluarga Juniarto)"
                className="flex-1 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateFamily}
                  disabled={isCreatingFamily || !newFamilyName.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all whitespace-nowrap"
                  style={{ minHeight: 'unset' }}
                >
                  {isCreatingFamily ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                  ) : (
                    <Plus className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                  )}
                  Buat
                </button>
                <button
                  onClick={() => { setShowNewFamily(false); setNewFamilyName(''); }}
                  className="px-3 py-2.5 bg-white/5 text-slate-400 text-sm rounded-lg hover:bg-white/10 transition-all"
                  style={{ minHeight: 'unset' }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        {isLoadingFamilies ? (
          /* Loading families */
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" style={{ minHeight: 'unset', minWidth: 'unset' }} />
            <p className="text-sm text-slate-500">Memuat data keluarga...</p>
          </div>
        ) : families.length === 0 ? (
          /* No families yet */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
              <TreePine className="w-9 h-9 text-emerald-400" style={{ minHeight: 'unset', minWidth: 'unset' }} />
            </div>
            <h2 className="text-lg font-bold text-slate-200 mb-2">Selamat Datang!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Anda belum memiliki data keluarga. Buat keluarga pertama Anda untuk mulai menambahkan anggota.
            </p>
            <button
              onClick={() => setShowNewFamily(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              <FolderPlus className="w-5 h-5" style={{ minHeight: 'unset', minWidth: 'unset' }} />
              Buat Keluarga Pertama
            </button>
          </div>
        ) : (
          /* Has families — show stats + members */
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {[
                { label: 'Total Anggota', value: stats.total, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Masih Hidup', value: stats.alive, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Lokasi Tercatat', value: stats.withLocation, icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Generasi', value: stats.generations, icon: TreePine, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              ].map((stat) => (
                <div key={stat.label} className="stat-card p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('p-1.5 rounded-lg', stat.bg)}>
                      <stat.icon className={cn('w-3.5 h-3.5', stat.color)} style={{ minHeight: 'unset', minWidth: 'unset' }} />
                    </div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-200">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" style={{ minHeight: 'unset', minWidth: 'unset' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari anggota..."
                className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              />
            </div>

            {/* Members List */}
            {isLoadingMembers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                <p className="text-sm text-slate-500">Memuat anggota keluarga...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
                  <Users className="w-7 h-7 text-slate-600" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                </div>
                <p className="text-slate-400 text-sm">
                  {searchQuery ? 'Tidak ditemukan anggota yang cocok' : 'Belum ada data anggota keluarga'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/dashboard/members/new"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                    Tambah Anggota Pertama
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="relative member-row p-4 flex items-center gap-4 group"
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border-2 overflow-hidden',
                        member.gender === 'male'
                          ? 'bg-indigo-500/15 border-indigo-500/30'
                          : 'bg-pink-500/15 border-pink-500/30'
                      )}
                    >
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className={cn(
                            'text-xs font-bold',
                            member.gender === 'male' ? 'text-indigo-300' : 'text-pink-300'
                          )}
                        >
                          {getInitials(member.full_name)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {member.full_name}
                        </p>
                        {!member.is_alive && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded flex-shrink-0">
                            Almarhum
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Gen {member.generation}
                        {member.birth_place ? ` · ${member.birth_place}` : ''}
                        {member.birth_date ? ` · ${formatDate(member.birth_date)}` : ''}
                      </p>
                    </div>

                    {/* Location indicator */}
                    <div className="flex-shrink-0" style={{ minHeight: 'unset', minWidth: 'unset' }}>
                      {member.latitude && member.longitude ? (
                        <MapPin className="w-4 h-4 text-emerald-400" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                      ) : (
                        <MapPin className="w-4 h-4 text-slate-700" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Link
                        href={`/dashboard/members/${member.id}/edit`}
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        title="Edit"
                        style={{ minHeight: 'unset', minWidth: 'unset' }}
                      >
                        <Pencil className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(member.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Hapus"
                        style={{ minHeight: 'unset', minWidth: 'unset' }}
                      >
                        <Trash2 className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                      </button>
                    </div>

                    {/* Delete confirmation */}
                    {deleteConfirm === member.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in z-10">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                        <span className="text-xs text-red-300 whitespace-nowrap">Yakin hapus?</span>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-400 transition-all"
                          style={{ minHeight: 'unset', minWidth: 'unset' }}
                        >
                          Ya
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-white/5 text-slate-300 text-xs rounded hover:bg-white/10 transition-all"
                          style={{ minHeight: 'unset', minWidth: 'unset' }}
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <SearchCommand />
    </div>
  );
}
