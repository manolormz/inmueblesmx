import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '@/components/ui/FormField';
import ActionBar from '@/components/ui/ActionBar';
import { Input } from '@/components/ui/input';
import { Api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export default function AgencyPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return toast({ title: 'Faltan campos requeridos' });
    setBusy(true);
    try {
      await Api.agencyCreate({ name, slug, phone, website });
      toast({ title: 'Agencia registrada (simulado)' });
      nav('/');
    } catch (err: any) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' as any });
    } finally { setBusy(false); }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white border rounded-2xl p-4 space-y-3">
        <h1 className="text-lg font-semibold">Alta de inmobiliaria</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <FormField label="Nombre" required>
            <Input value={name} onChange={e=>setName(e.target.value)} required />
          </FormField>
          <FormField label="Slug" required hint="Identificador único en URL">
            <Input value={slug} onChange={e=>setSlug(e.target.value)} required />
          </FormField>
          <FormField label="Teléfono">
            <Input value={phone} onChange={e=>setPhone(e.target.value)} />
          </FormField>
          <FormField label="Sitio web">
            <Input type="url" value={website} onChange={e=>setWebsite(e.target.value)} />
          </FormField>
          <ActionBar primaryText="Registrar" busy={busy} />
        </form>
      </div>
    </div>
  );
}
