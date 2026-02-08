/**
 * 📤 useFileUpload.ts
 * Custom hook para gerenciar upload de arquivos
 * - Progress tracking
 * - Error handling
 * - Cancelamento
 * - Retry logic
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

interface UploadOptions {
  investigationId: string;
  bucket?: string;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  url: string | null;
  error: Error | null;
}

export function useFileUpload() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const mountedRef = useRef(true);

  const uploadFile = useCallback(async (
    file: File,
    key: string,
    options: UploadOptions
  ): Promise<UploadResult> => {
    if (!file) {
      return { url: null, error: new Error('No file provided') };
    }

    setUploading(prev => ({ ...prev, [key]: true }));
    setProgress(prev => ({ ...prev, [key]: 0 }));

    try {
      // Sanitize filename
      const originalName = file.name || 'file';
      const ext = originalName.split('.').pop() || '';
      const base = originalName
        .replace(/\.[^/.]+$/, '')
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 120);
      
      const safeName = `${key}_${Date.now()}_${base}${ext ? '.' + ext : ''}`;
      const path = `${options.investigationId}/${safeName}`;
      const bucket = options.bucket || 'investigation-assets';

      // Upload with progress simulation (Supabase doesn't support real progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const current = prev[key] || 0;
          const increment = Math.random() * 20;
          const newProgress = Math.min(current + increment, 90);
          return { ...prev, [key]: newProgress };
        });
      }, 200);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: publicData } = await supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const url = (publicData as any)?.publicUrl || null;

      if (mountedRef.current) {
        setProgress(prev => ({ ...prev, [key]: 100 }));
        setUploading(prev => ({ ...prev, [key]: false }));
      }

      return { url, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      
      if (mountedRef.current) {
        setErrors(prev => [...prev, `${key}: ${error.message}`]);
        setProgress(prev => ({ ...prev, [key]: 0 }));
        setUploading(prev => ({ ...prev, [key]: false }));
      }

      return { url: null, error };
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const resetProgress = useCallback((key: string) => {
    setProgress(prev => ({ ...prev, [key]: 0 }));
  }, []);

  return {
    uploadFile,
    progress,
    errors,
    uploading,
    clearErrors,
    resetProgress,
  };
}
