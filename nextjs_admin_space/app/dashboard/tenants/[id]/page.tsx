'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { tenantsApi } from '@/lib/api';
import { Tenant, TenantFormData } from '@/lib/types';
import TenantForm from '@/components/TenantForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: tenant } = useSWR<Tenant>(`tenant-${id}`, () => tenantsApi.findOne(id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: TenantFormData) => {
    setLoading(true);
    setError('');
    try {
      await tenantsApi.update(id, data);
      router.push('/dashboard/tenants');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erro ao atualizar distribuidora.');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return <div className="p-8 text-sm text-gray-400">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/tenants" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ChevronLeft size={15} /> Voltar
      </Link>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Editar: {tenant.companyname}</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <TenantForm
          defaultValues={{
            companyname: tenant.companyname,
            appname: tenant.appname,
            subdomain: tenant.subdomain,
            email: tenant.email,
            phone: tenant.phone ?? '',
            primarycolor: tenant.primarycolor,
            secondarycolor: tenant.secondarycolor,
            logourl: tenant.logourl ?? '',
            splashscreenurl: tenant.splashscreenurl ?? '',
            isactive: tenant.isactive,
          }}
          onSubmit={handleSubmit}
          submitLabel="Salvar Alterações"
          loading={loading}
        />
      </div>
    </div>
  );
}
