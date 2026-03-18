'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tenantsApi } from '@/lib/api';
import { TenantFormData } from '@/lib/types';
import TenantForm from '@/components/TenantForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: TenantFormData) => {
    setLoading(true);
    setError('');
    try {
      await tenantsApi.create(data);
      router.push('/dashboard/tenants');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erro ao criar distribuidora.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/tenants" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ChevronLeft size={15} /> Voltar
      </Link>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Nova Distribuidora</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <TenantForm onSubmit={handleSubmit} submitLabel="Criar Distribuidora" loading={loading} />
      </div>
    </div>
  );
}
