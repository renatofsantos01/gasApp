'use client';

import { useState, useEffect, useRef } from 'react';
import { productsApi, api } from '@/lib/api';
import { Product } from '@/lib/types';
import { Package, Plus, Pencil, Trash2, ImagePlus, X } from 'lucide-react';

const MAX_FILE_SIZE_MB = 2;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_LABEL = 'JPG, PNG ou WebP';

async function uploadImageToR2(file: File): Promise<string> {
  const { data } = await api.post('/upload/presigned', {
    fileName: file.name,
    contentType: file.type,
  });
  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  return data.publicUrl;
}

const EMPTY_FORM = { name: '', category: '', description: '', price: '', stock: '', imageUrl: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setProducts(await productsApi.findAll()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    resetImage();
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
    resetImage();
    setImagePreview(p.imageUrl ?? null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError(`Formato inválido. Use ${ACCEPTED_LABEL}.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setImageError(`Imagem muito grande. Máximo ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError) return;
    setSaving(true);
    try {
      let imageUrl = form.imageUrl || undefined;
      if (imageFile) {
        imageUrl = await uploadImageToR2(imageFile);
      }
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        imageUrl,
      };
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {editing ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                  <input required value={form.name} onChange={f('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
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
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Imagem do Produto</label>
                  <p className="text-xs text-gray-400 mb-2">
                    {ACCEPTED_LABEL} · Máximo {MAX_FILE_SIZE_MB}MB · Recomendado: 800×800px (quadrada)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="h-28 w-28 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => { resetImage(); setForm((p) => ({ ...p, imageUrl: '' })); }}
                        className="absolute -top-1.5 -right-1.5 bg-white border border-gray-300 rounded-full p-0.5 shadow-sm hover:bg-red-50 hover:border-red-300 transition"
                      >
                        <X size={12} className="text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 flex items-center gap-1 text-xs text-orange-600 hover:underline"
                      >
                        <ImagePlus size={12} /> Trocar imagem
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg py-6 text-gray-400 hover:border-orange-400 hover:text-orange-500 transition"
                    >
                      <ImagePlus size={22} className="mb-1" />
                      <span className="text-xs">Clique para selecionar imagem</span>
                    </button>
                  )}
                  {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
                  <textarea required value={form.description} onChange={f('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-1 pb-2">
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
