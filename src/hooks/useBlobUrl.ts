/**
 * 🔗 useBlobUrl.ts
 * Custom hook para gerenciar URLs de blob com limpeza automática
 */

import { useState, useEffect, useRef } from 'react';

export function useBlobUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup previous URL
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    // Create new URL if file exists
    if (file) {
      try {
        const objectUrl = URL.createObjectURL(file);
        urlRef.current = objectUrl;
        setUrl(objectUrl);
      } catch (err) {
        console.error('Failed to create blob URL:', err);
        setUrl(null);
      }
    } else {
      setUrl(null);
    }

    // Cleanup on unmount
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file]);

  return url;
}

/**
 * Hook for managing multiple blob URLs
 */
export function useBlobUrls(files: Record<string, File | null>): Record<string, string | null> {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const urlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const newUrls: Record<string, string | null> = {};

    // Cleanup old URLs and create new ones
    Object.entries(files).forEach(([key, file]) => {
      if (urlsRef.current[key]) {
        URL.revokeObjectURL(urlsRef.current[key]);
        delete urlsRef.current[key];
      }

      if (file) {
        try {
          const objectUrl = URL.createObjectURL(file);
          urlsRef.current[key] = objectUrl;
          newUrls[key] = objectUrl;
        } catch (err) {
          console.error(`Failed to create blob URL for ${key}:`, err);
          newUrls[key] = null;
        }
      } else {
        newUrls[key] = null;
      }
    });

    setUrls(newUrls);

    // Cleanup on unmount
    return () => {
      Object.values(urlsRef.current).forEach(url => {
        URL.revokeObjectURL(url);
      });
      urlsRef.current = {};
    };
  }, [files]);

  return urls;
}
