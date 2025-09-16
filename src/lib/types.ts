import { z } from 'zod'

// Schema para validar a resposta da API externa
export const ApiResponseSchema = z.object({
  data: z.array(z.object({
    contrato: z.string(),
    registros: z.array(z.object({
      autor: z.string(),
      data: z.string(),
      extra_info: z.string(),
      numero: z.string(),
      prazo: z.string(),
      status: z.string(),
      tipo: z.string(),
    }))
  })),
  success: z.boolean()
})

export type ApiResponse = z.infer<typeof ApiResponseSchema>

// Schema para validar registros individuais
export const RegistroSchema = z.object({
  autor: z.string(),
  data: z.string(),
  extraInfo: z.string(),
  numero: z.string().optional(),
  prazo: z.string(),
  status: z.string(),
  tipo: z.string(),
})

export type Registro = z.infer<typeof RegistroSchema>

// Enum para status do sync
export enum SyncStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Configuração da API externa
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://31.97.254.228:5000',
  email: process.env.API_EMAIL || 'leonardojuvencio@brkambiental.com.br',
  password: process.env.API_PASSWORD || '@i#f1oHA5pAU32$$$%',
  contratos: process.env.API_CONTRATOS || '4600013206,4600013454,4600012367,4600013465,4600011099,4600012045'
} as const
