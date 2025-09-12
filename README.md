# Painel Holmes - Dashboard de Contratos

Sistema desenvolvido em Next.js 15 para monitoramento e visualização de dados de contratos obtidos através de web scraping.

## 🚀 Funcionalidades

- **Dashboard Interativo**: Visualização de dados em tempo real com estatísticas
- **Tabela Avançada**: Filtros, ordenação e paginação
- **Sync Automático**: Atualização dos dados a cada 4 horas
- **Exportação**: Dados em formato CSV e JSON
- **Status de Sincronização**: Monitoramento em tempo real do processo

## 🛠️ Tecnologias

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Tabela**: TanStack Table v8
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Validação**: Zod
- **Cron Jobs**: node-cron

## 📦 Instalação

1. **Clone o repositório**:
   ```bash
   git clone <repo-url>
   cd painelholmes
   ```

2. **Instale as dependências**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure o banco de dados**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Configure as variáveis de ambiente** (`.env.local`):
   ```env
   # Database
   DATABASE_URL="sua-connection-string-postgresql"

   # API Configuration
   API_BASE_URL="http://31.97.254.228:5000"
   API_EMAIL="seu-email"
   API_PASSWORD="sua-senha"
   API_CONTRATOS="4600013206,4600013454"

   # Cron Job Configuration
   CRON_SECRET="sua-chave-secreta"
   ```

5. **Execute o projeto**:
   ```bash
   npm run dev
   ```

   O sistema estará disponível em `http://localhost:3000`

## 📊 Uso do Sistema

### Dashboard Principal
- Acesse `/dashboard` (ou simplesmente `/`)
- Visualize estatísticas resumidas dos contratos
- Monitore o status da última sincronização

### Sincronização de Dados
- **Automática**: Executada a cada 4 horas automaticamente
- **Manual**: Clique no botão "Sincronizar" no dashboard
- **Status**: Acompanhe o progresso em tempo real

### Tabela de Dados
- **Filtros**: Use a barra de pesquisa para filtrar registros
- **Ordenação**: Clique nos cabeçalhos das colunas
- **Paginação**: Navegue pelos dados usando os controles de paginação

### Exportação
- **CSV**: Para análise em Excel/Planilhas
- **JSON**: Para integração com outros sistemas

## 🔧 APIs Disponíveis

### GET `/api/data`
Busca registros paginados com filtros:
```
?page=1&pageSize=50&search=termo&status=Aberto&contrato=123456
```

### POST `/api/sync`
Inicia sincronização manual dos dados.

### GET `/api/sync`
Retorna status da sincronização atual.

### GET `/api/export?format=csv|json`
Exporta todos os dados no formato especificado.

### POST `/api/cron`
Endpoint para execução via cron externo (opcional).

## 📋 Schema de Dados

### Contratos
- `id`: Identificador único
- `numero`: Número do contrato
- `registros`: Relação com registros

### Registros
- `id`: Identificador único
- `contratoId`: Referência ao contrato
- `autor`: Autor do registro
- `data`: Dados do registro
- `extraInfo`: Informações extras
- `numero`: Número do protocolo
- `prazo`: Data/prazo
- `status`: Status (Aberto, Concluído, etc.)
- `tipo`: Tipo do registro

### SyncLog
- `id`: Identificador único
- `startedAt`: Início da sincronização
- `endedAt`: Fim da sincronização
- `status`: Status (running, success, error)
- `message`: Mensagem de status
- `recordsProcessed`: Registros processados

## ⚙️ Configuração de Cron

O sistema possui um cron job interno que executa a cada 4 horas. Para ambientes de produção, você pode também configurar um cron externo:

```bash
# Executar a cada 4 horas
0 */4 * * * curl -X POST https://seu-dominio.com/api/cron -H "Content-Type: application/json" -d '{"secret":"sua-chave-secreta"}'
```

## 🔒 Segurança

- Credenciais da API são armazenadas em variáveis de ambiente
- Endpoint de cron protegido por secret (opcional)
- Validação de dados com Zod
- Sanitização de queries SQL via Prisma

## 📈 Performance

- Lazy loading de componentes
- Paginação de dados
- Cache de queries
- Otimização de bundle (< 250KB)

## 🐛 Troubleshooting

### Erro de Conexão com Banco
```bash
npx prisma generate
npx prisma db push
```

### Problemas de Dependências
```bash
npm install --legacy-peer-deps
```

### Erro na API Externa
Verifique:
- URL da API
- Credenciais
- Conectividade de rede
- Timeout (configurado para 10 minutos)

## 📝 Logs

Todos os processos de sincronização são logados:
- Console do servidor
- Tabela `sync_logs` no banco
- Interface do dashboard

## 🔄 Atualizações

Para adicionar novos contratos, edite a variável `API_CONTRATOS` no arquivo `.env.local`:

```env
API_CONTRATOS="4600013206,4600013454,NOVO_CONTRATO"
```

## 🎯 Melhorias Futuras

- [ ] Interface para gerenciar contratos
- [ ] Notificações por email
- [ ] Gráficos e relatórios
- [ ] Filtros avançados
- [ ] Integração com webhooks
- [ ] Dashboard móvel otimizado

## 📞 Suporte

Para questões técnicas ou melhorias, entre em contato através dos canais de desenvolvimento.

---

**Desenvolvido com ❤️ usando Next.js 15 e as melhores práticas de desenvolvimento.**

## 📦 Deploy (Vercel) — checklist rápida

Antes de fazer deploy em Vercel, confirme os itens abaixo para evitar erros de build/runtime:

- Variáveis de ambiente (Settings > Environment Variables):
   - `DATABASE_URL` (string de conexão Postgres)
   - `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (se usar autenticação)
   - `API_BASE_URL`, `API_EMAIL`, `API_PASSWORD`, `API_CONTRATOS` (integração externa)
   - `CRON_SCHEDULE` / `CRON_SECRET` (se necessário)

- Scripts importantes em `package.json` (já adicionados):
   - `postinstall`: roda `prisma generate` durante `npm install`
   - `vercel-build`: roda `prisma generate && next build` quando Vercel executa o build

- Certifique-se que Vercel executa `npm install` ou que `vercel-build` esteja definido nas configurações do projeto.

## 🔤 Charset / encoding

Se você notar caracteres estranhos em mensagens JSON (por exemplo `SincronizaÃ§Ã£o`), confirme que a API externa e suas rotas retornam JSON UTF-8 e que o header `Content-Type: application/json; charset=utf-8` está presente. Em clientes PowerShell/Terminal, use ferramentas que aceitam UTF-8 para visualizar corretamente.

## ✅ Próximos passos recomendados

- Verificar logs de `/api/sync` após um POST manual para confirmar que os registros são persistidos em `sync_logs`.
- Adicionar uma etapa de CI que rode `npx prisma generate` antes do build (ex.: GitHub Actions) para builds repetíveis.
- Validar e corrigir eventuais problemas de encoding na API externa ou adicionar re-encoding no serviço de sincronização.
