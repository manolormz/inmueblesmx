import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '@/components/ui/FormField';
import ActionBar from '@/components/ui/ActionBar';
import { Input } from '@/components/ui/input';
import { Api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { useZodForm } from '@/hooks/useZodForm';
import { AgencyInput } from '@shared/forms';
import { track } from '@/services/analytics';

function slugifyES(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AgencyPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useZodForm(AgencyInput);
  const { toast } = useToast();
  const nav = useNavigate();
  const slugTouched = useRef(false);

  const nameVal = watch('name');
  const slugVal = watch('slug');

  useEffect(() => {
    if (!slugTouched.current && nameVal && !slugVal) {
      setValue('slug', slugifyES(nameVal));
    }
  }, [nameVal, slugVal, setValue]);

  async function onSubmit(values: any) {
    try {
      if (values.company) { toast({ title: 'Agencia registrada (simulado)' }); reset(); return; }
      await Api.agencyCreate({ name: values.name, slug: values.slug, phone: values.phone, website: values.website });
      toast({ title: 'Agencia registrada (simulado)' });
      track('agency_submit_ok', { slug: values.slug });
      reset();
      nav('/');
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' as any });
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white border rounded-2xl p-4 space-y-3">
        <h1 className="text-lg font-semibold">Alta de inmobiliaria</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" aria-busy={isSubmitting}>
          <FormField label="Nombre" required error={errors.name?.message as any}>
            <Input {...register('name')} required />
          </FormField>
          <FormField label="Slug" required hint="Identificador único en URL" error={errors.slug?.message as any}>
            <Input {...register('slug')} required onChange={(e)=>{ slugTouched.current = true; (register('slug').onChange as any)(e); }} />
          </FormField>
          <FormField label="Teléfono" error={errors.phone?.message as any}>
            <Input {...register('phone')} />
          </FormField>
          <FormField label="Sitio web" error={errors.website?.message as any}>
            <Input type="url" {...register('website')} />
          </FormField>
          <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register('company')} />
          <ActionBar primaryText={isSubmitting ? 'Registrando…' : 'Registrar'} busy={isSubmitting} />
        </form>
      </div>
    </div>
  );
}
