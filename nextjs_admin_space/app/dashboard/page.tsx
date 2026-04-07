'use client';

import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { tenantsApi, ordersApi, reportsApi } from '@/lib/api';
import { Tenant, Order } from '@/lib/types';
import {
  Building2, CheckCircle, XCircle, ShoppingBag, Clock, Truck,
  CalendarDays, TrendingUp, Package,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

/* ─── Superadmin ─────────────────────────────────────────── */
function SuperadminDashboard() {
  const { data: tenants } = useSWR<Tenant[]>('tenants', tenantsApi.findAll);
  const total = tenants?.length ?? 0;
  const ativos = tenants?.filter((t) => t.isactive).length ?? 0;
  const stats = [
    { label: 'Total', value: total, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ativas', value: ativos, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Inativas', value: total - ativos, icon: XCircle, color: 'text-red-600 bg-red-50' },
  ];
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${color}`}><Icon size={20} /></div>
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
          <Link href="/dashboard/tenants" className="text-sm text-orange-500 hover:underline">Ver todas</Link>
        </div>
        <div className="space-y-2">
          {tenants?.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.companyname}</p>
                <p className="text-xs text-gray-400">{t.subdomain}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.isactive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {t.isactive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  Pendente: 'bg-yellow-50 text-yellow-700',
  'Em Preparo': 'bg-blue-50 text-blue-700',
  'Saiu para Entrega': 'bg-purple-50 text-purple-700',
  Entregue: 'bg-green-50 text-green-700',
  Cancelado: 'bg-red-50 text-red-600',
};

const CHART_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b'];

type FilterKey = 'todos' | 'pendentes' | 'andamento' | 'entregues';
type Tab = 'visao' | 'relatorios';

const PAYMENT_LABELS: Record<string, string> = {
  Dinheiro: 'Dinheiro', Pix: 'Pix', Cartão: 'Cartão',
  cash: 'Dinheiro', pix: 'Pix', credit_card: 'Cartão',
};

function toInputDate(d: Date) { return d.toISOString().slice(0, 10); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }

/* ─── Admin Dashboard ────────────────────────────────────── */
function AdminDashboard() {
  const { data: orders } = useSWR<Order[]>('orders', ordersApi.findAll);

  const today = new Date();
  const [dateFrom, setDateFrom] = useState(toInputDate(startOfMonth(today)));
  const [dateTo, setDateTo] = useState(toInputDate(today));
  const [activeFilter, setActiveFilter] = useState<FilterKey>('todos');
  const [activeTab, setActiveTab] = useState<Tab>('visao');

  // Reports state
  const [reportData, setReportData] = useState<{
    orders: { total: number; ordersByStatus: { status: string; count: number }[]; totalRevenue: number } | null;
    revenue: { totalRevenue: number; revenueByPaymentMethod: { paymentMethod: string; total: number }[] } | null;
    topProducts: { name: string; quantity: number; revenue: number }[];
  }>({ orders: null, revenue: null, topProducts: [] });
  const [reportLoading, setReportLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setReportLoading(true);
    try {
      const [ordersRes, revenueRes, topRes] = await Promise.all([
        reportsApi.getOrders(dateFrom, dateTo),
        reportsApi.getRevenue(dateFrom, dateTo),
        reportsApi.getTopProducts(dateFrom, dateTo),
      ]);
      setReportData({
        orders: {
          total: ordersRes.totalOrders ?? 0,
          ordersByStatus: Object.entries(ordersRes.ordersByStatus ?? {}).map(([status, count]) => ({ status, count: count as number })),
          totalRevenue: ordersRes.totalRevenue ?? 0,
        },
        revenue: {
          totalRevenue: revenueRes.totalRevenue ?? 0,
          revenueByPaymentMethod: Object.entries(revenueRes.revenueByPaymentMethod ?? {}).map(([paymentMethod, total]) => ({ paymentMethod, total: total as number })),
        },
        topProducts: (topRes ?? []).map((p: any) => ({
          name: p.name ?? p.productName,
          quantity: p.totalQuantity ?? p.quantity ?? 0,
          revenue: p.totalRevenue ?? p.revenue ?? 0,
        })),
      });
    } catch {
      alert('Erro ao carregar relatório');
    } finally {
      setReportLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === 'relatorios') fetchReports();
  }, [activeTab, fetchReports]);

  // Filter orders by date range
  const inRange = (orders ?? []).filter((o) => {
    const d = new Date(o.createdAt);
    return d >= new Date(dateFrom) && d <= new Date(dateTo + 'T23:59:59');
  });

  const total = inRange.length;
  const pendentes = inRange.filter((o) => o.status === 'Pendente').length;
  const emAndamento = inRange.filter((o) => o.status === 'Em Preparo' || o.status === 'Saiu para Entrega').length;
  const entregues = inRange.filter((o) => o.status === 'Entregue').length;

  const FILTER_MAP: Record<FilterKey, (o: Order) => boolean> = {
    todos: () => true,
    pendentes: (o) => o.status === 'Pendente',
    andamento: (o) => o.status === 'Em Preparo' || o.status === 'Saiu para Entrega',
    entregues: (o) => o.status === 'Entregue',
  };

  const filteredOrders = inRange.filter(FILTER_MAP[activeFilter]).slice(0, 6);

  const delivererChart = Object.entries(
    inRange
      .filter((o) => o.status === 'Entregue' && o.delivererName)
      .reduce<Record<string, number>>((acc, o) => { acc[o.delivererName!] = (acc[o.delivererName!] ?? 0) + 1; return acc; }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const stats = [
    { label: 'Total', value: total, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50', ring: 'ring-blue-400', filter: 'todos' as FilterKey },
    { label: 'Pendentes', value: pendentes, icon: Clock, color: 'text-yellow-600 bg-yellow-50', ring: 'ring-yellow-400', filter: 'pendentes' as FilterKey },
    { label: 'Em Andamento', value: emAndamento, icon: Truck, color: 'text-purple-600 bg-purple-50', ring: 'ring-purple-400', filter: 'andamento' as FilterKey },
    { label: 'Entregues', value: entregues, icon: CheckCircle, color: 'text-green-600 bg-green-50', ring: 'ring-green-400', filter: 'entregues' as FilterKey },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <CalendarDays size={15} className="text-gray-400" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="text-gray-700 outline-none cursor-pointer text-xs" />
          <span className="text-gray-400 text-xs">—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="text-gray-700 outline-none cursor-pointer text-xs" />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map(({ label, value, icon: Icon, color, ring, filter }) => {
          const isActive = activeFilter === filter && activeTab === 'visao';
          return (
            <button key={filter} onClick={() => { setActiveFilter(filter); setActiveTab('visao'); }}
              className={`bg-white rounded-xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md w-full
                ${isActive ? `border-transparent ring-2 ${ring} shadow-md` : 'border-gray-200 hover:border-gray-300'}`}>
              <div className={`p-2 rounded-lg shrink-0 ${color}`}><Icon size={17} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {([['visao', 'Visão Geral'], ['relatorios', 'Relatórios']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Visão Geral ── */}
      {activeTab === 'visao' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">
                {stats.find((s) => s.filter === activeFilter)?.label ?? 'Pedidos'}
              </h3>
              <Link href="/dashboard/orders" className="text-xs text-orange-500 hover:underline">Ver todos</Link>
            </div>
            {filteredOrders.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10">Nenhum pedido no período</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Pedido</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Cliente</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Valor</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="font-mono font-bold text-gray-800">#{o.id.substring(0, 8).toUpperCase()}</p>
                        <p className="text-gray-400">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-3 py-2 max-w-[90px]">
                        <p className="font-medium text-gray-800 truncate">{o.user?.name}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        R$ {o.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Entregas por Entregador</h3>
            {delivererChart.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-xs text-gray-400">Nenhuma entrega concluída no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={delivererChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => { const n = Number(v ?? 0); return [`${n} entrega${n !== 1 ? 's' : ''}`, '']; }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {delivererChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Relatórios ── */}
      {activeTab === 'relatorios' && (
        reportLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Carregando relatório...</div>
        ) : reportData.orders && reportData.revenue ? (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><ShoppingBag size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{reportData.orders.total}</p>
                  <p className="text-sm text-gray-500">Total de Pedidos</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><TrendingUp size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">R$ {reportData.revenue.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Faturamento Total</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600"><Package size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.orders.total > 0 ? `R$ ${(reportData.revenue.totalRevenue / reportData.orders.total).toFixed(2)}` : '—'}
                  </p>
                  <p className="text-sm text-gray-500">Ticket Médio</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pedidos por status */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Pedidos por Status</h3>
                {reportData.orders.ordersByStatus.length === 0 ? (
                  <p className="text-xs text-gray-400">Sem dados no período</p>
                ) : (
                  <div className="space-y-1">
                    {reportData.orders.ordersByStatus.map(({ status, count }) => (
                      <div key={status} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Faturamento por pagamento */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Faturamento por Pagamento</h3>
                {reportData.revenue.revenueByPaymentMethod.length === 0 ? (
                  <p className="text-xs text-gray-400">Sem dados no período</p>
                ) : (
                  <div className="space-y-1">
                    {reportData.revenue.revenueByPaymentMethod.map(({ paymentMethod, total }) => (
                      <div key={paymentMethod} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{PAYMENT_LABELS[paymentMethod] ?? paymentMethod}</span>
                        <span className="text-sm font-semibold text-gray-900">R$ {total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top produtos */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Produtos Mais Vendidos</h3>
              {reportData.topProducts.length === 0 ? (
                <p className="text-xs text-gray-400">Sem dados no período</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase">#</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase">Produto</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase">Qtd</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase">Receita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.topProducts.map((p, i) => (
                      <tr key={p.name}>
                        <td className="py-2 text-gray-400 font-medium text-xs">{i + 1}</td>
                        <td className="py-2 font-medium text-gray-800">{p.name}</td>
                        <td className="py-2 text-right text-gray-600">{p.quantity}</td>
                        <td className="py-2 text-right font-semibold text-gray-900">R$ {p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhum dado disponível para o período</div>
        )
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { setRole(localStorage.getItem('admin_role')); }, []);
  if (role === null) return null;
  return role === 'admin' ? <AdminDashboard /> : <SuperadminDashboard />;
}
