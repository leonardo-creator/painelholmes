'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
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

  const columns: ColumnDef<RegistroData>[] = useMemo(
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
              {isSorted === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : null}
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
              {isSorted === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : null}
            </Button>
          )
        },
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('status')} />
        ),
      },
      {
        accessorKey: 'tipo',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(isSorted === 'asc')}
              className="h-auto p-0 font-medium"
            >
              Tipo
              {isSorted === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : null}
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-sm">
            {row.getValue('tipo')}
          </div>
        ),
      },
      {
        accessorKey: 'prazo',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(isSorted === 'asc')}
              className="h-auto p-0 font-medium"
            >
              Prazo
              {isSorted === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : null}
            </Button>
          )
        },
        cell: ({ row }) => {
          try {
            const prazo = row.getValue('prazo') as string
            const date = new Date(prazo)
            return (
              <div className="text-sm">
                {format(date, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            )
          } catch {
            return (
              <div className="text-sm text-muted-foreground">
                {row.getValue('prazo')}
              </div>
            )
          }
        },
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
              {isSorted === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : null}
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="max-w-[250px] truncate text-sm">
            {row.getValue('autor')}
          </div>
        ),
      },
      {
        accessorKey: 'data',
        header: 'Dados',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-sm">
            {row.getValue('data')}
          </div>
        ),
      },
      {
        accessorKey: 'extraInfo',
        header: 'Info Extra',
        cell: ({ row }) => {
          const extraInfo = row.getValue('extraInfo') as string
          return (
            <div 
              className="max-w-[300px] truncate text-sm cursor-help" 
              title={extraInfo}
            >
              {extraInfo}
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

          {/* Paginação */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              de {table.getFilteredRowModel().rows.length} registros
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
