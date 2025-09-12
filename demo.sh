#!/bin/bash

# Script de demonstração do Painel Holmes
# Execute este script para fazer a primeira sincronização

echo "🚀 Painel Holmes - Primeira Sincronização"
echo "========================================"
echo ""

echo "📡 Testando conectividade com a API externa..."
curl -s -o /dev/null -w "%{http_code}" "http://31.97.254.228:5000/api/scrape?email=leonardojuvencio%40brkambiental.com.br&password=%40i%23f1oHA5pAU32%24%24%24%25&contrato=4600013206,4600013454" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API externa disponível"
else
    echo "❌ API externa não disponível - verifique conectividade"
fi

echo ""
echo "🔄 Iniciando sincronização de dados..."
echo "⚠️  Este processo pode demorar alguns minutos devido ao web scraping..."
echo ""

# Fazer POST para iniciar sync
response=$(curl -s -X POST http://localhost:3000/api/sync)
echo "📊 Resposta da sincronização:"
echo $response | jq '.' 2>/dev/null || echo $response

echo ""
echo "📈 Para monitorar o progresso:"
echo "   1. Acesse: http://localhost:3000"
echo "   2. Verifique o status na seção 'Status da Sincronização'"
echo ""

echo "🎯 Recursos disponíveis:"
echo "   • Dashboard: http://localhost:3000"
echo "   • Status API: http://localhost:3000/api/sync"
echo "   • Dados API: http://localhost:3000/api/data"
echo "   • Export CSV: http://localhost:3000/api/export?format=csv"
echo "   • Export JSON: http://localhost:3000/api/export?format=json"
echo ""

echo "✨ Sistema configurado e pronto para uso!"
