import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/FormField';
import { useZodForm } from '@/hooks/useZodForm';
import { AuthLogin } from '@shared/forms';
import { Api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { track } from '@/services/analytics';

export default function LoginWrapper(){
  const { register, handleSubmit, formState:{errors, isSubmitting} } = useZodForm(AuthLogin);
  const nav = useNavigate();
  const { toast } = useToast();

  async function onSubmit(v:any){
    try{
      await Api.auth.login({ email: v.email, password: v.password });
      toast({ title: 'Login simulado' });
      track('login_ok');
      nav('/', { replace: true });
    }catch(e:any){
      toast({ title: 'Error', description: String(e?.message||e), variant: 'destructive' as any });
    }
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-md">
      <h1 className="text-2xl font-semibold mb-6">Iniciar sesión</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isSubmitting}>
        <FormField label="Correo" required error={errors.email?.message as any}>
          <Input type="email" {...register('email')} required />
        </FormField>
        <FormField label="Contraseña" required error={errors.password?.message as any}>
          <Input type="password" {...register('password')} required minLength={6} />
        </FormField>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>{isSubmitting? 'Iniciando…':'Iniciar sesión'}</Button>
      </form>
    </main>
  );
}
