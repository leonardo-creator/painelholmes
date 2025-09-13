'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RegistroData } from '@/components/data-table'

interface ApiResponse {
  readonly data: RegistroData[]
  readonly pagination: {
    readonly page: number
    readonly pageSize: number
    readonly total: number
    readonly totalPages: number
    readonly hasNext: boolean
    readonly hasPrevious: boolean
  }
  readonly stats: Record<string, number>
  readonly contratos: Array<{ numero: string; total: number }>
  readonly tipos: Array<{ tipo: string; total: number }>
}

interface SyncStatus {
  readonly isRunning: boolean
  readonly lastSync?: {
    readonly id: string
    readonly status: string
    readonly message?: string
    readonly startedAt: string
    readonly endedAt?: string
    readonly recordsProcessed: number
  }
}

export function useData() {
  const [data, setData] = useState<RegistroData[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [contratos, setContratos] = useState<Array<{ numero: string; total: number }>>([])
  const [tipos, setTipos] = useState<Array<{ tipo: string; total: number }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isRunning: false })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/data?pageSize=1000') // Buscar mais dados para o dashboard
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const result: ApiResponse = await response.json()
      
      setData(result.data)
      setStats(result.stats)
      setContratos(result.contratos)
      setTipos(result.tipos)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao buscar dados:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync')
      if (response.ok) {
        const status: SyncStatus = await response.json()
        setSyncStatus(status)
      }
    } catch (err) {
      console.error('Erro ao buscar status do sync:', err)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/sync', { method: 'POST' })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao sincronizar')
      }
      
      // Aguardar um pouco e buscar dados atualizados
      setTimeout(() => {
        fetchData()
        fetchSyncStatus()
      }, 1000)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    }
  }, [fetchData, fetchSyncStatus])

  const exportData = useCallback(async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      const response = await fetch(`/api/export?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Erro ao exportar dados')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
  const filename = `painel-holmes-${new Date().toISOString().split('T')[0]}.${format}`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar'
      setError(errorMessage)
      console.error('Erro ao exportar:', errorMessage)
    }
  }, [])

  // Buscar dados na inicialização
  useEffect(() => {
    fetchData()
    fetchSyncStatus()
  }, [fetchData, fetchSyncStatus])

  // Atualizar status do sync a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetchSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchSyncStatus])

  return {
    data,
    stats,
    contratos,
    tipos,
    isLoading,
    error,
    syncStatus,
    refetch: fetchData,
    triggerSync,
    exportData
  }
}
