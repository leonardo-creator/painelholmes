import { NextRequest, NextResponse } from 'next/server'
import { ApiSyncService } from '@/lib/sync-service'

export async function POST(request: NextRequest) {
  try {
    // Verificar se tem secret (opcional para segurança)
    const body = await request.json()
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && body.secret !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const syncService = ApiSyncService.getInstance()
    
    // Verificar se já está rodando
    if (syncService.isCurrentlyRunning()) {
      return NextResponse.json(
        { message: 'Sync já está em andamento', skipped: true },
        { status: 200 }
      )
    }

    // Executar sync
    const result = await syncService.syncData()
    
    console.log('⏰ Cron job executado:', result)

    return NextResponse.json({
      ...result,
      executedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro no cron job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para testar o endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Cron endpoint ativo',
    timestamp: new Date().toISOString()
  })
}
