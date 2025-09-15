import { useState } from "react"

export function useModalManager() {
  // Estados de modales
  const [showStrategyPurchaseModal, setShowStrategyPurchaseModal] = useState(false)
  const [selectedStrategyForPurchase, setSelectedStrategyForPurchase] = useState<any>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  // Acciones para StrategyPurchaseModal
  const openStrategyPurchaseModal = (strategy: any) => {
    setSelectedStrategyForPurchase(strategy)
    setShowStrategyPurchaseModal(true)
  }

  const closeStrategyPurchaseModal = () => {
    setShowStrategyPurchaseModal(false)
    setSelectedStrategyForPurchase(null)
  }

  // Acciones para PremiumModal
  const openPremiumModal = () => {
    setShowPremiumModal(true)
  }

  const closePremiumModal = () => {
    setShowPremiumModal(false)
  }

  // Cerrar todos los modales
  const closeAllModals = () => {
    setShowStrategyPurchaseModal(false)
    setShowPremiumModal(false)
    setSelectedStrategyForPurchase(null)
  }

  return {
    // Estados
    showStrategyPurchaseModal,
    selectedStrategyForPurchase,
    showPremiumModal,

    // Acciones
    openStrategyPurchaseModal,
    closeStrategyPurchaseModal,
    openPremiumModal,
    closePremiumModal,
    closeAllModals
  }
}

