/**
 * Componente para lazy loading con skeleton
 */

import React, { Suspense, lazy, ComponentType } from 'react'
import { motion } from 'framer-motion'

interface LazyLoaderProps {
  component: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
  props?: any
}

// Skeleton loader genérico
const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg h-8 mb-4"></div>
    <div className="bg-gray-200 rounded-lg h-4 mb-2"></div>
    <div className="bg-gray-200 rounded-lg h-4 mb-2"></div>
    <div className="bg-gray-200 rounded-lg h-4 w-3/4"></div>
  </div>
)

// Skeleton para estrategias
const StrategySkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="bg-gray-200 rounded-lg h-6 w-32"></div>
      <div className="bg-gray-200 rounded-lg h-8 w-24"></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
      ))}
    </div>
    <div className="bg-gray-200 rounded-lg h-12"></div>
  </motion.div>
)

// Skeleton para formularios
const FormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="bg-gray-200 rounded-lg h-12"></div>
    <div className="bg-gray-200 rounded-lg h-12"></div>
    <div className="bg-gray-200 rounded-lg h-12"></div>
    <div className="bg-gray-200 rounded-lg h-12"></div>
  </div>
)

// Skeleton para tablas
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg h-10 mb-4"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-gray-200 rounded-lg h-12 mb-2"></div>
    ))}
  </div>
)

export const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  component, 
  fallback = <SkeletonLoader />,
  props 
}) => {
  const LazyComponent = lazy(component)

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// Componentes lazy predefinidos
export const LazyEstrategiaDetallada = lazy(() => import('@/components/EstrategiaDetallada'))
export const LazyFamilySimulatorIntegration = lazy(() => import('@/components/integration/FamilySimulatorIntegration').then(module => ({ default: module.FamilySimulatorIntegration })))
export const LazyHeroOnboard = lazy(() => import('@/components/HeroOnboard'))
export const LazyDashboard = lazy(() => import('@/app/dashboard/page'))

// Wrappers con skeletons específicos
export const LazyEstrategiaDetalladaWithSkeleton = (props: any) => (
  <LazyLoader 
    component={() => import('@/components/EstrategiaDetallada')}
    fallback={<StrategySkeleton />}
    props={props}
  />
)

export const LazyFamilySimulatorWithSkeleton = (props: any) => (
  <LazyLoader 
    component={() => import('@/components/integration/FamilySimulatorIntegration').then(module => ({ default: module.FamilySimulatorIntegration }))}
    fallback={<FormSkeleton />}
    props={props}
  />
)

export const LazyHeroOnboardWithSkeleton = (props: any) => (
  <LazyLoader 
    component={() => import('@/components/HeroOnboard')}
    fallback={<FormSkeleton />}
    props={props}
  />
)

// Hook para lazy loading con intersection observer
export const useLazyLoad = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, hasLoaded])

  return { ref, isVisible, hasLoaded }
}
