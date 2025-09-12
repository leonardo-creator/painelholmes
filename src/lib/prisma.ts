import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined
}

const prismaClient = global.__prisma__

export const prisma =
  prismaClient ??
  new PrismaClient({
    // enable detailed query logging only in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma
}
