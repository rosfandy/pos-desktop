import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Backspace } from 'phosphor-react';

interface PinPadProps {
  onSubmit: (pin: string) => void;
  loading?: boolean;
  maxLength?: number;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','clear','0','back'] as const;

export default function PinPad({ onSubmit, loading = false, maxLength = 6 }: PinPadProps) {
  const [pin, setPin] = useState('');

  const submit = useCallback((value: string) => {
    onSubmit(value);
    setPin('');
  }, [onSubmit]);

  const press = useCallback((digit: string) => {
    if (loading) return;
    setPin((prev) => {
      if (prev.length >= maxLength) return prev;
      const next = prev + digit;
      if (next.length === maxLength) {
        setTimeout(() => submit(next), 120);
      }
      return next;
    });
  }, [loading, maxLength, submit]);

  const back = useCallback(() => setPin((p) => p.slice(0, -1)), []);
  const clear = useCallback(() => setPin(''), []);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        back();
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        e.preventDefault();
        clear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === maxLength) {
          submit(pin);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, press, back, clear, submit, pin, maxLength]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* PIN dots */}
      <div className="flex items-center gap-2.5">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full border-2 transition-all duration-100',
              i < pin.length
                ? 'bg-indigo-600 border-indigo-600 scale-110'
                : 'bg-transparent border-neutral-300'
            )}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-1.5">
        {KEYS.map((key) => {
          if (key === 'clear') {
            return (
              <Button
                key={key}
                variant="outline"
                type="button"
                onClick={clear}
                disabled={loading || pin.length === 0}
                className="h-12 w-16 text-[11px] font-semibold text-neutral-500 disabled:opacity-30 active:scale-95"
              >
                HAPUS
              </Button>
            );
          }
          if (key === 'back') {
            return (
              <Button
                key={key}
                variant="outline"
                type="button"
                onClick={back}
                disabled={loading || pin.length === 0}
                className="h-12 w-16 text-neutral-500 disabled:opacity-30 active:scale-95 flex items-center justify-center"
                aria-label="Hapus"
              >
                <Backspace className="w-4 h-4" />
              </Button>
            );
          }
          return (
            <Button
              key={key}
              variant="outline"
              type="button"
              onClick={() => press(key)}
              disabled={loading}
              className="h-12 w-16 text-lg font-semibold text-neutral-800 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50 active:scale-95 shadow-sm"
            >
              {key}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
