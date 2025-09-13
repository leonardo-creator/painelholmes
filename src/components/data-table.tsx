'use client'

import { useEffect, useState, useMemo } from 'react'
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
  type Column,
  flexRender,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Download, RefreshCw, Search, Filter } from 'lucide-react'

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

// Reusable sortable header component (top-level to avoid nested component lint rule)
type SortableHeaderProps<TData> = Readonly<{ column: Column<TData, unknown>; label: string }>
function SortableHeader<TData>({ column, label }: SortableHeaderProps<TData>) {
  const isSorted = column.getIsSorted() as false | 'asc' | 'desc'
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(isSorted === 'asc')}
      className="h-auto p-0 font-medium"
    >
      {label}
      {isSorted === 'asc' && <ChevronUp className="ml-2 h-4 w-4" />}
      {isSorted === 'desc' && <ChevronDown className="ml-2 h-4 w-4" />}
    </Button>
  )
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
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({})

  // Persist table state (sorting/filters/globalFilter) across sessions
  const STORAGE_KEY = 'dataTable:v2:state'

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        sorting?: SortingState
        columnFilters?: ColumnFiltersState
        globalFilter?: string
        columnVisibility?: Record<string, boolean>
      }
      if (parsed.sorting) setSorting(parsed.sorting)
      if (parsed.columnFilters) setColumnFilters(parsed.columnFilters)
      if (typeof parsed.globalFilter === 'string') setGlobalFilter(parsed.globalFilter)
      if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility)
    } catch {
      // ignore corrupted state
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
  const toSave = JSON.stringify({ sorting, columnFilters, globalFilter, columnVisibility })
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, toSave)
    } catch {
      // ignore quota or serialization errors
    }
  }, [sorting, columnFilters, globalFilter, columnVisibility])

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
  hasParticipanteExterno?: boolean
    createdAt: string
    updatedAt: string
  }

  const flattenedRows: FlatRowData[] = useMemo(() => {
    const rows: FlatRowData[] = []
    for (const r of data) {
      const tipoExibicao = extractTipo(r.data)
      const autorInfo = parseAutor(r.autor)
  const items = parseExtraInfo(r.extraInfo)
  const hasExt = /com participante externo/i.test(r.extraInfo) || /com participante externo/i.test(r.data) || /com participante externo/i.test(r.autor)

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
          hasParticipanteExterno: hasExt,
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
          hasParticipanteExterno: hasExt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
      })
    }
    return rows
  }, [data])

  /* eslint-disable react/no-unstable-nested-components */
  const columns: ColumnDef<FlatRowData>[] = useMemo(
    () => [
      {
        accessorKey: 'contrato',
        header: ({ column }) => <SortableHeader column={column} label="Contrato" />,
        cell: ({ row }) => (
          <div className="font-mono text-sm">
            {row.getValue('contrato')}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortableHeader column={column} label="Status" />,
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('status')} />
        ),
      },
      // Tipo derivado (removendo 0.0)
      {
        accessorKey: 'tipoExibicao',
        header: ({ column }) => <SortableHeader column={column} label="Tipo" />,
        cell: ({ row }) => (
          <div className="max-w-[240px] truncate text-sm" title={String(row.getValue('tipoExibicao'))}>
            {String(row.getValue('tipoExibicao'))}
          </div>
        ),
      },
      {
        accessorKey: 'autor',
        header: ({ column }) => <SortableHeader column={column} label="Autor" />,
        cell: ({ row }) => (
          <div className="max-w-[250px] truncate text-sm">
            {row.getValue('autor')}
          </div>
        ),
      },
      // Campos derivados do Autor
      {
        accessorKey: 'protocolo',
        header: ({ column }) => <SortableHeader column={column} label="Protocolo" />,
        cell: ({ row }) => (
          <div className="font-mono text-xs">{(row.getValue('protocolo') as string) ?? '-'}</div>
        ),
      },
      {
        id: 'alvo',
        accessorFn: (row) => (row.funcionario?.trim() && row.funcionario.trim().length > 0
          ? row.funcionario.trim()
          : (row.escopo?.trim() && row.escopo.trim().length > 0 ? row.escopo.trim() : '')),
        header: ({ column }) => <SortableHeader column={column} label="Funcionário / Escopo" />,
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
        header: ({ column }) => <SortableHeader column={column} label="Contrato Filho" />,
        cell: ({ row }) => (
          <div className="text-xs">{(row.getValue('contratoFilho') as string) ?? '-'}</div>
        ),
      },
      // Colunas derivadas de Informações Extras (uma pendência por linha)
      {
        accessorKey: 'acao',
        header: ({ column }) => <SortableHeader column={column} label="Ação" />,
        cell: ({ row }) => (
          <div className="max-w-[280px] truncate text-sm" title={(row.getValue('acao') as string) ?? ''}>
            {(row.getValue('acao') as string) ?? '-'}
          </div>
        ),
      },
      {
        accessorKey: 'responsavel',
        header: ({ column }) => <SortableHeader column={column} label="Responsável" />,
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate text-sm" title={(row.getValue('responsavel') as string) ?? ''}>
            {(row.getValue('responsavel') as string) ?? '-'}
          </div>
        ),
      },
      {
        id: 'prazoExtra',
        accessorFn: (row) => {
          // Use timestamp for sorting, nulls at the end
          return row.prazoDate ? row.prazoDate.getTime() : Number.MAX_SAFE_INTEGER
        },
        header: ({ column }) => <SortableHeader column={column} label="Prazo (extra)" />,
        cell: ({ row }) => {
          const prazoDate = (row.original as FlatRowData).prazoDate
          const prazoText = (row.original as FlatRowData).prazoText
          const label = prazoDate ? format(prazoDate, 'dd/MM/yyyy HH:mm', { locale: ptBR }) : (prazoText ?? '-')
          return <div className="text-sm">{label}</div>
        },
      },
      {
        id: 'deltaPrazo',
        accessorFn: (row) => (row.deltaDias ?? Number.MAX_SAFE_INTEGER),
        header: ({ column }) => <SortableHeader column={column} label="Δ (hoje - prazo)" />,
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
  /* eslint-enable react/no-unstable-nested-components */

  // Unique values for checkbox filters
  const uniqueValues = useMemo(() => {
    const make = (key: string, getter: (r: FlatRowData) => string) => {
      const set = new Set<string>()
      flattenedRows.forEach((r) => {
        const v = getter(r).trim()
        if (v) set.add(v)
      })
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    }
    return {
      contrato: make('contrato', (r) => r.contrato),
      status: make('status', (r) => r.status),
      tipoExibicao: make('tipoExibicao', (r) => r.tipoExibicao),
      alvo: make('alvo', (r) => (r.funcionario && r.funcionario.trim().length > 0 ? r.funcionario : (r.escopo || ''))),
      contratoFilho: make('contratoFilho', (r) => r.contratoFilho || ''),
      responsavel: make('responsavel', (r) => r.responsavel || ''),
    }
  }, [flattenedRows])

  // FilterFns: contains (insensitive) and inArray
  const filterFns = {
    contains: (row: any, columnId: string, filterValue: unknown) => {
      const v = String(row.getValue(columnId) ?? '')
      const q = String(filterValue ?? '')
      if (!q) return true
      return v.toLowerCase().includes(q.toLowerCase())
    },
    inArray: (row: any, columnId: string, filterValue: unknown) => {
      const list = Array.isArray(filterValue) ? (filterValue as string[]) : []
      if (list.length === 0) return true
      const v = String(row.getValue(columnId) ?? '')
      return list.includes(v)
    },
  }

  const table = useReactTable({
    data: flattenedRows,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnFilters: true,
    defaultColumn: { filterFn: filterFns.contains as any },
    filterFns: filterFns as any,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
  })

  // Active filters indicator
  const activeFiltersCount = (columnFilters?.length || 0) + (globalFilter ? 1 : 0)

  // Client-side export that mirrors current table view (visible columns, filtered rows)
  async function exportCurrent(fmt: 'csv' | 'json' | 'xlsx') {
    const rows = table.getRowModel().rows
    const cols = table.getVisibleLeafColumns()

    const headerMap = cols.map((c) => ({ id: c.id, label: typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id }))
    const toCell = (colId: string, r: FlatRowData): string => {
      switch (colId) {
        case 'contrato':
          return r.contrato
        case 'status':
          return r.status
        case 'tipoExibicao':
          return r.tipoExibicao
        case 'autor':
          return r.autor
        case 'protocolo':
          return r.protocolo ?? ''
        case 'alvo': {
          const func = r.funcionario?.trim()
          const esc = r.escopo?.trim()
          return func && func.length > 0 ? func : (esc || '')
        }
        case 'contratoFilho':
          return r.contratoFilho ?? ''
        case 'acao':
          return r.acao ?? ''
        case 'responsavel':
          return r.responsavel ?? ''
        case 'prazoExtra': {
          const d = r.prazoDate
          const t = r.prazoText
          return d ? format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR }) : (t ?? '')
        }
        case 'deltaPrazo':
          return r.deltaDias != null ? `${r.deltaDias}d` : ''
        default:
          return ''
      }
    }

    const dataOut = rows.map((row) => {
      const r = row.original as FlatRowData
      const obj: Record<string, string> = {}
      headerMap.forEach(({ id, label }) => {
        obj[label] = toCell(id, r)
      })
      return obj
    })

    const filenameBase = `painel-holmes-${new Date().toISOString().split('T')[0]}`
  if (fmt === 'json') {
      const blob = new Blob([JSON.stringify(dataOut, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
  a.download = `${filenameBase}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      return
    }
  if (fmt === 'xlsx') {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(dataOut)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Registros')
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
  a.download = `${filenameBase}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)
      return
    }
    // CSV default
    const Papa = await import('papaparse')
    const csv = Papa.unparse(dataOut, { delimiter: ';', header: true })
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
  a.download = `${filenameBase}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

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
            <div className="flex gap-2 flex-wrap justify-end">
              {/* Contagem de 'Com participante externo' considerando filtros */}
              <div className="text-sm rounded border px-2 py-1 bg-fuchsia-50 text-fuchsia-700">
                Com participante externo: {table.getRowModel().rows.filter(r => (r.original as FlatRowData).hasParticipanteExterno).length}
              </div>
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  <span>Filtros ativos: {activeFiltersCount}</span>
                </div>
              )}
              {/* Column visibility toggles */}
              <div className="flex flex-wrap gap-2">
                {table.getAllLeafColumns().map((col) => (
                  <Button
                    key={col.id}
                    variant={col.getIsVisible() ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => col.toggleVisibility()}
                    className="min-w-[80px]"
                  >
                    {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                  </Button>
                ))}
              </div>
              {/* Reset View */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSorting([])
                  setColumnFilters([])
                  setGlobalFilter('')
                  setColumnVisibility({})
                  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
                }}
              >
                Redefinir visão
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportCurrent('csv')}
                disabled={data.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportCurrent('json')}
                disabled={data.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportCurrent('xlsx')}
                disabled={data.length === 0}
                title="Exportar Excel"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
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
                {/* Filtros por coluna */}
                <TableRow>
                  {table.getVisibleLeafColumns().map((column) => {
                    const headerLabel = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
                    const colId = column.id
                    const isCategorical = ['contrato', 'status', 'tipoExibicao', 'alvo', 'contratoFilho', 'responsavel'].includes(colId)
                    const selected = column.getFilterValue()
                    return (
                      <TableHead key={column.id}>
                        {column.getCanFilter() && (
                          isCategorical ? (
                            <details open={!!openFilters[colId]} onToggle={(e) => setOpenFilters((p) => ({ ...p, [colId]: (e.target as HTMLDetailsElement).open }))}>
                              <summary className="cursor-pointer text-sm flex items-center gap-1">
                                Filtros
                              </summary>
                              <div className="mt-2 max-h-40 overflow-auto pr-2">
                                {(uniqueValues as any)[colId].map((opt: string) => {
                                  const list = Array.isArray(selected) ? (selected as string[]) : []
                                  const checked = list.includes(opt)
                                  return (
                                    <label key={opt} className="flex items-center gap-2 text-sm py-0.5">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(ev) => {
                                          const prev = Array.isArray(column.getFilterValue()) ? ([...(column.getFilterValue() as string[])]) : []
                                          if (ev.target.checked) {
                                            prev.push(opt)
                                          } else {
                                            const idx = prev.indexOf(opt)
                                            if (idx >= 0) prev.splice(idx, 1)
                                          }
                                          column.setFilterValue(prev)
                                          column.columnDef.filterFn = 'inArray' as any
                                        }}
                                      />
                                      <span className="truncate max-w-[180px]" title={opt}>{opt}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </details>
                          ) : (
                            <Input
                              placeholder={`Filtrar ${headerLabel}...`}
                              value={(column.getFilterValue() as string) ?? ''}
                              onChange={(e) => column.setFilterValue(e.target.value)}
                              className="h-8"
                            />
                          )
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={(row.original as FlatRowData).hasParticipanteExterno ? 'ring-2 ring-fuchsia-500' : ''}
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
