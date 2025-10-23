import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FormField from '@/components/ui/FormField';
import ActionBar from '@/components/ui/ActionBar';
import { Input } from '@/components/ui/input';
import { Api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export default function VisitPage() {
  const [params] = useSearchParams();
  const listingId = params.get('listingId') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [datetime, setDatetime] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId) return toast({ title: 'Falta listingId' });
    setBusy(true);
    try {
      await Api.visit({ listing_id: listingId, name, email, phone_e164: phone, datetime });
      toast({ title: 'Solicitud registrada' });
      nav(-1);
    } catch (err: any) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' as any });
    } finally { setBusy(false); }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white border rounded-2xl p-4 space-y-3">
        <h1 className="text-lg font-semibold">Agendar visita</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <FormField label="Nombre" required>
            <Input value={name} onChange={e=>setName(e.target.value)} required />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </FormField>
          <FormField label="Teléfono">
            <Input value={phone} onChange={e=>setPhone(e.target.value)} />
          </FormField>
          <FormField label="Fecha y hora preferida">
            <Input type="datetime-local" value={datetime} onChange={e=>setDatetime(e.target.value)} />
          </FormField>
          <input type="hidden" name="listingId" value={listingId} />
          <ActionBar primaryText="Solicitar" busy={busy} />
        </form>
      </div>
    </div>
  );
}
