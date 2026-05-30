import { useState, FormEvent } from 'react';
import { Eye, EyeSlash, Envelope, Lock, NumberSquareFour } from 'phosphor-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PinPad from './PinPad';

interface LoginFormProps {
  loading: boolean;
  error: string | null;
  onLogin: (credentials: { pin?: string; email?: string; password?: string }) => void;
}

type Method = 'pin' | 'email';

export default function LoginForm({ loading, error, onLogin }: LoginFormProps) {
  const [method, setMethod] = useState<Method>('pin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email && password) onLogin({ email, password });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Tab bar */}
      <div className="flex border-b border-neutral-200">
        {(['pin', 'email'] as Method[]).map((m) => (
          <Button
            key={m}
            variant="ghost"
            type="button"
            onClick={() => setMethod(m)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold border-b-2 -mb-px transition-colors rounded-none',
              method === m
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            )}
          >
            {m === 'pin'
              ? <><NumberSquareFour className="w-3.5 h-3.5" /> PIN</>
              : <><Envelope className="w-3.5 h-3.5" /> Email</>
            }
          </Button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700 leading-snug">
          <span className="text-red-400 mt-0.5">✕</span>
          {error}
        </div>
      )}

      {/* PIN method */}
      {method === 'pin' && (
        <div className="flex flex-col items-center gap-4">
          <PinPad onSubmit={(pin) => onLogin({ pin })} loading={loading} />
          <p className="text-[10px] text-neutral-400">
            Default PIN: <span className="font-mono font-semibold text-neutral-600">123456</span>
          </p>
        </div>
      )}

      {/* Email method */}
      {method === 'email' && (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Envelope className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input
              type="email"
              placeholder="admin@pos.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              className="pl-8 h-8 text-[12px]"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              className="pl-8 pr-8 h-8 text-[12px]"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              tabIndex={-1}
            >
              {showPassword
                ? <EyeSlash className="w-3.5 h-3.5" />
                : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="h-8 text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>
      )}
    </div>
  );
}
