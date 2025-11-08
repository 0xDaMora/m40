import Link from "next/link"
import { Shield, Mail, FileText, HelpCircle, Calculator } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Información de la empresa */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 32 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8"
                >
                  {/* Fondo circular azul */}
                  <circle cx="16" cy="16" r="16" fill="#2563eb"/>
                  
                  {/* Texto M40 en blanco */}
                  <text 
                    x="16" 
                    y="22" 
                    fontFamily="Arial, sans-serif" 
                    fontSize="14" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    fill="white"
                  >
                    M40
                  </text>
                  
                  {/* Pequeño acento dorado */}
                  <circle cx="24" cy="8" r="3" fill="#f59e0b"/>
                </svg>
              </div>
              <span className="font-bold text-white">Pensiones</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Tu calculadora oficial para optimizar tu pensión del IMSS con Modalidad 40.
            </p>
            <div className="flex items-center gap-2 text-green-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Cálculos verificados con IMSS</span>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="font-bold text-white mb-4">Servicios</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#calculadora" className="text-gray-400 hover:text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Calculadora gratuita
                </Link>
              </li>
              <li>
                <Link href="#plan-basico" className="text-gray-400 hover:text-white">
                  Plan Básico - $50 MXN
                </Link>
              </li>
              <li>
                <Link href="#plan-premium" className="text-gray-400 hover:text-white">
                  Plan Premium - $200 MXN
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="font-bold text-white mb-4">Soporte</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#preguntas-frecuentes" className="text-gray-400 hover:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link href="mailto:soporte@m40.mx" className="text-gray-400 hover:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  soporte@m40.mx
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacidad" className="text-gray-400 hover:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-gray-400 hover:text-white">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/deslinde" className="text-gray-400 hover:text-white">
                  Deslinde legal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} M40.mx - Todos los derechos reservados
            </p>
            <p className="text-gray-500 text-xs">
              Los cálculos son estimaciones basadas en la normativa vigente del IMSS. 
              Consulte siempre con un especialista antes de tomar decisiones financieras.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
  