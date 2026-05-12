'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, User, X, TreePine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui-store';
import { useTreeStore } from '@/stores/tree-store';
import { createClient } from '@/lib/supabase/client';
import { cn, getInitials } from '@/lib/utils';
import type { FamilyMember } from '@/types';

export default function SearchCommand() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const { currentFamily, selectMember } = useTreeStore();
  const { openProfile } = useUIStore();
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FamilyMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().toggleSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Search
  useEffect(() => {
    if (!query.trim() || !currentFamily) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase.rpc('search_family_members', {
        p_family_id: currentFamily.id,
        p_query: query.trim(),
      });

      if (data) setResults(data as FamilyMember[]);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, currentFamily, supabase]);

  // Navigate results with keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    },
    [results, selectedIndex, closeSearch]
  );

  const handleSelect = (member: FamilyMember) => {
    selectMember(member.id);
    openProfile();
    closeSearch();
    router.push('/tree');
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[60]"
          >
            <div className="glass-card overflow-hidden mx-4">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-white/10">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Cari nama anggota keluarga..."
                  className="flex-1 py-4 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-base"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors min-h-0 min-w-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto p-2">
                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!isSearching && query && results.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500">Tidak ditemukan anggota dengan nama tersebut</p>
                  </div>
                )}

                {!isSearching &&
                  results.map((member, index) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelect(member)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                        index === selectedIndex
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'text-slate-300 hover:bg-white/5'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          member.gender === 'male'
                            ? 'bg-indigo-500/15 text-indigo-300'
                            : 'bg-pink-500/15 text-pink-300'
                        )}
                      >
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {getInitials(member.full_name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.full_name}</p>
                        <p className="text-xs text-slate-500">
                          Generasi {member.generation}
                          {member.birth_place ? ` • ${member.birth_place}` : ''}
                        </p>
                      </div>
                      {!member.is_alive && (
                        <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                          Almarhum
                        </span>
                      )}
                    </button>
                  ))}

                {!query && (
                  <div className="text-center py-8">
                    <TreePine className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Ketik nama untuk mencari</p>
                    <p className="text-xs text-slate-600 mt-1">Gunakan ↑↓ untuk navigasi, Enter untuk memilih</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/5 px-4 py-2 flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  {results.length > 0 && `${results.length} hasil`}
                </p>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-white/5 rounded border border-white/10 text-slate-500">
                    ESC
                  </kbd>
                  <span className="text-[10px] text-slate-600">untuk menutup</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
