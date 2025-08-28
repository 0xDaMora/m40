"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Calendar, DollarSign, TrendingUp, Code, Copy, Check } from "lucide-react"

export default function DebugEstrategia() {
  const [debugCode, setDebugCode] = useState("")
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDebug = async () => {
    if (!debugCode.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/debug-estrategia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debugCode: debugCode.trim() }),
      })

      const json = await res.json()
      setResultado(json)
      console.log("🔍 Debug completo:", json)
    } catch (error) {
      console.error("❌ Error en debug:", error)
      alert("Error al obtener detalles")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatNumber = (num: number) => num?.toLocaleString('es-MX') || '0'

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Debug de Estrategia M40</h1>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={debugCode}
              onChange={(e) => setDebugCode(e.target.value)}
              placeholder="Pega aquí el código DEBUG_..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleDebug()}
            />
            <button
              onClick={handleDebug}
              disabled={!debugCode.trim() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? "Analizando..." : "Analizar"}
            </button>
          </div>

          <div className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Copia el código de debug que aparece en la consola después de una simulación
          </div>
        </div>

        {resultado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header de la estrategia */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📊 Estrategia: {resultado.estrategia?.estrategia} - {resultado.estrategia?.umaElegida} UMA
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Pensión Mensual</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${formatNumber(resultado.estrategia?.pensionMensual)}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Inversión Total</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${formatNumber(resultado.estrategia?.inversionTotal)}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">ROI (20 años)</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {resultado.estrategia?.ROI}x
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 mb-1">Meses M40</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {resultado.estrategia?.mesesM40}
                  </p>
                </div>
              </div>
            </div>

            {/* Cálculos finales */}
            {resultado.calculosFinales && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Cálculos Finales
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">SDI Promedio (58 meses):</span>
                      <span className="font-semibold">${formatNumber(resultado.calculosFinales.sdiPromedio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Semanas Totales:</span>
                      <span className="font-semibold">{resultado.calculosFinales.semanasTotales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Porcentaje Ley 73:</span>
                      <span className="font-semibold">{resultado.calculosFinales.porcentajePension}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Factor de Edad:</span>
                      <span className="font-semibold">{resultado.calculosFinales.factorEdad}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pensión Base:</span>
                      <span className="font-semibold">${formatNumber(resultado.calculosFinales.pensionBase)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Con Ley Fox (1.11):</span>
                      <span className="font-semibold">${formatNumber(resultado.calculosFinales.conLeyFox)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ayuda Familiar:</span>
                      <span className="font-semibold">${formatNumber(resultado.calculosFinales.pensionFinal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final con Aguinaldo Proregateado:</span>
                      <span className="font-semibold text-green-600">${formatNumber(resultado.calculosFinales.pensionConAguinaldo)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detalles mensuales */}
            {resultado.detallesMensuales && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Pagos Mensuales en M40
                  </h3>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(resultado.detallesMensuales, null, 2))}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar JSON"}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left">Mes</th>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">UMA</th>
                        <th className="px-3 py-2 text-left">SDI Mensual</th>
                        <th className="px-3 py-2 text-left">Tasa M40</th>
                        <th className="px-3 py-2 text-left">Cuota Mensual</th>
                        <th className="px-3 py-2 text-left">Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.detallesMensuales.map((mes: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-3 py-2 font-medium">{index + 1}</td>
                          <td className="px-3 py-2">{mes.fecha}</td>
                          <td className="px-3 py-2">{formatNumber(mes.uma)}</td>
                          <td className="px-3 py-2">${formatNumber(mes.sdiMensual)}</td>
                          <td className="px-3 py-2">{(mes.tasa * 1).toFixed(1)}%</td>
                          <td className="px-3 py-2 font-semibold text-blue-600">
                            ${formatNumber(mes.cuotaMensual)}
                          </td>
                          <td className="px-3 py-2 text-green-600">
                            ${formatNumber(mes.acumulado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            

            {/* JSON Raw */}
            <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-xs overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">JSON Completo:</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(resultado, null, 2))}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                >
                  Copiar
                </button>
              </div>
              <pre>{JSON.stringify(resultado, null, 2)}</pre>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}