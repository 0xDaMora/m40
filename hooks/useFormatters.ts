/**
 * Hook personalizado para formateo
 */

import { useMemo } from 'react'
import { formatCurrency, formatPercentage, formatDate, formatNumber, formatAge, formatWeeks } from '@/lib/utils/formatters'

export const useFormatters = () => {
  const formatters = useMemo(() => ({
    currency: formatCurrency,
    percentage: formatPercentage,
    date: formatDate,
    number: formatNumber,
    age: formatAge,
    weeks: formatWeeks
  }), [])

  return formatters
}
