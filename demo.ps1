# Script de demonstração do Painel Holmes
# Execute este script para fazer a primeira sincronização

Write-Host "🚀 Painel Holmes - Primeira Sincronização" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📡 Testando conectividade com a API externa..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://31.97.254.228:5000/api/scrape?email=leonardojuvencio%40brkambiental.com.br&password=%40i%23f1oHA5pAU32%24%24%24%25&contrato=4600013206,4600013454" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ API externa disponível" -ForegroundColor Green
} catch {
    Write-Host "❌ API externa não disponível - verifique conectividade" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Iniciando sincronização de dados..." -ForegroundColor Yellow
Write-Host "⚠️  Este processo pode demorar alguns minutos devido ao web scraping..." -ForegroundColor Yellow
Write-Host ""

try {
    # Fazer POST para iniciar sync
    $syncResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/sync" -Method POST -ContentType "application/json"
    Write-Host "📊 Resposta da sincronização:" -ForegroundColor Cyan
    $syncResponse | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "❌ Erro ao iniciar sincronização: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📈 Para monitorar o progresso:" -ForegroundColor Green
Write-Host "   1. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host "   2. Verifique o status na seção 'Status da Sincronização'" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Recursos disponíveis:" -ForegroundColor Green
Write-Host "   • Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host "   • Status API: http://localhost:3000/api/sync" -ForegroundColor White
Write-Host "   • Dados API: http://localhost:3000/api/data" -ForegroundColor White
Write-Host "   • Export CSV: http://localhost:3000/api/export?format=csv" -ForegroundColor White
Write-Host "   • Export JSON: http://localhost:3000/api/export?format=json" -ForegroundColor White
Write-Host ""

Write-Host "✨ Sistema configurado e pronto para uso!" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
