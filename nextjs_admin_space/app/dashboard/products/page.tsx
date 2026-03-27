'use client';

import { useState, useEffect } from 'react';
import { productsApi } from '@/lib/api';
import { Product } from '@/lib/types';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = { name: '', category: '', description: '', price: '', stock: '', imageUrl: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setProducts(await productsApi.findAll()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      imageUrl: form.imageUrl || undefined,
    };
    try {
      if (editing) {
        await productsApi.update(editing.id, payload);
      } else {
        await productsApi.create(payload);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este produto?')) return;
    try { await productsApi.remove(id); await load(); }
    catch { alert('Erro ao remover produto'); }
  };

  const f = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie o catálogo de produtos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">R$ {p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {p.stock} un.
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
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
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editing ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                  <input required value={form.name} onChange={f('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoria *</label>
                  <input required value={form.category} onChange={f('category')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Preço (R$) *</label>
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={f('price')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estoque *</label>
                  <input required type="number" min="0" value={form.stock} onChange={f('stock')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL da Imagem</label>
                  <input value={form.imageUrl} onChange={f('imageUrl')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
                  <textarea required value={form.description} onChange={f('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
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
