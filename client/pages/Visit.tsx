import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FormField from '@/components/ui/FormField';
import ActionBar from '@/components/ui/ActionBar';
import { Input } from '@/components/ui/input';
import { Api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { useZodForm } from '@/hooks/useZodForm';
import { VisitInput } from '@shared/forms';
import { track } from '@/services/analytics';

export default function VisitPage() {
  const [params] = useSearchParams();
  const listingId = params.get('listingId') || '';
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useZodForm(VisitInput, { listingId });
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(()=>{ if (listingId) reset({ listingId }); }, [listingId, reset]);

  async function onSubmit(values: any) {
    try {
      if (values.company) { toast({ title: 'Solicitud registrada' }); reset(); return; }
      await Api.visit({ listing_id: values.listingId, name: values.name, email: values.email, phone_e164: values.phone, datetime: values.datetime });
      toast({ title: 'Solicitud registrada' });
      track('visit_submit_ok', { listingId: values.listingId });
      reset();
      nav(-1);
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' as any });
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white border rounded-2xl p-4 space-y-3">
        <h1 className="text-lg font-semibold">Agendar visita</h1>
        {!listingId && (<p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2">No se detectó listingId en la URL. Puedes pegarlo manualmente.</p>)}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" aria-busy={isSubmitting}>
          {!listingId && (
            <FormField label="ID de propiedad" required error={errors.listingId?.message as any}>
              <Input {...register('listingId')} required />
            </FormField>
          )}
          <FormField label="Nombre" required error={errors.name?.message as any}>
            <Input {...register('name')} required />
          </FormField>
          <FormField label="Email" required error={errors.email?.message as any}>
            <Input type="email" {...register('email')} required />
          </FormField>
          <FormField label="Teléfono" error={errors.phone?.message as any}>
            <Input {...register('phone')} />
          </FormField>
          <FormField label="Fecha y hora preferida" error={errors.datetime?.message as any}>
            <Input type="datetime-local" {...register('datetime')} />
          </FormField>
          <input type="hidden" {...register('listingId')} />
          <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register('company')} />
          <ActionBar primaryText={isSubmitting ? 'Solicitando…' : 'Solicitar'} busy={isSubmitting} />
        </form>
      </div>
    </div>
  );
}
