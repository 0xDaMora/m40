import { useState } from "react"

export function useModalManager() {
  // Estados de modales
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showStrategyPurchaseModal, setShowStrategyPurchaseModal] = useState(false)
  const [selectedStrategyForPurchase, setSelectedStrategyForPurchase] = useState<any>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  // Acciones para PurchaseModal
  const openPurchaseModal = () => {
    setShowPurchaseModal(true)
  }

  const closePurchaseModal = () => {
    setShowPurchaseModal(false)
  }

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
    setShowPurchaseModal(false)
    setShowStrategyPurchaseModal(false)
    setShowPremiumModal(false)
    setSelectedStrategyForPurchase(null)
  }

  return {
    // Estados
    showPurchaseModal,
    showStrategyPurchaseModal,
    selectedStrategyForPurchase,
    showPremiumModal,

    // Acciones
    openPurchaseModal,
    closePurchaseModal,
    openStrategyPurchaseModal,
    closeStrategyPurchaseModal,
    openPremiumModal,
    closePremiumModal,
    closeAllModals
  }
}

