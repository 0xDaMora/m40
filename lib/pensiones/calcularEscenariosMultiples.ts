import { calcularEscenariosVenta } from "./calcularEscenariosVenta"

export function calcularEscenariosMultiples(parsedInputs: {
  conservador: any
  flexible: any | null
}) {
  const resultados: any = {}

  // Conservador: siempre existe
  resultados.conservador = calcularEscenariosVenta(parsedInputs.conservador)

  // Flexible: solo si no es null
  if (parsedInputs.flexible) {
    resultados.flexible = calcularEscenariosVenta(parsedInputs.flexible)
  }

  return resultados
}
