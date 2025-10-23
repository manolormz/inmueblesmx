import { isSandbox } from '@/utils/env';

export default function SafePreview({ children }: { children: React.ReactNode }) {
  if (isSandbox) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center text-gray-600 border rounded-xl bg-gray-50 p-6">
        <p className="font-medium mb-2">Vista previa deshabilitada en modo editor</p>
        <p className="text-sm opacity-70">
          Por seguridad, el entorno sandbox de Builder no ejecuta código React.
          <br />
          Abre la URL pública para visualizar los formularios, mapa y datos reales.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
