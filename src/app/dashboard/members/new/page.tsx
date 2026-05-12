'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MemberForm from '@/components/dashboard/MemberForm';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Family, FamilyMember } from '@/types';

export default function NewMemberPage() {
  const router = useRouter();
  const supabase = createClient();
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: familyData } = await supabase.from('families').select('*').order('name');
      if (familyData) {
        setFamilies(familyData as Family[]);
        if (familyData.length > 0) setSelectedFamilyId(familyData[0].id);
      }
    };
    fetchData();
  }, [supabase]);

  useEffect(() => {
    if (!selectedFamilyId) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', selectedFamilyId)
        .order('full_name');
      if (data) setMembers(data as FamilyMember[]);
    };
    fetchMembers();
  }, [selectedFamilyId, supabase]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('family_members').insert({
      ...formData,
      family_id: selectedFamilyId,
      created_by: user?.id,
    });

    if (error) {
      alert('Gagal menambah anggota: ' + error.message);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 pb-10 px-4 md:px-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Tambah Anggota Baru</h1>
            <p className="text-sm text-slate-400">Isi data anggota keluarga baru</p>
          </div>
        </div>

        {/* Family Selector */}
        <div className="glass-card p-4 mb-6 hover:transform-none hover:shadow-none">
          <label className="block text-sm font-medium text-slate-300 mb-2">Keluarga</label>
          <select
            value={selectedFamilyId}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200"
          >
            {families.map((f) => (
              <option key={f.id} value={f.id} className="bg-slate-800">
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <MemberForm existingMembers={members} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
