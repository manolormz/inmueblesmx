import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FormField from '@/components/ui/FormField';
import ActionBar from '@/components/ui/ActionBar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { useZodForm } from '@/hooks/useZodForm';
import { LeadInput } from '@shared/forms';
import { track } from '@/services/analytics';

export default function LeadPage() {
  const [params] = useSearchParams();
  const listingId = params.get('listingId') || '';
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useZodForm(LeadInput, { listingId });
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(()=>{ if (listingId) reset({ listingId }); }, [listingId, reset]);

  async function onSubmit(values: any) {
    try {
      if (values.company) { toast({ title: 'Enviado' }); reset(); return; }
      await Api.lead({ listing_id: values.listingId, name: values.name, email: values.email, phone_e164: values.phone, message: values.message, company: values.company });
      toast({ title: 'Enviado', description: 'Gracias por tu interés.' });
      track('lead_submit_ok', { listingId: values.listingId });
      reset();
      nav(-1);
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' as any });
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white border rounded-2xl p-4 space-y-3">
        <h1 className="text-lg font-semibold">Estoy interesado</h1>
        {!listingId && (<p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2">No se detectó listingId en la URL. Puedes pegarlo manualmente.</p>)}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" aria-busy={isSubmitting}>
          <FormField label="Nombre" required error={errors.name?.message as any}>
            <Input {...register('name')} required />
          </FormField>
          <FormField label="Email" required error={errors.email?.message as any}>
            <Input type="email" {...register('email')} required />
          </FormField>
          <FormField label="Teléfono" error={errors.phone?.message as any}>
            <Input {...register('phone')} />
          </FormField>
          <FormField label="Mensaje" error={errors.message?.message as any}>
            <Textarea rows={4} {...register('message')} />
          </FormField>
          <input type="hidden" {...register('listingId')} />
          <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register('company')} />
          <ActionBar primaryText={isSubmitting ? 'Enviando…' : 'Enviar'} busy={isSubmitting} />
        </form>
      </div>
    </div>
  );
}
