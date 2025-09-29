import { parse, isValid } from 'date-fns'

export interface AutorInfo {
  protocolo?: string
  funcionario?: string
  escopo?: string
  contratoFilho?: string
}

export interface PendenciaItem {
  acao: string
  responsavel: string
  prazoText?: string
  prazoDate?: Date | null
  deltaDias?: number | null
}

// Accepts both "Protocolo:123..." and "Protocolo: 123..."
const RE_PROTOCOL = /Protocolo:\s*(\d{8,})/i
// Capture up to a delimiter (" - Contrato", "|", or EOL) but allow hyphens inside names by stopping only at " - " or pipe
const RE_FUNC = /Funcion[áa]rio:\s*([^\n|]+?)(?=\s+-\s+Contrato:|\s*\| |$)/i
// Match contrato with optional SUB marker, with or without hyphen after SUB number, e.g.:
//   "Contrato: SUB 01 4600013206" or "Contrato: SUB 02 - 4600013206" or "Contrato: 4600013206"
const RE_CONTRATO_SUB = /Contrato:\s*(SUB\s*\d{1,2})(?:\s*-\s*|\s+)?(\d{6,})/i
const RE_ESCOPO_PIPE = /\|\s*Escopo:\s*(.+)$/i
const RE_ESCOPO = /Escopo:\s*(.+)$/i

export function parseAutor(autor: string): AutorInfo {
  const info: AutorInfo = {}
  try {
    // Protocolo
    const proto = RE_PROTOCOL.exec(autor)
    if (proto) info.protocolo = proto[1].trim()

    // Funcionário (when present)
    const func = RE_FUNC.exec(autor)
    if (func) info.funcionario = func[1].trim()

    // Contrato Filho (SUB XX)
    const cSub = RE_CONTRATO_SUB.exec(autor)
    if (cSub) {
      const sub = cSub[1]?.trim()
      if (sub) info.contratoFilho = sub.replace(/\s*-\s*$/, '')
    } else {
      // No SUB found; nothing to set for contratoFilho. Keep future extensibility.
      // We intentionally ignore plain contract number here, as UI only needs SUB marker for "Contrato Filho".
    }

    // Escopo (pipe or plain)
    const escopoPipe = RE_ESCOPO_PIPE.exec(autor)
    const escopoRegex = RE_ESCOPO.exec(autor)
    const escopo = escopoPipe?.[1] || escopoRegex?.[1]
    if (escopo) info.escopo = escopo.trim()
  } catch {
    // ignore
  }
  return info
}

// dd/MM/yyyy or dd/MM/yyyy HH:mm
function tryParseBrDate(s: string): Date | null {
  const patterns = ['dd/MM/yyyy', 'dd/MM/yyyy HH:mm']
  for (const p of patterns) {
    try {
      const d = parse(s, p, new Date())
      if (isValid(d)) return d
    } catch {}
  }
  return null
}

// e.g., "Sep 12, 14:07" (assume current year)
function tryParseEnShort(s: string): Date | null {
  const withYear = `${s}, ${new Date().getFullYear()}`
  const patterns = ['LLL dd, HH:mm, yyyy']
  for (const p of patterns) {
    try {
      const d = parse(withYear, p, new Date())
      if (isValid(d)) return d
    } catch {}
  }
  return null
}

function extractPrazoDate(line: string, nextLine?: string): { prazoText?: string; prazoDate?: Date | null } {
  const trimmed = line.trim()
  // Prefer BR absolute date
  const br = tryParseBrDate(trimmed)
  if (br) return { prazoText: trimmed, prazoDate: br }

  // Lines like "há 28d 01h" are relative; keep as text
  if (/^h[áa]\s+\d+d/i.test(trimmed)) {
    // If next line is an English timestamp, keep current as text but try parse next
    const en = nextLine ? tryParseEnShort(nextLine.trim()) : null
    return { prazoText: trimmed, prazoDate: en }
  }

  // English short like "Sep 12, 14:07"
  const en = tryParseEnShort(trimmed)
  if (en) return { prazoText: trimmed, prazoDate: en }

  return { prazoText: trimmed, prazoDate: null }
}

export function parseExtraInfo(extraInfo: string): PendenciaItem[] {
  const lines = extraInfo
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  const items: PendenciaItem[] = []
  let i = 0
  while (i < lines.length) {
    const acao = lines[i]
    const responsavel = lines[i + 1] || ''
    const prazoLine = lines[i + 2]
    const maybeCreated = lines[i + 3]

    if (!acao) {
      i += 1
      continue
    }

    let prazoText: string | undefined
    let prazoDate: Date | null | undefined
    if (prazoLine) {
      const parsed = extractPrazoDate(prazoLine, maybeCreated)
      prazoText = parsed.prazoText
      prazoDate = parsed.prazoDate
    }

    let deltaDias: number | null = null
    if (prazoDate) {
      const now = new Date()
      const ms = now.getTime() - prazoDate.getTime()
      deltaDias = Math.round(ms / (1000 * 60 * 60 * 24))
    }

    items.push({ acao, responsavel, prazoText, prazoDate: prazoDate ?? null, deltaDias })

    // Heurística: grupos de 3 ou 4 linhas (com linha de criado opcional)
    if (prazoLine && maybeCreated && /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(maybeCreated)) {
      i += 4
    } else {
      i += 3
    }
  }

  return items
}

export function extractTipo(dataField: string): string {
  const firstLine = dataField.split(/\r?\n/)[0] || dataField
  return firstLine.replace(/\b0\.0\b/g, '').trim()
}
