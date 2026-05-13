'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PhotoUploaderProps {
  currentUrl: string;
  memberName?: string;
  familyId?: string;
  onUpload: (url: string) => void;
}

/**
 * Foto disimpan di Supabase Storage dengan struktur folder:
 *
 *   family-photos/
 *   ├── {family_id}/
 *   │   ├── {nama-anggota}_{timestamp}.jpg
 *   │   ├── {nama-anggota}_{timestamp}.png
 *   │   └── ...
 *   └── uncategorized/
 *       └── {timestamp}_{filename}
 *
 * Ini memudahkan Anda mencari foto di Supabase Storage
 * karena sudah terkelompok berdasarkan keluarga.
 */
export default function PhotoUploader({ currentUrl, memberName, familyId, onUpload }: PhotoUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);

  // Membuat nama file yang rapi dan terklasifikasi
  const buildFilePath = (file: File): string => {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = (memberName || 'anggota')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .substring(0, 40);

    const folder = familyId || 'uncategorized';
    return `${folder}/${safeName}_${timestamp}.${ext}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }
    // Validasi ukuran (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Preview lokal
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const filePath = buildFilePath(file);

      const { error: uploadError } = await supabase.storage
        .from('family-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Ambil URL publik
      const { data } = supabase.storage
        .from('family-photos')
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setError('Gagal mengunggah foto. Pastikan database sudah dikonfigurasi.');
      setPreview(currentUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-start gap-4">
      {/* Preview */}
      <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-white/10 flex-shrink-0">
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all"
              style={{ minHeight: 'unset', minWidth: 'unset' }}
            >
              <X className="w-3 h-3" style={{ minHeight: 'unset', minWidth: 'unset' }} />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ImageIcon className="w-8 h-8 text-slate-600" style={{ minHeight: 'unset', minWidth: 'unset' }} />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" style={{ minHeight: 'unset', minWidth: 'unset' }} />
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <Upload className="w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
          {isUploading ? 'Mengunggah...' : 'Pilih Foto'}
        </button>
        <p className="text-xs text-slate-500 mt-2">JPG, PNG, WebP, atau GIF. Maksimal 5MB.</p>
        <p className="text-[10px] text-slate-600 mt-1">
          📁 Foto akan disimpan di: family-photos/{familyId ? `${familyId.substring(0, 8)}...` : 'uncategorized'}/
        </p>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}
