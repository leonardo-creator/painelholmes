'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Download, RefreshCw, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { extractTipo, parseAutor, parseExtraInfo } from '@/lib/smart-parser'

export interface RegistroData {
  readonly id: string
  readonly autor: string
  readonly data: string
  readonly extraInfo: string
  readonly numero?: string
  readonly prazo: string
  readonly status: string
  readonly tipo: string
  readonly contrato: string
  readonly createdAt: string
  readonly updatedAt: string
}

interface DataTableProps {
  readonly data: RegistroData[]
  readonly isLoading: boolean
  readonly onRefresh: () => void
  readonly onExport: (format: 'csv' | 'json') => void
  readonly stats: Record<string, number>
  readonly contratos: Array<{ numero: string; total: number }>
  readonly tipos: Array<{ tipo: string; total: number }>
}

export function DataTable({
  data,
  isLoading,
  onRefresh,
  onExport,
  stats,
  contratos,
  tipos
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  type FlatRowData = {
    id: string
    contrato: string
    status: string
    tipoExibicao: string
    autor: string
    protocolo?: string
    funcionario?: string
    escopo?: string
    contratoFilho?: string
    acao?: string
    responsavel?: string
    prazoText?: string
    prazoDate?: Date | null
    deltaDias?: number | null
    createdAt: string
    updatedAt: string
  }

  const flattenedRows: FlatRowData[] = useMemo(() => {
    const rows: FlatRowData[] = []
    for (const r of data) {
      const tipoExibicao = extractTipo(r.data)
      const autorInfo = parseAutor(r.autor)
      const items = parseExtraInfo(r.extraInfo)

      if (items.length === 0) {
        rows.push({
          id: `${r.id}-0`,
          contrato: r.contrato,
          status: r.status,
          tipoExibicao,
          autor: r.autor,
          protocolo: autorInfo.protocolo,
          funcionario: autorInfo.funcionario,
          escopo: autorInfo.escopo,
          contratoFilho: autorInfo.contratoFilho,
          acao: undefined,
          responsavel: undefined,
          prazoText: undefined,
          prazoDate: null,
          deltaDias: null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
        continue
      }

      items.forEach((it, idx) => {
        rows.push({
          id: `${r.id}-${idx}`,
          contrato: r.contrato,
          status: r.status,
          tipoExibicao,
          autor: r.autor,
          protocolo: autorInfo.protocolo,
          funcionario: autorInfo.funcionario,
          escopo: autorInfo.escopo,
          contratoFilho: autorInfo.contratoFilho,
          acao: it.acao,
          responsavel: it.responsavel,
          prazoText: it.prazoText,
          prazoDate: it.prazoDate ?? null,
          deltaDias: it.deltaDias ?? null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
      })
    }
    return rows
  }, [data])

  const columns: ColumnDef<FlatRowData>[] = useMemo(
    () => [
      {
        accessorKey: 'contrato',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(isSorted === 'asc')}
              className="h-auto p-0 font-medium"
            >
              Contrato
              {isSorted === 'asc' && <ChevronUp className="ml-2 h-4 w-4" />}
              {isSorted === 'desc' && <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="font-mono text-sm">
            {row.getValue('contrato')}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(isSorted === 'asc')}
              className="h-auto p-0 font-medium"
            >
              Status
              {isSorted === 'asc' && <ChevronUp className="ml-2 h-4 w-4" />}
              {isSorted === 'desc' && <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('status')} />
        ),
      },
      // Tipo derivado (removendo 0.0)
      {
        accessorKey: 'tipoExibicao',
        header: 'Tipo',
        cell: ({ row }) => (
          <div className="max-w-[240px] truncate text-sm" title={row.getValue('tipoExibicao') as string}>
            {row.getValue('tipoExibicao') as string}
          </div>
        ),
      },
      {
        accessorKey: 'autor',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(isSorted === 'asc')}
              className="h-auto p-0 font-medium"
            >
              Autor
              {isSorted === 'asc' && <ChevronUp className="ml-2 h-4 w-4" />}
              {isSorted === 'desc' && <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="max-w-[250px] truncate text-sm">
            {row.getValue('autor')}
          </div>
        ),
      },
      // Campos derivados do Autor
      {
        accessorKey: 'protocolo',
        header: 'Protocolo',
        cell: ({ row }) => (
          <div className="font-mono text-xs">{(row.getValue('protocolo') as string) ?? '-'}</div>
        ),
      },
      {
        id: 'alvo',
        header: 'Funcionário / Escopo',
        cell: ({ row }) => {
          const func = row.original.funcionario
          const escopo = row.original.escopo
          const val = func && func.trim().length > 0 ? func : (escopo && escopo.trim().length > 0 ? escopo : '-')
          return (
            <div className="max-w-[260px] truncate text-sm" title={val}>
              {val}
            </div>
          )
        },
      },
      {
        accessorKey: 'contratoFilho',
        header: 'Contrato Filho',
        cell: ({ row }) => (
          <div className="text-xs">{(row.getValue('contratoFilho') as string) ?? '-'}</div>
        ),
      },
      // Colunas derivadas de Informações Extras (uma pendência por linha)
      {
        accessorKey: 'acao',
        header: 'Ação',
        cell: ({ row }) => (
          <div className="max-w-[280px] truncate text-sm" title={(row.getValue('acao') as string) ?? ''}>
            {(row.getValue('acao') as string) ?? '-'}
          </div>
        ),
      },
      {
        accessorKey: 'responsavel',
        header: 'Responsável',
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate text-sm" title={(row.getValue('responsavel') as string) ?? ''}>
            {(row.getValue('responsavel') as string) ?? '-'}
          </div>
        ),
      },
      {
        id: 'prazoExtra',
        header: 'Prazo (extra)',
        cell: ({ row }) => {
          const prazoDate = (row.original as FlatRowData).prazoDate
          const prazoText = (row.original as FlatRowData).prazoText
          const label = prazoDate ? format(prazoDate, 'dd/MM/yyyy HH:mm', { locale: ptBR }) : (prazoText ?? '-')
          return <div className="text-sm">{label}</div>
        },
      },
      {
        id: 'deltaPrazo',
        header: 'Δ (hoje - prazo)',
        cell: ({ row }) => {
          const delta = (row.original as FlatRowData).deltaDias
          let cls = 'text-muted-foreground'
          if (delta != null) {
            if (delta > 0) cls = 'text-red-600'
            else if (delta < 0) cls = 'text-emerald-600'
            else cls = 'text-amber-600'
          }
          return <div className={cls}>{delta != null ? `${delta}d` : '-'}</div>
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: flattenedRows,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.Aberto || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.Concluído || stats.Concluido || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Registros do Sistema</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os registros
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onExport('csv')}
                disabled={data.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onExport('json')}
                disabled={data.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          
          {/* Barra de pesquisa */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar registros..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {isLoading ? 'Carregando...' : 'Nenhum resultado encontrado.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação removida: exibir tudo de uma vez */}
        </CardContent>
      </Card>
    </div>
  )
}
