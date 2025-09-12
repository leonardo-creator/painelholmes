import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as Papa from 'papaparse'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    
    // Buscar todos os registros para export
    const registros = await prisma.registro.findMany({
      include: {
        contrato: {
          select: {
            numero: true
          }
        }
      },
      orderBy: {
        prazo: 'desc'
      }
    })

    // Formatar dados para export
    const data = registros.map(registro => ({
      'Contrato': registro.contrato.numero,
      'Autor': registro.autor,
      'Data': registro.data,
      'Número': registro.numero || '',
      'Prazo': registro.prazo,
      'Status': registro.status,
      'Tipo': registro.tipo,
      'Informações Extras': registro.extraInfo.replace(/\n/g, ' '),
      'Criado em': registro.createdAt.toISOString(),
      'Atualizado em': registro.updatedAt.toISOString()
    }))

    if (format === 'json') {
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Content-Disposition', `attachment; filename="painel-holmes-${new Date().toISOString().split('T')[0]}.json"`)
      
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers
      })
    }

    // Default: CSV
    const csv = Papa.unparse(data, {
      delimiter: ';',
      header: true
    })

    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="painel-holmes-${new Date().toISOString().split('T')[0]}.csv"`)
    
    return new NextResponse('\ufeff' + csv, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Erro na API de export:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
