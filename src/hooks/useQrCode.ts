import { useEffect, useState } from 'react';

interface UseQrCodeOptions {
  width?: number;
  margin?: number;
  /** Foreground color (the dots), defaults to dark slate */
  dark?: string;
  /** Background color, defaults to white */
  light?: string;
}

/**
 * Generate a QR code data URL from any URL.
 * Loads the `qrcode` lib lazily to keep the initial bundle small.
 * Returns an empty string until the QR is ready (or if generation fails).
 */
export function useQrCode(url: string | null | undefined, opts: UseQrCodeOptions = {}): string {
  const [dataUrl, setDataUrl] = useState<string>('');

  const { width = 200, margin = 2, dark = '#0F172A', light = '#FFFFFF' } = opts;

  useEffect(() => {
    if (!url) {
      setDataUrl('');
      return;
    }
    let cancelled = false;
    import('qrcode')
      .then((QRCode) =>
        QRCode.toDataURL(url, { width, margin, color: { dark, light } })
      )
      .then((value) => {
        if (!cancelled) setDataUrl(value);
      })
      .catch(() => {
        // QR generation failed; the underlying link still works
      });
    return () => {
      cancelled = true;
    };
  }, [url, width, margin, dark, light]);

  return dataUrl;
}
