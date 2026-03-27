'use client';

import { useState } from 'react';
import { reportsApi } from '@/lib/api';
import { BarChart2, TrendingUp, ShoppingBag, Package } from 'lucide-react';

interface OrderStats {
  total: number;
  ordersByStatus: { status: string; count: number }[];
  totalRevenue: number;
}

interface RevenueStats {
  totalRevenue: number;
  revenueByPaymentMethod: { paymentMethod: string; total: number }[];
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
};

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [orders, setOrders] = useState<OrderStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const [ordersRes, revenueRes, topRes] = await Promise.all([
        reportsApi.getOrders(startDate, endDate),
        reportsApi.getRevenue(startDate, endDate),
        reportsApi.getTopProducts(startDate, endDate),
      ]);

      setOrders({
        total: ordersRes.totalOrders ?? 0,
        ordersByStatus: Object.entries(ordersRes.ordersByStatus ?? {}).map(([status, count]) => ({
          status,
          count: count as number,
        })),
        totalRevenue: ordersRes.totalRevenue ?? 0,
      });

      setRevenue({
        totalRevenue: revenueRes.totalRevenue ?? 0,
        revenueByPaymentMethod: Object.entries(revenueRes.revenueByPaymentMethod ?? {}).map(([paymentMethod, total]) => ({
          paymentMethod,
          total: total as number,
        })),
      });

      setTopProducts(
        (topRes ?? []).map((p: any) => ({
          name: p.name ?? p.productName,
          quantity: p.totalQuantity ?? p.quantity ?? 0,
          revenue: p.totalRevenue ?? p.revenue ?? 0,
        }))
      );

      setGenerated(true);
    } catch {
      alert('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Análise de pedidos e faturamento</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>

      {!generated && !loading && (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Selecione o período e clique em Gerar Relatório</p>
        </div>
      )}

      {generated && orders && revenue && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><ShoppingBag size={20} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.total}</p>
                <p className="text-sm text-gray-500">Total de Pedidos</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><TrendingUp size={20} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">R$ {revenue.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Faturamento Total</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600"><Package size={20} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.total > 0 ? `R$ ${(revenue.totalRevenue / orders.total).toFixed(2)}` : '—'}
                </p>
                <p className="text-sm text-gray-500">Ticket Médio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by status */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Pedidos por Status</h3>
              {orders.ordersByStatus.length === 0 ? (
                <p className="text-sm text-gray-400">Sem dados no período</p>
              ) : (
                <div className="space-y-2">
                  {orders.ordersByStatus.map(({ status, count }) => (
                    <div key={status} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{status}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue by payment method */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Faturamento por Pagamento</h3>
              {revenue.revenueByPaymentMethod.length === 0 ? (
                <p className="text-sm text-gray-400">Sem dados no período</p>
              ) : (
                <div className="space-y-2">
                  {revenue.revenueByPaymentMethod.map(({ paymentMethod, total }) => (
                    <div key={paymentMethod} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">
                        {PAYMENT_LABELS[paymentMethod] ?? paymentMethod}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">R$ {total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados no período</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((p, i) => (
                    <tr key={p.name}>
                      <td className="py-2.5 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2.5 font-medium text-gray-800">{p.name}</td>
                      <td className="py-2.5 text-right text-gray-600">{p.quantity}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">R$ {p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
