import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const QuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('50'),
  search: z.string().optional(),
  status: z.string().optional(),
  tipo: z.string().optional(),
  contrato: z.string().optional(),
  sortBy: z.string().optional().default('prazo'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const SORTABLE_COLUMNS = ['prazo', 'createdAt', 'updatedAt', 'status', 'autor'] as const
type SortableColumn = typeof SORTABLE_COLUMNS[number]
const isSortableColumn = (value: string): value is SortableColumn =>
  (SORTABLE_COLUMNS as readonly string[]).includes(value as SortableColumn)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = QuerySchema.parse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '50',
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      tipo: searchParams.get('tipo') || undefined,
      contrato: searchParams.get('contrato') || undefined,
      sortBy: searchParams.get('sortBy') || 'prazo',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    })

    const parsedPage = parseInt(query.page, 10)
    const parsedPageSize = parseInt(query.pageSize, 10)
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1)
    const pageSize = Number.isNaN(parsedPageSize) ? 50 : Math.max(parsedPageSize, 1)
    const skip = (page - 1) * pageSize

    const sortBy: SortableColumn = isSortableColumn(query.sortBy) ? query.sortBy : 'prazo'
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

    // Construir filtros
    const where: Prisma.RegistroWhereInput = {}

    if (query.search) {
      where.OR = [
        { autor: { contains: query.search, mode: 'insensitive' } },
        { data: { contains: query.search, mode: 'insensitive' } },
        { extraInfo: { contains: query.search, mode: 'insensitive' } },
        { numero: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.tipo) {
      where.tipo = query.tipo
    }

    if (query.contrato) {
      where.contrato = {
        is: {
          numero: query.contrato
        }
      }
    }

    // Buscar registros com paginação
    const [registros, total] = await Promise.all([
      prisma.registro.findMany({
        where,
        include: {
          contrato: {
            select: {
              numero: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: pageSize
      }),
      prisma.registro.count({ where })
    ])

    // Buscar estatísticas
    const stats = await prisma.registro.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    // Buscar contratos únicos
    const contratos = await prisma.contrato.findMany({
      select: {
        numero: true,
        _count: {
          select: {
            registros: true
          }
        }
      }
    })

    // Buscar tipos únicos
    const tipos = await prisma.registro.groupBy({
      by: ['tipo'],
      _count: {
        tipo: true
      }
    })

    return NextResponse.json({
      data: registros.map(registro => ({
        id: registro.id,
        autor: registro.autor,
        data: registro.data,
        extraInfo: registro.extraInfo,
        numero: registro.numero,
        prazo: registro.prazo,
        status: registro.status,
        tipo: registro.tipo,
        contrato: registro.contrato.numero,
        createdAt: registro.createdAt,
        updatedAt: registro.updatedAt
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status
        return acc
      }, {} as Record<string, number>),
      contratos: contratos.map(c => ({
        numero: c.numero,
        total: c._count.registros
      })),
      tipos: tipos.map(t => ({
        tipo: t.tipo,
        total: t._count.tipo
      }))
    })

  } catch (error) {
    console.error('Erro na API de dados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
