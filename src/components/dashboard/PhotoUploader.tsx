'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn, getInitials } from '@/lib/utils';

interface PhotoUploaderProps {
  currentUrl: string;
  onUpload: (url: string) => void;
}

export default function PhotoUploader({ currentUrl, onUpload }: PhotoUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = `members/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('family-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('family-photos')
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setError('Gagal mengunggah foto. Pastikan bucket "family-photos" sudah dibuat.');
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
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all min-h-0 min-w-0"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ImageIcon className="w-8 h-8 text-slate-600" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Mengunggah...' : 'Pilih Foto'}
        </button>
        <p className="text-xs text-slate-500 mt-2">JPG, PNG, atau WebP. Maksimal 5MB.</p>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}
