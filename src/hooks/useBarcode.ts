import { useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseBarcodeOptions {
  /** Called when a complete barcode is detected */
  onScan: (barcode: string) => void;
  /** Max ms between keystrokes to be considered a scan (default: 50) */
  threshold?: number;
  /** Terminator key for scan (default: Enter) */
  terminator?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useBarcode({ onScan, threshold = 50, terminator = 'Enter' }: UseBarcodeOptions) {
  const bufferRef = useRef<string[]>([]);
  const lastTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef<boolean>(false);

  const reset = useCallback(() => {
    bufferRef.current = [];
    lastTimeRef.current = 0;
    activeRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;

      // Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      // Detect terminator (Enter)
      if (e.key === terminator && activeRef.current) {
        const barcode = bufferRef.current.join('');
        if (barcode.length > 0) {
          onScan(barcode);
        }
        reset();
        e.preventDefault();
        return;
      }

      // Non-printable keys reset the scan
      if (e.key.length > 1 && e.key !== terminator) {
        reset();
        return;
      }

      // If gap is too long, reset (not a scan)
      if (activeRef.current && elapsed > threshold * 3) {
        reset();
      }

      // Start fresh or continue
      if (elapsed <= threshold * 3) {
        activeRef.current = true;
      }

      bufferRef.current.push(e.key);
      lastTimeRef.current = now;

      // Auto-reset after timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(reset, threshold * 4);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan, threshold, terminator, reset]);

  return { reset };
}
