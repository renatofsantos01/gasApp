'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { tenantsApi, ordersApi } from '@/lib/api';
import { Tenant, Order } from '@/lib/types';
import { Building2, CheckCircle, XCircle, ShoppingBag, Clock, Truck } from 'lucide-react';
import Link from 'next/link';

function SuperadminDashboard() {
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

const STATUS_COLORS: Record<string, string> = {
  Pendente: 'bg-yellow-50 text-yellow-700',
  'Em Preparo': 'bg-blue-50 text-blue-700',
  'Saiu para Entrega': 'bg-purple-50 text-purple-700',
  Entregue: 'bg-green-50 text-green-700',
  Cancelado: 'bg-red-50 text-red-600',
};

function AdminDashboard() {
  const { data: orders } = useSWR<Order[]>('orders', ordersApi.findAll);

  const total = orders?.length ?? 0;
  const pendentes = orders?.filter((o) => o.status === 'Pendente').length ?? 0;
  const emAndamento = orders?.filter((o) => o.status === 'Em Preparo' || o.status === 'Saiu para Entrega').length ?? 0;
  const entregues = orders?.filter((o) => o.status === 'Entregue').length ?? 0;

  const stats = [
    { label: 'Total de Pedidos', value: total, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pendentes', value: pendentes, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Em Andamento', value: emAndamento, icon: Truck, color: 'text-purple-600 bg-purple-50' },
    { label: 'Entregues', value: entregues, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          <h3 className="font-semibold text-gray-900">Pedidos Recentes</h3>
          <Link href="/dashboard/orders" className="text-sm text-orange-500 hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="space-y-2">
          {orders?.slice(0, 8).map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">#{o.id.substring(0, 8).toUpperCase()}</p>
                <p className="text-xs text-gray-400">{o.user?.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-800">
                  R$ {o.totalAmount.toFixed(2)}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {o.status}
                </span>
              </div>
            </div>
          ))}
          {(!orders || orders.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum pedido encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('admin_role'));
  }, []);

  if (role === null) return null;
  return role === 'admin' ? <AdminDashboard /> : <SuperadminDashboard />;
}
