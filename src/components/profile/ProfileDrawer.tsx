'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, MapPin, Calendar, Heart, Phone, Mail, BookOpen, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreeStore } from '@/stores/tree-store';
import { useUIStore } from '@/stores/ui-store';
import { cn, formatDate, getAge, getInitials } from '@/lib/utils';
import ProfileMiniMap from './MiniMap';
import type { FamilyMember } from '@/types';

export default function ProfileDrawer() {
  const { isProfileOpen, closeProfile } = useUIStore();
  const { selectedMemberId, members } = useTreeStore();

  const member = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  // Find relations
  const father = useMemo(
    () => (member?.father_id ? members.find((m) => m.id === member.father_id) : null),
    [member, members]
  );
  const mother = useMemo(
    () => (member?.mother_id ? members.find((m) => m.id === member.mother_id) : null),
    [member, members]
  );
  const spouse = useMemo(
    () => (member?.spouse_id ? members.find((m) => m.id === member.spouse_id) : null),
    [member, members]
  );
  const children = useMemo(
    () =>
      member
        ? members.filter(
            (m) => m.father_id === member.id || m.mother_id === member.id
          )
        : [],
    [member, members]
  );
  const siblings = useMemo(
    () =>
      member
        ? members.filter(
            (m) =>
              m.id !== member.id &&
              ((member.father_id && m.father_id === member.father_id) ||
                (member.mother_id && m.mother_id === member.mother_id))
          )
        : [],
    [member, members]
  );

  const age = member ? getAge(member.birth_date, member.death_date) : null;

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProfile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeProfile]);

  if (!member) return null;

  const isMale = member.gender === 'male';

  return (
    <AnimatePresence>
      {isProfileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProfile}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 overflow-y-auto bg-[var(--color-bg-secondary)] border-l border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Profil Anggota</h2>
              <button
                onClick={closeProfile}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 flex-shrink-0',
                    isMale ? 'border-indigo-500/50 bg-indigo-500/15' : 'border-pink-500/50 bg-pink-500/15'
                  )}
                >
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={cn('text-2xl font-bold', isMale ? 'text-indigo-300' : 'text-pink-300')}>
                      {getInitials(member.full_name)}
                    </span>
                  )}
                  {/* Status */}
                  <div
                    className={cn(
                      'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-[var(--color-bg-secondary)] flex items-center justify-center',
                      member.is_alive ? 'bg-emerald-400' : 'bg-red-400'
                    )}
                  >
                    {member.is_alive ? (
                      <Heart className="w-2.5 h-2.5 text-white fill-white" />
                    ) : (
                      <X className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-100 leading-tight">{member.full_name}</h3>
                  {member.nickname && (
                    <p className="text-sm text-slate-400 mt-0.5">&quot;{member.nickname}&quot;</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-md text-xs font-medium',
                        isMale ? 'bg-indigo-500/15 text-indigo-300' : 'bg-pink-500/15 text-pink-300'
                      )}
                    >
                      {isMale ? 'Laki-laki' : 'Perempuan'}
                    </span>
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-400">
                      Generasi {member.generation}
                    </span>
                    {age !== null && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-400">
                        {member.is_alive ? `${age} tahun` : `Wafat usia ${age} tahun`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Birth/Death Info */}
              <div className="glass-card p-4 space-y-3 hover:transform-none hover:shadow-none">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Tempat & Tanggal Lahir</p>
                    <p className="text-sm text-slate-200 mt-0.5">
                      {member.birth_place ? `${member.birth_place}, ` : ''}
                      {formatDate(member.birth_date)}
                    </p>
                  </div>
                </div>

                {!member.is_alive && member.death_date && (
                  <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                    <Calendar className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Tanggal Wafat</p>
                      <p className="text-sm text-slate-200 mt-0.5">{formatDate(member.death_date)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              {(member.phone || member.email) && (
                <div className="glass-card p-4 space-y-3 hover:transform-none hover:shadow-none">
                  {member.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <a href={`tel:${member.phone}`} className="text-sm text-slate-200 hover:text-emerald-400 transition-colors">
                        {member.phone}
                      </a>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <a href={`mailto:${member.email}`} className="text-sm text-slate-200 hover:text-emerald-400 transition-colors truncate">
                        {member.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Biography */}
              {member.biography && (
                <div className="glass-card p-4 hover:transform-none hover:shadow-none">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Biografi</p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {member.biography}
                  </p>
                </div>
              )}

              {/* Relationships */}
              <div className="glass-card p-4 hover:transform-none hover:shadow-none">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Hubungan Keluarga</p>
                </div>
                <div className="space-y-2">
                  {father && (
                    <RelationBadge label="Ayah" name={father.full_name} gender="male" />
                  )}
                  {mother && (
                    <RelationBadge label="Ibu" name={mother.full_name} gender="female" />
                  )}
                  {spouse && (
                    <RelationBadge
                      label={isMale ? 'Istri' : 'Suami'}
                      name={spouse.full_name}
                      gender={spouse.gender}
                    />
                  )}
                  {siblings.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Saudara ({siblings.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {siblings.map((s) => (
                          <span
                            key={s.id}
                            className={cn(
                              'px-2 py-1 rounded-md text-xs',
                              s.gender === 'male'
                                ? 'bg-indigo-500/10 text-indigo-300'
                                : 'bg-pink-500/10 text-pink-300'
                            )}
                          >
                            {s.full_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {children.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Anak ({children.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {children.map((c) => (
                          <span
                            key={c.id}
                            className={cn(
                              'px-2 py-1 rounded-md text-xs',
                              c.gender === 'male'
                                ? 'bg-indigo-500/10 text-indigo-300'
                                : 'bg-pink-500/10 text-pink-300'
                            )}
                          >
                            {c.full_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!father && !mother && !spouse && siblings.length === 0 && children.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Belum ada data hubungan keluarga</p>
                  )}
                </div>
              </div>

              {/* Location Map */}
              {member.latitude && member.longitude && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                      {member.is_alive ? 'Lokasi Tempat Tinggal' : 'Lokasi Pemakaman'}
                    </p>
                  </div>
                  {member.address && (
                    <p className="text-sm text-slate-300 mb-3">{member.address}</p>
                  )}
                  <ProfileMiniMap
                    latitude={member.latitude}
                    longitude={member.longitude}
                    label={member.full_name}
                    isAlive={member.is_alive}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RelationBadge({
  label,
  name,
  gender,
}: {
  label: string;
  name: string;
  gender: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-12 text-right flex-shrink-0">{label}</span>
      <span
        className={cn(
          'px-2 py-1 rounded-md text-xs font-medium',
          gender === 'male' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-pink-500/10 text-pink-300'
        )}
      >
        {name}
      </span>
    </div>
  );
}
