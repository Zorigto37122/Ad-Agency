import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onLogin: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function Login({ onLogin, addToast }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: 'login' | 'register') => { setMode(next); setError(null); };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        addToast('Добро пожаловать!', 'success');
        onLogin();
      } else {
        await register(form.email, form.full_name, form.password);
        await login(form.email, form.password);
        addToast('Аккаунт создан!', 'success');
        onLogin();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Произошла ошибка';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto">
            <span className="text-black font-black text-xl">AA</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">AdAgency</h1>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'login' ? 'Войдите в аккаунт' : 'Создайте новый аккаунт'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-dark-hover border border-dark-border p-1 mb-5">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === m ? 'bg-dark-card text-white' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Полное имя</label>
                <input
                  className="input"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Иван Иванов"
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                className={`input ${error ? 'border-red-500/50' : ''}`}
                type="email"
                required
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(null); }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input
                className={`input ${error ? 'border-red-500/50' : ''}`}
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(null); }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  Подождите…
                </span>
              ) : (
                mode === 'login' ? 'Войти' : 'Создать аккаунт'
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        {mode === 'login' && (
          <div className="text-center text-xs text-gray-700 space-y-1">
            <p>Демо-доступ: <span className="text-gray-500">admin@adagency.com</span> / <span className="text-gray-500">admin123</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
