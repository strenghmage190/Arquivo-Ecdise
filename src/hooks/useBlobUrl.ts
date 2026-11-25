/**
 * 🔗 useBlobUrl.ts
 * Custom hook para gerenciar URLs de blob com limpeza automática garantida no unmount
 */

import { useState, useEffect, useRef } from 'react';

export function useBlobUrl(file: File | Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

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
 * Hook for managing multiple blob URLs with full cleanup of removed keys and on unmount
 */
export function useBlobUrls(
  files: Record<string, File | Blob | null>
): Record<string, string | null> {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const urlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Revoke all previous URLs (including keys removed from `files`)
    Object.values(urlsRef.current).forEach((prevUrl) => {
      URL.revokeObjectURL(prevUrl);
    });
    urlsRef.current = {};

    const newUrls: Record<string, string | null> = {};

    Object.entries(files).forEach(([key, file]) => {
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

    return () => {
      Object.values(urlsRef.current).forEach((activeUrl) => {
        URL.revokeObjectURL(activeUrl);
      });
      urlsRef.current = {};
    };
  }, [files]);

  return urls;
}
