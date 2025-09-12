import { API_CONFIG, ApiResponseSchema, SyncStatus } from './types'
import { prisma } from './prisma'

export class ApiSyncService {
  private static instance: ApiSyncService
  private isRunning = false

  private constructor() {}

  public static getInstance(): ApiSyncService {
    if (!ApiSyncService.instance) {
      ApiSyncService.instance = new ApiSyncService()
    }
    return ApiSyncService.instance
  }

  async syncData(): Promise<{ success: boolean; message: string; recordsProcessed: number }> {
    if (this.isRunning) {
      return { success: false, message: 'Sync já está em andamento', recordsProcessed: 0 }
    }

    this.isRunning = true
    let syncLog: any = null

    try {
      console.log('🚀 Iniciando sync dos dados...')
      
      syncLog = await prisma.syncLog.create({
        data: {
          status: SyncStatus.RUNNING,
          message: 'Iniciando sincronização...'
        }
      })

      console.log('� Log de sync criado:', syncLog.id)
      
      // Construir URL da API com encoding correto
      const apiUrl = `${API_CONFIG.baseUrl}/api/scrape?email=${encodeURIComponent(API_CONFIG.email)}&password=${encodeURIComponent(API_CONFIG.password)}&contrato=${encodeURIComponent(API_CONFIG.contratos)}`

      console.log('📡 Fazendo request para:', apiUrl.substring(0, 100) + '...')
      
      // Fazer request para API externa
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PainelHolmes/1.0'
        },
        // Timeout de 10 minutos para requests longos
        signal: AbortSignal.timeout(10 * 60 * 1000)
      })

      console.log('📈 Response status:', response.status)

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}: ${response.statusText}`)
      }

      const rawData = await response.json()
      console.log('📦 Dados recebidos, tamanho:', JSON.stringify(rawData).length, 'chars')

      // Validar estrutura da resposta
      const validatedData = ApiResponseSchema.parse(rawData)

      if (!validatedData.success) {
        throw new Error('API retornou sucesso=false')
      }

      console.log(`📊 Processando ${validatedData.data.length} contratos...`)

      let totalRecordsProcessed = 0

      // Processar cada contrato sem transação complexa
      for (const contratoData of validatedData.data) {
        try {
          console.log(`📋 Processando contrato ${contratoData.contrato}...`)

          // Buscar ou criar contrato
          const contrato = await prisma.contrato.upsert({
            where: { numero: contratoData.contrato },
            update: { updatedAt: new Date() },
            create: { numero: contratoData.contrato }
          })

          // Remover registros antigos deste contrato
          await prisma.registro.deleteMany({
            where: { contratoId: contrato.id }
          })

          // Inserir novos registros diretamente, sem transação
          for (const registro of contratoData.registros) {
            try {
              await prisma.registro.create({
                data: {
                  contratoId: contrato.id,
                  autor: registro.autor,
                  data: registro.data,
                  extraInfo: registro.extra_info,
                  numero: registro.numero || '',
                  prazo: registro.prazo,
                  status: registro.status,
                  tipo: registro.tipo
                }
              })
              totalRecordsProcessed++
            } catch (recordError) {
              console.error(`❌ Erro ao inserir registro:`, recordError)
              // Continue com o próximo registro
            }
          }

          console.log(`✅ Contrato ${contratoData.contrato} processado com ${contratoData.registros.length} registros`)
        } catch (contractError) {
          console.error(`❌ Erro ao processar contrato ${contratoData.contrato}:`, contractError)
          // Continue com o próximo contrato em caso de erro
        }
      }

      // Atualizar log de sucesso se foi criado
      if (syncLog) {
        try {
          await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
              status: SyncStatus.SUCCESS,
              endedAt: new Date(),
              message: `Sincronização concluída com sucesso`,
              recordsProcessed: totalRecordsProcessed
            }
          })
        } catch (logError) {
          console.error('❌ Erro ao atualizar log de sucesso:', logError)
        }
      }

      console.log(`✅ Sync concluído! ${totalRecordsProcessed} registros processados`)
      
      return { 
        success: true, 
        message: `Sincronização concluída com sucesso`,
        recordsProcessed: totalRecordsProcessed 
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('❌ Erro durante sync:', errorMessage)
      console.error('❌ Stack trace:', error)

      // Atualizar log de erro se foi criado
      if (syncLog) {
        try {
          await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
              status: SyncStatus.ERROR,
              endedAt: new Date(),
              message: `Erro: ${errorMessage}`
            }
          })
        } catch (logError) {
          console.error('❌ Erro ao atualizar log:', logError)
        }
      }

      return { 
        success: false, 
        message: errorMessage,
        recordsProcessed: 0 
      }
    } finally {
      this.isRunning = false
    }
  }

  async getLastSync() {
    return await prisma.syncLog.findFirst({
      orderBy: { startedAt: 'desc' }
    })
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning
  }
}
