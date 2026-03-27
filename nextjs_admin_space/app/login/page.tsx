'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let tenantId: string | undefined;

      if (subdomain.trim()) {
        const tenant = await authApi.getTenantBySubdomain(subdomain.trim());
        if (!tenant?.id) {
          setError('Distribuidora não encontrada.');
          return;
        }
        tenantId = tenant.id;
      }

      const data = await authApi.login(email, password, tenantId);
      const role = data.user?.role;

      if (role !== 'superadmin' && role !== 'admin') {
        setError('Acesso não autorizado.');
        return;
      }

      if (role === 'admin' && !tenantId) {
        setError('Informe o código da sua distribuidora.');
        return;
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_role', role);
      if (tenantId) localStorage.setItem('admin_tenantId', tenantId);

      document.cookie = `admin_token=${data.token}; path=/; max-age=86400`;
      router.push('/dashboard');
    } catch {
      setError('Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Distribuidora de Gás</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código da Distribuidora
              <span className="ml-1 text-xs text-gray-400">(deixe vazio para superadmin)</span>
            </label>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="ex: meugás"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="admin@distribuidora.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
