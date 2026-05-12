'use client';

import { useEffect, useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Filter, ChevronDown, TreePine, Loader2 } from 'lucide-react';
import FamilyTreeCanvas from '@/components/tree/FamilyTreeCanvas';
import ProfileDrawer from '@/components/profile/ProfileDrawer';
import SearchCommand from '@/components/search/SearchCommand';
import Navbar from '@/components/layout/Navbar';
import { useTreeStore } from '@/stores/tree-store';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Family, FamilyMember } from '@/types';

export default function TreePage() {
  const supabase = createClient();
  const {
    families,
    currentFamily,
    setFamilies,
    setCurrentFamily,
    setMembers,
    generationRange,
    minGeneration,
    maxGeneration,
    setGenerationFilter,
  } = useTreeStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showFamilySelect, setShowFamilySelect] = useState(false);
  const [showGenFilter, setShowGenFilter] = useState(false);

  // Fetch families
  useEffect(() => {
    const fetchFamilies = async () => {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .order('name');

      if (!error && data) {
        setFamilies(data as Family[]);
        if (data.length > 0 && !currentFamily) {
          setCurrentFamily(data[0] as Family);
        }
      }
      setIsLoading(false);
    };

    fetchFamilies();
  }, [supabase, setFamilies, setCurrentFamily, currentFamily]);

  // Fetch members when family changes
  useEffect(() => {
    if (!currentFamily) return;

    const fetchMembers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', currentFamily.id)
        .order('generation')
        .order('birth_date');

      if (!error && data) {
        setMembers(data as FamilyMember[]);
      }
      setIsLoading(false);
    };

    fetchMembers();
  }, [currentFamily, supabase, setMembers]);

  const [minGen, maxGen] = generationRange;
  const generations = Array.from(
    { length: maxGen - minGen + 1 },
    (_, i) => minGen + i
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      {/* Toolbar */}
      <div className="glass fixed top-16 left-0 right-0 z-40 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          {/* Family Selector */}
          <div className="relative">
            <button
              onClick={() => setShowFamilySelect(!showFamilySelect)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 hover:bg-white/10 transition-all"
            >
              <TreePine className="w-4 h-4 text-emerald-400" />
              {currentFamily?.name || 'Pilih Keluarga'}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFamilySelect && (
              <div className="absolute top-full left-0 mt-2 w-64 glass-card p-2 z-50 animate-fade-in">
                {families.map((family) => (
                  <button
                    key={family.id}
                    onClick={() => {
                      setCurrentFamily(family);
                      setShowFamilySelect(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                      currentFamily?.id === family.id
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-slate-300 hover:bg-white/5'
                    )}
                  >
                    {family.name}
                  </button>
                ))}
                {families.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-500">Belum ada data keluarga</p>
                )}
              </div>
            )}
          </div>

          {/* Generation Filter */}
          <div className="relative">
            <button
              onClick={() => setShowGenFilter(!showGenFilter)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 hover:bg-white/10 transition-all"
            >
              <Filter className="w-4 h-4 text-emerald-400" />
              {minGeneration || maxGeneration
                ? `Gen ${minGeneration || minGen}–${maxGeneration || maxGen}`
                : 'Semua Generasi'}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showGenFilter && (
              <div className="absolute top-full left-0 mt-2 w-56 glass-card p-3 z-50 animate-fade-in">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
                  Filter Generasi
                </p>
                <button
                  onClick={() => {
                    setGenerationFilter(null, null);
                    setShowGenFilter(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-1',
                    !minGeneration && !maxGeneration
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-slate-300 hover:bg-white/5'
                  )}
                >
                  Semua Generasi
                </button>
                {generations.map((gen) => (
                  <button
                    key={gen}
                    onClick={() => {
                      setGenerationFilter(gen, gen);
                      setShowGenFilter(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                      minGeneration === gen && maxGeneration === gen
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-slate-300 hover:bg-white/5'
                    )}
                  >
                    Generasi {gen}
                  </button>
                ))}
                {/* Range selection */}
                <div className="border-t border-white/5 mt-2 pt-2 space-y-2">
                  <p className="text-xs text-slate-500">Rentang Generasi</p>
                  <div className="flex gap-2">
                    <select
                      value={minGeneration ?? ''}
                      onChange={(e) =>
                        setGenerationFilter(
                          e.target.value ? Number(e.target.value) : null,
                          maxGeneration
                        )
                      }
                      className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200"
                    >
                      <option value="">Dari</option>
                      {generations.map((g) => (
                        <option key={g} value={g}>
                          Gen {g}
                        </option>
                      ))}
                    </select>
                    <select
                      value={maxGeneration ?? ''}
                      onChange={(e) =>
                        setGenerationFilter(
                          minGeneration,
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200"
                    >
                      <option value="">Sampai</option>
                      {generations.map((g) => (
                        <option key={g} value={g}>
                          Gen {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <main className="flex-1 pt-[120px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Memuat silsilah keluarga...</p>
            </div>
          </div>
        ) : (
          <ReactFlowProvider>
            <FamilyTreeCanvas />
          </ReactFlowProvider>
        )}
      </main>

      {/* Profile Drawer */}
      <ProfileDrawer />

      {/* Search */}
      <SearchCommand />
    </div>
  );
}
