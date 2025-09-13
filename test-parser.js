// Quick local verification of parseAutor regex/logic (JS mirror)
function parseAutorJS(autor) {
  const info = {}
  try {
    const RE_PROTOCOL = /Protocolo:\s*(\d{8,})/i
    const RE_FUNC = /Funcion[áa]rio:\s*([^\n|]+?)(?=\s+-\s+Contrato:|\s*\| |$)/i
    const RE_CONTRATO_SUB = /Contrato:\s*(SUB\s*\d{1,2})(?:\s*-\s*|\s+)?(\d{6,})/i
    const RE_CONTRATO_NUM = /Contrato:\s*(\d{6,})/i
    const RE_ESCOPO_PIPE = /\|\s*Escopo:\s*(.+)$/i
    const RE_ESCOPO = /Escopo:\s*(.+)$/i

    const proto = RE_PROTOCOL.exec(autor)
    if (proto) info.protocolo = proto[1].trim()

    const func = RE_FUNC.exec(autor)
    if (func) info.funcionario = func[1].trim()

    const cSub = RE_CONTRATO_SUB.exec(autor)
    if (cSub) {
      const sub = cSub[1]?.trim()
      if (sub) info.contratoFilho = sub.replace(/\s*-\s*$/, '')
    } else {
      RE_CONTRATO_NUM.exec(autor) // intentionally ignored for contratoFilho
    }

    const escopoPipe = RE_ESCOPO_PIPE.exec(autor)
    const escopoRegex = RE_ESCOPO.exec(autor)
    const escopo = (escopoPipe && escopoPipe[1]) || (escopoRegex && escopoRegex[1])
    if (escopo) info.escopo = escopo.trim()
  } catch {}
  return info
}

const samples = [
  'Protocolo: 20250730171326 - Funcionário: CRISTIANO ALFREDO BERTAIA - Contrato: 4600013206 - Polo:',
  'Protocolo:3241159411 Contrato: 4600013454 | Escopo: Elaboração do projeto e execução de base em concreto armado para reservatório apoiado de 100 M³ na ETA Paranã.',
  'Protocolo: 20250724145613 - Funcionário: UALAS SILVA DE ALMEIDA - Contrato: SUB 02 - 4600013206 - Polo:',
  'Protocolo: 20250724120153 - Funcionário: DAVID BACKHAM ARAUJO DAS CHAGAS - Contrato: SUB 02 - 4600013206 - Polo:',
  'Protocolo: 20250724092942 - Funcionário: REGINALDO MISAEL DA SILVA - Contrato: SUB 01 4600013206 - Polo:',
  'Protocolo: 20250724092332 - Funcionário: QUIRINO RIBEIRO DE ARAUJO - Contrato: SUB 01 4600013206 - Polo:',
  'Protocolo: 20250724091811 - Funcionário: JAIME FERREIRA DOS SANTOS - Contrato: SUB 01 4600013206 - Polo:',
  'Protocolo: Contrato: SUB 02 - 4600013206 | Escopo: Perfuração Em Mnd Para Instalação De Tubo Pead Sub 02 4600013206 Pré',
  'Protocolo: Contrato: SUB 01 4600013206 | Escopo: Mão De Obra Para Substituição De Pead Para Ferro Fundido Utilizando O Método De Vca Sub',
  'Protocolo: 20250901125507 - Funcionário: Bruno Rocha da Silva - Contrato: 4600013206 - Polo: Palmas',
]

for (const s of samples) {
  const r = parseAutorJS(s)
  console.log('IN:', s)
  console.log('OUT:', r)
  console.log('---')
}
