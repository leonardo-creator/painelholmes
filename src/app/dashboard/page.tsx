'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RefreshCw, AlertTriangle, Clock, CheckCircle2, Database, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'
import { useData } from '@/hooks/use-data'

export default function Dashboard() {
  const {
    data,
    stats,
    contratos,
    tipos,
    isLoading,
    error,
    syncStatus,
    refetch,
    triggerSync,
    exportData
  } = useData()

  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await triggerSync()
    } catch (err) {
      console.error('Erro no sync manual:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'success'
      case 'error':
        return 'destructive'
      case 'running':
        return 'warning'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Painel Holmes
            </h1>
            <p className="text-muted-foreground">
              Dashboard de monitoramento de contratos e registros
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {syncStatus.lastSync && (
              <Badge variant={getSyncStatusColor(syncStatus.lastSync.status)}>
                <Clock className="mr-1 h-3 w-3" />
                Último sync: {formatDate(syncStatus.lastSync.startedAt)}
              </Badge>
            )}
            
            <Button
              onClick={handleSync}
              disabled={isSyncing || syncStatus.isRunning}
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${(isSyncing || syncStatus.isRunning) ? 'animate-spin' : ''}`} />
              {isSyncing || syncStatus.isRunning ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 pt-6">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
              <p className="text-xs text-muted-foreground">
                Registros no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contratos.length}</div>
              <p className="text-xs text-muted-foreground">
                Contratos diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.Aberto || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registros em aberto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.Concluído || stats.Concluido || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registros finalizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sync Status Card */}
        {syncStatus.lastSync && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Status da Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={getSyncStatusColor(syncStatus.lastSync.status)}>
                    {syncStatus.lastSync.status === 'success' && 'Sucesso'}
                    {syncStatus.lastSync.status === 'error' && 'Erro'}
                    {syncStatus.lastSync.status === 'running' && 'Executando'}
                    {!['success', 'error', 'running'].includes(syncStatus.lastSync.status) && 'Desconhecido'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Registros Processados</p>
                  <p className="text-lg font-semibold">{syncStatus.lastSync.recordsProcessed}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Duração</p>
                  <p className="text-lg font-semibold">
                    {syncStatus.lastSync.endedAt ? 
                      `${Math.round((new Date(syncStatus.lastSync.endedAt).getTime() - new Date(syncStatus.lastSync.startedAt).getTime()) / 1000)}s` :
                      'Em andamento'
                    }
                  </p>
                </div>
              </div>
              
              {syncStatus.lastSync.message && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Mensagem</p>
                  <p className="text-sm text-muted-foreground">{syncStatus.lastSync.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <DataTable
          data={data}
          isLoading={isLoading}
          onRefresh={refetch}
          onExport={exportData}
          stats={stats}
          contratos={contratos}
          tipos={tipos}
        />
      </div>
    </div>
  )
}
