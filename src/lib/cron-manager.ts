import cron from 'node-cron'
import { ApiSyncService } from '@/lib/sync-service'

class CronManager {
  private static instance: CronManager
  private syncJob: cron.ScheduledTask | null = null
  private isJobRunning = false

  private constructor() {
    this.initialize()
  }

  public static getInstance(): CronManager {
    if (!CronManager.instance) {
      CronManager.instance = new CronManager()
    }
    return CronManager.instance
  }

  private initialize() {
    // Executar sync a cada 4 horas (0 */4 * * *)
    this.syncJob = cron.schedule('0 */4 * * *', async () => {
      console.log('⏰ Executando sync automático...')
      
      try {
        const syncService = ApiSyncService.getInstance()
        
        // Verificar se já está rodando
        if (syncService.isCurrentlyRunning()) {
          console.log('⚠️ Sync já está em andamento, pulando execução automática')
          return
        }

        const result = await syncService.syncData()
        
        if (result.success) {
          console.log(`✅ Sync automático concluído: ${result.recordsProcessed} registros processados`)
        } else {
          console.error('❌ Erro no sync automático:', result.message)
        }
        
      } catch (error) {
        console.error('💥 Falha crítica no sync automático:', error)
      }
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    })

    this.isJobRunning = true
    console.log('🕒 Cron job configurado: sync a cada 4 horas')
  }

  public getStatus() {
    return {
      isRunning: this.isJobRunning,
      nextRun: this.syncJob ? 'A cada 4 horas' : 'Não configurado'
    }
  }

  public stop() {
    if (this.syncJob) {
      this.syncJob.stop()
      this.isJobRunning = false
      console.log('⏸️ Cron job interrompido')
    }
  }

  public start() {
    if (this.syncJob && !this.isJobRunning) {
      this.syncJob.start()
      this.isJobRunning = true
      console.log('▶️ Cron job iniciado')
    }
  }
}

// Inicializar o cron manager apenas no servidor
if (typeof window === 'undefined') {
  CronManager.getInstance()
}

export default CronManager
