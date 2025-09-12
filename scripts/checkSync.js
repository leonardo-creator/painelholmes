const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const last = await prisma.syncLog.findFirst({ orderBy: { startedAt: 'desc' } })
    console.log(JSON.stringify(last, null, 2))
  } catch (e) {
    console.error('Error querying syncLog:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
