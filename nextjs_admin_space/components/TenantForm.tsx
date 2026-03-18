'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TenantFormData } from '@/lib/types';

const schema = z.object({
  companyname: z.string().min(1, 'Obrigatório'),
  appname: z.string().min(1, 'Obrigatório'),
  subdomain: z.string().min(1, 'Obrigatório').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  primarycolor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hex inválida'),
  secondarycolor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hex inválida'),
  logourl: z.string().url('URL inválida').optional().or(z.literal('')),
  splashscreenurl: z.string().url('URL inválida').optional().or(z.literal('')),
  isactive: z.boolean(),
});

interface TenantFormProps {
  defaultValues?: Partial<TenantFormData>;
  onSubmit: (data: TenantFormData) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
}

export default function TenantForm({ defaultValues, onSubmit, submitLabel, loading }: TenantFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TenantFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primarycolor: '#FF5722',
      secondarycolor: '#2196F3',
      isactive: true,
      ...defaultValues,
    },
  });

  const primarycolor = watch('primarycolor');
  const secondarycolor = watch('secondarycolor');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome da Empresa" error={errors.companyname?.message}>
          <input {...register('companyname')} className={input} placeholder="Distribuidora ABC Ltda" />
        </Field>
        <Field label="Nome no App" error={errors.appname?.message}>
          <input {...register('appname')} className={input} placeholder="ABC Gás" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Subdomain / Código" error={errors.subdomain?.message}>
          <input {...register('subdomain')} className={input} placeholder="abc-gas" />
          <p className="text-xs text-gray-400 mt-1">Identificador único: apenas minúsculas, números e hífens</p>
        </Field>
        <Field label="Email de Contato" error={errors.email?.message}>
          <input {...register('email')} type="email" className={input} placeholder="contato@abc.com" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Telefone" error={errors.phone?.message}>
          <input {...register('phone')} className={input} placeholder="(11) 99999-9999" />
        </Field>
        <Field label="Status">
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" {...register('isactive')} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-gray-700">Distribuidora ativa</span>
          </label>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cor Primária" error={errors.primarycolor?.message}>
          <div className="flex gap-2">
            <input
              type="color"
              value={primarycolor}
              onChange={(e) => setValue('primarycolor', e.target.value)}
              className="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
            />
            <input {...register('primarycolor')} className={`${input} flex-1`} placeholder="#FF5722" />
          </div>
        </Field>
        <Field label="Cor Secundária" error={errors.secondarycolor?.message}>
          <div className="flex gap-2">
            <input
              type="color"
              value={secondarycolor}
              onChange={(e) => setValue('secondarycolor', e.target.value)}
              className="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
            />
            <input {...register('secondarycolor')} className={`${input} flex-1`} placeholder="#2196F3" />
          </div>
        </Field>
      </div>

      <Field label="URL do Logo" error={errors.logourl?.message}>
        <input {...register('logourl')} className={input} placeholder="https://..." />
        {watch('logourl') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={watch('logourl')} alt="preview" className="mt-2 h-16 object-contain rounded border border-gray-200 p-1" />
        )}
      </Field>

      <Field label="URL da Splash Screen" error={errors.splashscreenurl?.message}>
        <input {...register('splashscreenurl')} className={input} placeholder="https://..." />
      </Field>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
