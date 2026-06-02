import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import LoginForm from '@/components/auth/LoginForm';
import { Storefront } from 'phosphor-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (credentials: {
    pin?: string;
    email?: string;
    password?: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      await login(credentials);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100">
        <span className="text-sm text-neutral-500">Memuat…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100">
      <div className="w-[340px] bg-card text-card-foreground border border-border shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-neutral-100">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center shrink-0">
            <Storefront weight="fill" className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-neutral-900 leading-tight">POS Desktop</h1>
            <p className="text-[10px] text-neutral-400 leading-tight">Sistem Kasir untuk UMKM</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-5 py-4">
          <LoginForm loading={loading} error={error} onLogin={handleLogin} />
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-neutral-100 bg-neutral-50">
          <p className="text-[10px] text-neutral-400 text-center">
            v0.1.0 · POS Desktop
          </p>
        </div>
      </div>
    </div>
  );
}
