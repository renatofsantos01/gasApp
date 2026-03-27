'use client';

import { useState, useEffect } from 'react';
import { deliverersApi } from '@/lib/api';
import { Deliverer } from '@/lib/types';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };

export default function DeliverersPage() {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Deliverer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setDeliverers(await deliverersApi.findAll()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (d: Deliverer) => {
    setEditing(d);
    setForm({ name: d.name, email: d.email, phone: d.phone ?? '', password: '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, string> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
    };
    if (form.password) payload.password = form.password;
    try {
      if (editing) {
        await deliverersApi.update(editing.id, payload);
      } else {
        if (!form.password) { alert('Informe uma senha para o novo entregador'); setSaving(false); return; }
        await deliverersApi.create(payload);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar entregador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este entregador?')) return;
    try { await deliverersApi.remove(id); await load(); }
    catch { alert('Erro ao remover entregador'); }
  };

  const f = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entregadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie a equipe de entregadores</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
        >
          <Plus size={16} /> Novo Entregador
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : deliverers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum entregador cadastrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliverers.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.email}</td>
                  <td className="px-4 py-3 text-gray-600">{d.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {d.available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editing ? 'Editar Entregador' : 'Novo Entregador'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input required value={form.name} onChange={f('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={f('email')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input value={form.phone} onChange={f('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Senha {editing ? '(deixe vazio para manter)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={f('password')}
                  required={!editing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
