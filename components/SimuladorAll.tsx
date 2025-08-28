"use client"

import { useState, useMemo } from "react"

interface Escenario {
  mesesM40: number
  estrategia: string
  umaElegida: number
  inversionTotal: number
  pensionMensual: number | null
  pensionConAguinaldo: number | null
  ROI: number | null
  recuperacionMeses: number | null
}

export default function SimuladorAll() {
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<Escenario[]>([])
  const [filtro, setFiltro] = useState("ROI")
  const [minPension, setMinPension] = useState(0)
  const [maxInversion, setMaxInversion] = useState<number | null>(null)
  const [pesoPension, setPesoPension] = useState(1)
  const [pesoRecuperacion, setPesoRecuperacion] = useState(100)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const body = {
      fechaNacimiento: formData.get("fechaNacimiento"),
      edadJubilacion: formData.get("edadJubilacion"),
      semanasPrevias: formData.get("semanasPrevias"),
      sdiHistorico: formData.get("sdiHistorico"),
      umaMin: formData.get("umaMin"),
      umaMax: formData.get("umaMax"),
      dependiente: "conyuge",
    }

    const res = await fetch("/api/all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setResultados(data.escenarios || [])
    setLoading(false)
  }

  // Calcular score y aplicar filtros
  const filtrados = useMemo(() => {
    return resultados
      .map((r) => {
        let score = null
        if (r.pensionMensual && r.recuperacionMeses) {
          score =
            pesoPension * r.pensionMensual -
            pesoRecuperacion * r.recuperacionMeses
        }
        return { ...r, score }
      })
      .filter(
        (r) =>
          (!minPension || (r.pensionMensual ?? 0) >= minPension) &&
          (!maxInversion || r.inversionTotal <= maxInversion)
      )
      .sort((a, b) => {
        switch (filtro) {
          case "ROI":
            return (b.ROI ?? 0) - (a.ROI ?? 0)
          case "pension":
            return (b.pensionMensual ?? 0) - (a.pensionMensual ?? 0)
          case "inversion":
            return a.inversionTotal - b.inversionTotal
          case "recuperacion":
            return (a.recuperacionMeses ?? 0) - (b.recuperacionMeses ?? 0)
          case "score":
            return (b.score ?? -Infinity) - (a.score ?? -Infinity)
          default:
            return 0
        }
      })
  }, [resultados, filtro, minPension, maxInversion, pesoPension, pesoRecuperacion])

  function formatNumber(val: number | null | undefined) {
    return typeof val === "number" && !isNaN(val)
      ? `$${val.toLocaleString()}`
      : "N/A"
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Simulador Modalidad 40 - Todas las estrategias</h2>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <input type="date" name="fechaNacimiento" className="border p-2" required />
        <input type="number" name="edadJubilacion" placeholder="Edad de jubilación (60–65)" className="border p-2" required />
        <input type="number" name="semanasPrevias" placeholder="Semanas previas" className="border p-2" required />
        <input type="number" step="0.01" name="sdiHistorico" placeholder="SDI histórico diario" className="border p-2" required />
        <input type="number" name="umaMin" placeholder="UMA mínima (ej. 5)" className="border p-2" required />
        <input type="number" name="umaMax" placeholder="UMA máxima (ej. 25)" className="border p-2" required />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </form>

      {/* FILTROS */}
      {resultados.length > 0 && (
        <div className="mb-4 flex gap-4 items-center flex-wrap">
          <label>
            Ordenar por:{" "}
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="border p-1">
              <option value="ROI">Mejor ROI</option>
              <option value="pension">Mayor pensión</option>
              <option value="inversion">Menor inversión</option>
              <option value="recuperacion">Menor tiempo de recuperación</option>
              <option value="score">Mejor Score</option>
            </select>
          </label>
          <label>
            Pensión mínima:{" "}
            <input type="number" value={minPension} onChange={(e) => setMinPension(Number(e.target.value))} className="border p-1 w-24" />
          </label>
          <label>
            Inversión máxima:{" "}
            <input type="number" value={maxInversion ?? ""} onChange={(e) => setMaxInversion(e.target.value ? Number(e.target.value) : null)} className="border p-1 w-32" />
          </label>
          <label>
            Peso pensión (α):{" "}
            <input type="number" value={pesoPension} onChange={(e) => setPesoPension(Number(e.target.value))} className="border p-1 w-20" />
          </label>
          <label>
            Peso recuperación (β):{" "}
            <input type="number" value={pesoRecuperacion} onChange={(e) => setPesoRecuperacion(Number(e.target.value))} className="border p-1 w-20" />
          </label>
        </div>
      )}

      {/* TABLA RESULTADOS */}
      {filtrados.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Meses M40</th>
                <th className="border p-2">Estrategia</th>
                <th className="border p-2">UMA</th>
                <th className="border p-2">Inversión Total</th>
                <th className="border p-2">Pensión Mensual</th>
                <th className="border p-2">Con Aguinaldo</th>
                <th className="border p-2">ROI</th>
                <th className="border p-2">Recuperación</th>
                <th className="border p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">{r.mesesM40}</td>
                  <td className="border p-2">{r.estrategia}</td>
                  <td className="border p-2">{r.umaElegida}</td>
                  <td className="border p-2">{formatNumber(r.inversionTotal)}</td>
                  <td className="border p-2">{formatNumber(r.pensionMensual)}</td>
                  <td className="border p-2">{formatNumber(r.pensionConAguinaldo)}</td>
                  <td className="border p-2">{r.ROI ?? "N/A"}</td>
                  <td className="border p-2">{r.recuperacionMeses ?? "N/A"}</td>
                  <td className="border p-2">{r.score ?? "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resultados.length > 0 && filtrados.length === 0 && (
        <p className="mt-4 text-red-600">⚠️ No hay escenarios que cumplan con los filtros seleccionados.</p>
      )}
    </div>
  )
}




