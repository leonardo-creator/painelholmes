import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as Papa from 'papaparse'
import { extractTipo, parseAutor, parseExtraInfo } from '@/lib/smart-parser'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
  const format = (searchParams.get('format') || 'csv').toLowerCase()
    
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

    // Formatar dados para export (flattened: 1 linha por pendência)
    const data = registros.flatMap((registro) => {
      const tipoExibicao = extractTipo(registro.data)
      const autorInfo = parseAutor(registro.autor)
      const items = parseExtraInfo(registro.extraInfo)

      const base = {
        Contrato: registro.contrato.numero,
        Status: registro.status,
        Tipo: tipoExibicao || registro.tipo,
        Autor: registro.autor,
        Protocolo: autorInfo.protocolo || '',
        Funcionário: autorInfo.funcionario || '',
        Escopo: autorInfo.escopo || '',
        'Contrato Filho': autorInfo.contratoFilho || '',
        Data: registro.data,
        Número: registro.numero || '',
        Prazo: registro.prazo,
        'Criado em': registro.createdAt.toISOString(),
        'Atualizado em': registro.updatedAt.toISOString(),
      }

      if (items.length === 0) {
        return [{
          ...base,
          Ação: '',
          Responsável: '',
          'Prazo (extra)': '',
          'Δ (dias)': '',
          'Informações Extras': registro.extraInfo.replace(/\n/g, ' '),
        }]
      }

      return items.map((it) => ({
        ...base,
        Ação: it.acao || '',
        Responsável: it.responsavel || '',
        'Prazo (extra)': it.prazoDate ? it.prazoDate.toISOString() : (it.prazoText || ''),
        'Δ (dias)': it.deltaDias ?? '',
        'Informações Extras': registro.extraInfo.replace(/\n/g, ' '),
      }))
    })

    if (format === 'json') {
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Content-Disposition', `attachment; filename="painel-holmes-${new Date().toISOString().split('T')[0]}.json"`)
      
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers
      })
    }

    if (format === 'xlsx') {
      // Lazy import to avoid adding to serverless bundle unless needed
      const XLSX = await import('xlsx')
      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Registros')
  const wbout = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

      const headers = new Headers()
      headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      headers.set('Content-Disposition', `attachment; filename="painel-holmes-${new Date().toISOString().split('T')[0]}.xlsx"`)

  return new NextResponse(new Uint8Array(wbout), { status: 200, headers })
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
