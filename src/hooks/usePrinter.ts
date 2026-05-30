import { useState, useCallback } from 'react';
import type { ReceiptData } from 'electron/services/printer/service';

// Re-export ReceiptData type for convenience
export type { ReceiptData };

export interface UsePrinterReturn {
  print: (data: ReceiptData) => Promise<{ ok: boolean; error?: { code: string; message: string } }>;
  testPrint: () => Promise<{ ok: boolean; error?: { code: string; message: string } }>;
  openDrawer: () => Promise<{ ok: boolean; error?: { code: string; message: string } }>;
  loading: boolean;
  lastError: string | null;
}

export default function usePrinter(): UsePrinterReturn {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const print = useCallback(async (data: ReceiptData): Promise<{ ok: boolean; error?: { code: string; message: string } }> => {
    setLoading(true);
    setLastError(null);
    try {
      const result = await window.api.printerPrint(data);
      if (!result.ok) {
        setLastError(result.error?.message || 'Print gagal');
      }
      return result;
    } catch (err: any) {
      const msg = err.message || 'Print gagal';
      setLastError(msg);
      return { ok: false, error: { code: 'PRINT_002', message: msg } };
    } finally {
      setLoading(false);
    }
  }, []);

  const testPrint = useCallback(async (): Promise<{ ok: boolean; error?: { code: string; message: string } }> => {
    setLoading(true);
    setLastError(null);
    try {
      const result = await window.api.printerTest();
      if (!result.ok) {
        setLastError(result.error?.message || 'Test print gagal');
      }
      return result;
    } catch (err: any) {
      const msg = err.message || 'Test print gagal';
      setLastError(msg);
      return { ok: false, error: { code: 'PRINT_002', message: msg } };
    } finally {
      setLoading(false);
    }
  }, []);

  const openDrawer = useCallback(async (): Promise<{ ok: boolean; error?: { code: string; message: string } }> => {
    setLoading(true);
    setLastError(null);
    try {
      const result = await window.api.printerOpenDrawer();
      if (!result.ok) {
        setLastError(result.error?.message || 'Gagal buka drawer');
      }
      return result;
    } catch (err: any) {
      const msg = err.message || 'Gagal buka drawer';
      setLastError(msg);
      return { ok: false, error: { code: 'PRINT_001', message: msg } };
    } finally {
      setLoading(false);
    }
  }, []);

  return { print, testPrint, openDrawer, loading, lastError };
}
