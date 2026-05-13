'use client';

import { useState, useCallback } from 'react';
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Users,
  Loader2,
  Save,
  Upload,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FamilyMember } from '@/types';
import PhotoUploader from './PhotoUploader';
import AddressGeocoder from './AddressGeocoder';

interface MemberFormProps {
  existingMembers: FamilyMember[];
  initialData?: FamilyMember;
  familyId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isEdit?: boolean;
}

export default function MemberForm({
  existingMembers,
  initialData,
  familyId,
  onSubmit,
  isEdit = false,
}: MemberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(initialData?.full_name || '');
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [gender, setGender] = useState(initialData?.gender || 'male');
  const [birthPlace, setBirthPlace] = useState(initialData?.birth_place || '');
  const [birthDate, setBirthDate] = useState(initialData?.birth_date || '');
  const [deathDate, setDeathDate] = useState(initialData?.death_date || '');
  const [isAlive, setIsAlive] = useState(initialData?.is_alive ?? true);
  const [biography, setBiography] = useState(initialData?.biography || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude || null);
  const [fatherId, setFatherId] = useState(initialData?.father_id || '');
  const [motherId, setMotherId] = useState(initialData?.mother_id || '');
  const [spouseId, setSpouseId] = useState(initialData?.spouse_id || '');
  const [generation, setGeneration] = useState(initialData?.generation || 1);

  const males = existingMembers.filter((m) => m.gender === 'male');
  const females = existingMembers.filter((m) => m.gender === 'female');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        nickname: nickname.trim() || null,
        gender,
        birth_place: birthPlace.trim() || null,
        birth_date: birthDate || null,
        death_date: isAlive ? null : deathDate || null,
        is_alive: isAlive,
        biography: biography.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        photo_url: photoUrl || null,
        address: address.trim() || null,
        latitude,
        longitude,
        father_id: fatherId || null,
        mother_id: motherId || null,
        spouse_id: spouseId || null,
        generation,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo */}
      <div className="glass-card p-5 hover:transform-none hover:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Foto</h3>
        </div>
        <PhotoUploader currentUrl={photoUrl} memberName={fullName} familyId={familyId} onUpload={setPhotoUrl} />
      </div>

      {/* Personal Info */}
      <div className="glass-card p-5 hover:transform-none hover:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Data Pribadi</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Nama Panggilan</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nama panggilan"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Jenis Kelamin <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all',
                  gender === 'male'
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                )}
              >
                Laki-laki
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all',
                  gender === 'female'
                    ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                )}
              >
                Perempuan
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Generasi</label>
            <input
              type="number"
              value={generation}
              onChange={(e) => setGeneration(Number(e.target.value))}
              min={1}
              max={20}
              className={inputClass}
            />
            <p className="text-xs text-slate-500 mt-1">1 = generasi tertua</p>
          </div>
        </div>
      </div>

      {/* Birth/Death */}
      <div className="glass-card p-5 hover:transform-none hover:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Kelahiran & Kematian</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tempat Lahir</label>
            <input
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="Kota kelahiran"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tanggal Lahir</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer py-2">
              <div
                className={cn(
                  'w-10 h-6 rounded-full relative transition-colors',
                  isAlive ? 'bg-emerald-500' : 'bg-red-500'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full bg-white absolute top-1 transition-all',
                    isAlive ? 'left-5' : 'left-1'
                  )}
                />
              </div>
              <span className="text-sm text-slate-300">
                {isAlive ? 'Masih Hidup' : 'Sudah Meninggal'}
              </span>
            </label>
          </div>

          {!isAlive && (
            <div className="animate-fade-in">
              <label className={labelClass}>Tanggal Wafat</label>
              <input
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* Relationships */}
      <div className="glass-card p-5 hover:transform-none hover:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Hubungan Keluarga</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ayah</label>
            <select
              value={fatherId}
              onChange={(e) => setFatherId(e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-slate-800">— Pilih Ayah —</option>
              {males.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-800">
                  {m.full_name} (Gen {m.generation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Ibu</label>
            <select
              value={motherId}
              onChange={(e) => setMotherId(e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-slate-800">— Pilih Ibu —</option>
              {females.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-800">
                  {m.full_name} (Gen {m.generation})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Pasangan (Suami/Istri)</label>
            <select
              value={spouseId}
              onChange={(e) => setSpouseId(e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-slate-800">— Pilih Pasangan —</option>
              {existingMembers
                .filter((m) => m.gender !== gender)
                .map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-800">
                    {m.full_name} (Gen {m.generation})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="glass-card p-5 hover:transform-none hover:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Kontak</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nomor Telepon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xx-xxxx-xxxx"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Biography */}
      <div className="glass-card p-5 hover:transform-none hover:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Biografi</h3>
        </div>
        <textarea
          value={biography}
          onChange={(e) => setBiography(e.target.value)}
          placeholder="Ceritakan biografi singkat..."
          rows={4}
          className={cn(inputClass, 'resize-y')}
        />
      </div>

      {/* Location */}
      <div className="glass-card p-5 hover:transform-none hover:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            {isAlive ? 'Lokasi Tempat Tinggal' : 'Lokasi Pemakaman'}
          </h3>
        </div>

        <AddressGeocoder
          address={address}
          latitude={latitude}
          longitude={longitude}
          onAddressChange={setAddress}
          onCoordsChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !fullName.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Perbarui Data' : 'Simpan Anggota'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
