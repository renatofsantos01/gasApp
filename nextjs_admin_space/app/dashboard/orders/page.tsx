'use client';

import { useState, useEffect } from 'react';
import { ordersApi, deliverersApi } from '@/lib/api';
import { Order, Deliverer } from '@/lib/types';
import { ShoppingBag, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = ['Pendente', 'Em Preparo', 'Saiu para Entrega', 'Entregue', 'Cancelado'];

const STATUS_COLORS: Record<string, string> = {
  Pendente: 'bg-yellow-50 text-yellow-700',
  'Em Preparo': 'bg-blue-50 text-blue-700',
  'Saiu para Entrega': 'bg-purple-50 text-purple-700',
  Entregue: 'bg-green-50 text-green-700',
  Cancelado: 'bg-red-50 text-red-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      ordersApi.findAll().then(setOrders),
      deliverersApi.findAll().then(setDeliverers),
    ]).finally(() => setLoading(false));
  }, []);

  const reload = () => ordersApi.findAll().then(setOrders);

  const handleStatusChange = async (order: Order, status: string) => {
    if (status === 'Cancelado') {
      setSelected(order);
      setShowCancel(true);
      return;
    }
    try {
      await ordersApi.updateStatus(order.id, status);
      await reload();
    } catch {
      alert('Erro ao atualizar status');
    }
  };

  const handleAssign = async (order: Order, delivererId: string) => {
    try {
      await ordersApi.assignDeliverer(order.id, delivererId);
      await reload();
    } catch {
      alert('Erro ao atribuir entregador');
    }
  };

  const handleCancel = async () => {
    if (!selected || !cancelReason.trim()) return;
    setSaving(true);
    try {
      await ordersApi.cancel(selected.id, cancelReason);
      setShowCancel(false);
      setCancelReason('');
      setSelected(null);
      await reload();
    } catch {
      alert('Erro ao cancelar pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie os pedidos da sua distribuidora</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pagamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entregador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-gray-800">#{o.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{o.user?.name}</p>
                    <p className="text-xs text-gray-400">{o.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    R$ {o.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={o.delivererId ?? ''}
                        onChange={(e) => handleAssign(o, e.target.value)}
                        className="appearance-none border border-gray-200 rounded-lg px-2 py-1 pr-6 text-xs text-gray-700 bg-white cursor-pointer"
                        disabled={o.status === 'Entregue' || o.status === 'Cancelado'}
                      >
                        <option value="">Sem entregador</option>
                        {deliverers.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o, e.target.value)}
                        className={`appearance-none border-0 rounded-full px-3 py-1 pr-6 text-xs font-medium cursor-pointer ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500'}`}
                        disabled={o.status === 'Entregue' || o.status === 'Cancelado'}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Cancelar Pedido</h3>
            <label className="block text-xs font-medium text-gray-600 mb-1">Motivo do cancelamento *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Descreva o motivo..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCancel}
                disabled={saving || !cancelReason.trim()}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {saving ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
              <button
                onClick={() => { setShowCancel(false); setCancelReason(''); setSelected(null); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
