import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safely unwrap IPC response data. Returns null if not ok or missing. */
export function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T };
    if (r.ok) return r.data as T;
  }
  return fallback ?? null;
}

/** Extract error message from IPC response. Returns null if ok or missing. */
export function unwrapError(res: unknown): string | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; error?: { message: string } };
    if (!r.ok && r.error) return r.error.message;
  }
  return null;
}
