import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FormField from '@/components/ui/FormField';
import ActionBar from '@/components/ui/ActionBar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export default function LeadPage() {
  const [params] = useSearchParams();
  const listingId = params.get('listingId') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId) return toast({ title: 'Falta listingId' });
    setBusy(true);
    try {
      await Api.lead({ listing_id: listingId, name, email, phone_e164: phone, message });
      toast({ title: 'Enviado', description: 'Gracias por tu interés.' });
      nav(-1);
    } catch (err: any) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' as any });
    } finally { setBusy(false); }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white border rounded-2xl p-4 space-y-3">
        <h1 className="text-lg font-semibold">Estoy interesado</h1>
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
          <FormField label="Mensaje">
            <Textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} />
          </FormField>
          <input type="hidden" name="listingId" value={listingId} />
          <ActionBar primaryText="Enviar" busy={busy} />
        </form>
      </div>
    </div>
  );
}
