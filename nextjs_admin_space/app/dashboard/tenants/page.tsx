'use client';

import useSWR from 'swr';
import { tenantsApi } from '@/lib/api';
import { Tenant } from '@/lib/types';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TenantsPage() {
  const router = useRouter();
  const { data: tenants, mutate } = useSWR<Tenant[]>('tenants', tenantsApi.findAll);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = tenants?.filter((t) =>
    t.companyname.toLowerCase().includes(search.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await tenantsApi.toggleActive(id);
      mutate();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta distribuidora? Esta ação não pode ser desfeita.')) return;
    setDeletingId(id);
    try {
      await tenantsApi.remove(id);
      mutate();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Distribuidoras</h2>
        <Link
          href="/dashboard/tenants/new"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Nova Distribuidora
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou subdomain..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Subdomain</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Cores</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {t.logourl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.logourl} alt={t.appname} className="w-7 h-7 rounded object-contain" />
                    ) : (
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: t.primarycolor }}
                      >
                        {t.appname[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{t.companyname}</p>
                      <p className="text-xs text-gray-400">{t.appname}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">{t.subdomain}</code>
                </td>
                <td className="px-4 py-3 text-gray-600">{t.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: t.primarycolor }} title={t.primarycolor} />
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: t.secondarycolor }} title={t.secondarycolor} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.isactive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {t.isactive ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggle(t.id)}
                      disabled={togglingId === t.id}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                      title={t.isactive ? 'Desativar' : 'Ativar'}
                    >
                      {t.isactive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/tenants/${t.id}`)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered?.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma distribuidora encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
