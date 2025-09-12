import { NextRequest, NextResponse } from 'next/server'
import { ApiSyncService } from '@/lib/sync-service'

export async function POST(request: NextRequest) {
  try {
    const syncService = ApiSyncService.getInstance()
    
    // Verificar se já está rodando
    if (syncService.isCurrentlyRunning()) {
      return NextResponse.json(
        { error: 'Sincronização já está em andamento' },
        { status: 409 }
      )
    }

    // Iniciar sync
    const result = await syncService.syncData()

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    })

  } catch (error) {
    console.error('Erro na API de sync:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const syncService = ApiSyncService.getInstance()
    const lastSync = await syncService.getLastSync()
    const isRunning = syncService.isCurrentlyRunning()

    return NextResponse.json({
      isRunning,
      lastSync
    })

  } catch (error) {
    console.error('Erro ao buscar status do sync:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
