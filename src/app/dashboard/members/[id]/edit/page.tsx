'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MemberForm from '@/components/dashboard/MemberForm';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { FamilyMember } from '@/types';

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const memberId = params.id as string;

  const [member, setMember] = useState<FamilyMember | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch current member
      const { data: memberData } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberData) {
        setMember(memberData as FamilyMember);

        // Fetch other members in the same family
        const { data: familyMembers } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', memberData.family_id)
          .neq('id', memberId)
          .order('full_name');

        if (familyMembers) setMembers(familyMembers as FamilyMember[]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [memberId, supabase]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const { error } = await supabase
      .from('family_members')
      .update(formData)
      .eq('id', memberId);

    if (error) {
      alert('Gagal memperbarui data: ' + error.message);
      return;
    }

    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </main>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-20 px-4 text-center">
          <p className="text-slate-400">Anggota tidak ditemukan</p>
          <Link href="/dashboard" className="text-emerald-400 text-sm mt-2 inline-block">
            Kembali ke Dashboard
          </Link>
        </main>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-slate-100">Edit Anggota</h1>
            <p className="text-sm text-slate-400">{member.full_name}</p>
          </div>
        </div>

        <MemberForm
          existingMembers={members}
          initialData={member}
          familyId={member.family_id}
          onSubmit={handleSubmit}
          isEdit
        />
      </main>
    </div>
  );
}
