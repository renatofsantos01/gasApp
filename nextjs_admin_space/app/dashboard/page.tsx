'use client';

import useSWR from 'swr';
import { tenantsApi } from '@/lib/api';
import { Tenant } from '@/lib/types';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: tenants } = useSWR<Tenant[]>('tenants', tenantsApi.findAll);

  const total = tenants?.length ?? 0;
  const ativos = tenants?.filter((t) => t.isactive).length ?? 0;
  const inativos = total - ativos;

  const stats = [
    { label: 'Total de Distribuidoras', value: total, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ativas', value: ativos, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Inativas', value: inativos, icon: XCircle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Distribuidoras Recentes</h3>
          <Link href="/dashboard/tenants" className="text-sm text-orange-500 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="space-y-2">
          {tenants?.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.companyname}</p>
                <p className="text-xs text-gray-400">{t.subdomain}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.isactive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
              }`}>
                {t.isactive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
