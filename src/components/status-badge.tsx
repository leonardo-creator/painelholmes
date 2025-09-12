'use client'

import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  readonly status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluído':
      case 'concluido':
      case 'finalizado':
        return 'success'
      case 'aberto':
      case 'pendente':
      case 'em andamento':
        return 'warning'
      case 'cancelado':
      case 'rejeitado':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <Badge variant={getVariant(status)}>
      {status}
    </Badge>
  )
}
