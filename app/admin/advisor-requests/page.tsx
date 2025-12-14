"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { Mail, Calendar, FileText, CheckCircle, Clock, XCircle, RefreshCw, Filter, AlertTriangle, UserCheck } from "lucide-react"
import { toast } from "react-hot-toast"

interface AdvisorRequest {
  id: string
  email: string
  description: string
  status: "pending" | "contacted" | "resolved"
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    email: string
    name: string | null
  } | null
}

interface ErrorReport {
  id: string
  email: string
  description: string
  status: "pending" | "reviewed" | "resolved" | "rewarded"
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    email: string
    name: string | null
  } | null
}

type TabType = "advisor" | "errors"

export default function AdminAdvisorRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("advisor")
  const [requests, setRequests] = useState<AdvisorRequest[]>([])
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const hasRedirected = useRef(false)

  // Verificar autenticación y permisos
  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated" && !hasRedirected.current) {
      hasRedirected.current = true
      router.replace("/")
      return
    }

    // Verificar si es administrador
    if (status === "authenticated" && session?.user) {
      checkAdminAccess()
    }
  }, [status, session, router])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin/advisor-requests?limit=1")
      if (response.status === 403 || response.status === 401) {
        toast.error("No tienes permisos para acceder a esta página")
        router.replace("/dashboard")
      }
    } catch (error) {
      console.error("Error verificando acceso:", error)
    }
  }

  // Cargar solicitudes de asesoría
  const loadRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      })
      
      if (filterStatus !== "all") {
        params.append("status", filterStatus)
      }

      const response = await fetch(`/api/admin/advisor-requests?${params.toString()}`)
      
      if (response.status === 403 || response.status === 401) {
        toast.error("No tienes permisos para ver estas solicitudes")
        router.replace("/dashboard")
        return
      }

      if (!response.ok) {
        throw new Error("Error al cargar solicitudes")
      }

      const data = await response.json()
      setRequests(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error("Error cargando solicitudes:", error)
      toast.error("Error al cargar las solicitudes")
    } finally {
      setLoading(false)
    }
  }

  // Cargar reportes de error
  const loadErrorReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      })
      
      if (filterStatus !== "all") {
        params.append("status", filterStatus)
      }

      const response = await fetch(`/api/admin/error-reports?${params.toString()}`)
      
      if (response.status === 403 || response.status === 401) {
        toast.error("No tienes permisos para ver estos reportes")
        router.replace("/dashboard")
        return
      }

      if (!response.ok) {
        throw new Error("Error al cargar reportes")
      }

      const data = await response.json()
      setErrorReports(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error("Error cargando reportes:", error)
      toast.error("Error al cargar los reportes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      if (activeTab === "advisor") {
        loadRequests()
      } else {
        loadErrorReports()
      }
    }
  }, [status, filterStatus, currentPage, activeTab])

  // Actualizar estado de solicitud
  const updateStatus = async (id: string, newStatus: "pending" | "contacted" | "resolved") => {
    setUpdatingId(id)
    try {
      const response = await fetch("/api/admin/advisor-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar estado")
      }

      toast.success("Estado actualizado exitosamente")
      loadRequests()
    } catch (error: any) {
      console.error("Error actualizando estado:", error)
      toast.error("Error al actualizar el estado")
    } finally {
      setUpdatingId(null)
    }
  }

  // Actualizar estado de reporte de error
  const updateErrorReportStatus = async (id: string, newStatus: "pending" | "reviewed" | "resolved" | "rewarded") => {
    setUpdatingId(id)
    try {
      const response = await fetch("/api/admin/error-reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar estado")
      }

      toast.success("Estado actualizado exitosamente")
      loadErrorReports()
    } catch (error: any) {
      console.error("Error actualizando estado:", error)
      toast.error("Error al actualizar el estado")
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string, type: "advisor" | "error") => {
    if (type === "advisor") {
      const styles = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
        contacted: "bg-blue-100 text-blue-800 border-blue-300",
        resolved: "bg-green-100 text-green-800 border-green-300",
      }

      const icons = {
        pending: Clock,
        contacted: CheckCircle,
        resolved: CheckCircle,
      }

      const labels = {
        pending: "Pendiente",
        contacted: "Contactado",
        resolved: "Resuelto",
      }

      const Icon = icons[status as keyof typeof icons] || Clock
      const style = styles[status as keyof typeof styles] || styles.pending

      return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${style}`}>
          <Icon className="w-3 h-3" />
          {labels[status as keyof typeof labels] || status}
        </span>
      )
    } else {
      const styles = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
        reviewed: "bg-blue-100 text-blue-800 border-blue-300",
        resolved: "bg-green-100 text-green-800 border-green-300",
        rewarded: "bg-purple-100 text-purple-800 border-purple-300",
      }

      const icons = {
        pending: Clock,
        reviewed: CheckCircle,
        resolved: CheckCircle,
        rewarded: CheckCircle,
      }

      const labels = {
        pending: "Pendiente",
        reviewed: "Revisado",
        resolved: "Resuelto",
        rewarded: "Recompensado",
      }

      const Icon = icons[status as keyof typeof icons] || Clock
      const style = styles[status as keyof typeof styles] || styles.pending

      return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${style}`}>
          <Icon className="w-3 h-3" />
          {labels[status as keyof typeof labels] || status}
        </span>
      )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Gestiona solicitudes de asesoría y reportes de errores
              </p>
            </div>
            <button
              onClick={() => activeTab === "advisor" ? loadRequests() : loadErrorReports()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("advisor")
                setCurrentPage(1)
                setFilterStatus("all")
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "advisor"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Solicitudes de Asesoría
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab("errors")
                setCurrentPage(1)
                setFilterStatus("all")
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "errors"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Reportes de Errores
              </div>
            </button>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              {activeTab === "advisor" ? (
                <>
                  <option value="pending">Pendientes</option>
                  <option value="contacted">Contactadas</option>
                  <option value="resolved">Resueltas</option>
                </>
              ) : (
                <>
                  <option value="pending">Pendientes</option>
                  <option value="reviewed">Revisados</option>
                  <option value="resolved">Resueltos</option>
                  <option value="rewarded">Recompensados</option>
                </>
              )}
            </select>
          </div>
        </motion.div>

        {/* Lista de solicitudes o reportes */}
        <div className="space-y-4">
          {activeTab === "advisor" ? (
            requests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg p-12 text-center"
              >
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No hay solicitudes para mostrar</p>
              </motion.div>
            ) : (
              requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.email}</h3>
                          {request.user?.name && (
                            <p className="text-sm text-gray-500">Usuario: {request.user.name}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(request.status, "advisor")}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2 line-clamp-3">{request.description}</p>
                      <button
                        onClick={() => {
                          const fullDescription = request.description
                          if (fullDescription.length > 200) {
                            toast.success("Descripción completa copiada al portapapeles")
                            navigator.clipboard.writeText(fullDescription)
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        {request.description.length > 200 ? "Ver descripción completa" : ""}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Creada: {formatDate(request.createdAt)}</span>
                      </div>
                      {request.updatedAt !== request.createdAt && (
                        <div className="flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" />
                          <span>Actualizada: {formatDate(request.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 lg:min-w-[200px]">
                    <label className="text-xs font-medium text-gray-700">Cambiar estado:</label>
                    <div className="flex flex-col gap-2">
                      {request.status !== "contacted" && (
                        <button
                          onClick={() => updateStatus(request.id, "contacted")}
                          disabled={updatingId === request.id}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingId === request.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Marcar como Contactado
                        </button>
                      )}
                      {request.status !== "resolved" && (
                        <button
                          onClick={() => updateStatus(request.id, "resolved")}
                          disabled={updatingId === request.id}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingId === request.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Marcar como Resuelto
                        </button>
                      )}
                      {request.status !== "pending" && (
                        <button
                          onClick={() => updateStatus(request.id, "pending")}
                          disabled={updatingId === request.id}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingId === request.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          Volver a Pendiente
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción completa (expandible) */}
                {request.description.length > 200 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Ver descripción completa
                    </summary>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
                    </div>
                  </details>
                )}
              </motion.div>
            ))
            )
          ) : (
            errorReports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg p-12 text-center"
              >
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No hay reportes de error para mostrar</p>
              </motion.div>
            ) : (
              errorReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{report.email}</h3>
                            {report.user?.name && (
                              <p className="text-sm text-gray-500">Usuario: {report.user.name}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(report.status, "error")}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2 line-clamp-3">{report.description}</p>
                        <button
                          onClick={() => {
                            const fullDescription = report.description
                            if (fullDescription.length > 200) {
                              toast.success("Descripción completa copiada al portapapeles")
                              navigator.clipboard.writeText(fullDescription)
                            }
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700"
                        >
                          {report.description.length > 200 ? "Ver descripción completa" : ""}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Creado: {formatDate(report.createdAt)}</span>
                        </div>
                        {report.updatedAt !== report.createdAt && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="w-4 h-4" />
                            <span>Actualizado: {formatDate(report.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <label className="text-xs font-medium text-gray-700">Cambiar estado:</label>
                      <div className="flex flex-col gap-2">
                        {report.status !== "reviewed" && (
                          <button
                            onClick={() => updateErrorReportStatus(report.id, "reviewed")}
                            disabled={updatingId === report.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === report.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Marcar como Revisado
                          </button>
                        )}
                        {report.status !== "resolved" && (
                          <button
                            onClick={() => updateErrorReportStatus(report.id, "resolved")}
                            disabled={updatingId === report.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === report.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Marcar como Resuelto
                          </button>
                        )}
                        {report.status !== "rewarded" && (
                          <button
                            onClick={() => updateErrorReportStatus(report.id, "rewarded")}
                            disabled={updatingId === report.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === report.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Marcar como Recompensado
                          </button>
                        )}
                        {report.status !== "pending" && (
                          <button
                            onClick={() => updateErrorReportStatus(report.id, "pending")}
                            disabled={updatingId === report.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === report.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            Volver a Pendiente
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción completa (expandible) */}
                  {report.description.length > 200 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-orange-600 hover:text-orange-700 font-medium">
                        Ver descripción completa
                      </summary>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.description}</p>
                      </div>
                    </details>
                  )}
                </motion.div>
              ))
            )
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

