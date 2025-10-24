import { Button } from "@/components/ui/button";
import { CheckCircle, TrendingUp, Users } from "lucide-react";

export function CTA() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Why Choose Us */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              ¿Por qué elegir Kentra?
            </h2>
            <p className="text-gray-600 text-lg">
              La plataforma más confiable para comprar, vender y rentar en México
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mejores precios
              </h3>
              <p className="text-gray-600">
                Acceso a las propiedades más competitivas del mercado
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Expertos locales
              </h3>
              <p className="text-gray-600">
                Agentes profesionales en cada región del país
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Proceso seguro
              </h3>
              <p className="text-gray-600">
                Transacciones verificadas y protegidas legalmente
              </p>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-primary to-primaryhover rounded-2xl p-8 sm:p-12 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Recibe notificaciones de nuevas propiedades
          </h3>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Suscríbete a nuestro boletín y sé el primero en conocer las mejores
            oportunidades inmobiliarias
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-3 rounded-lg outline-none"
            />
            <Button className="bg-white text-primary hover:bg-gray-100 font-semibold px-6">
              Suscribirse
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
