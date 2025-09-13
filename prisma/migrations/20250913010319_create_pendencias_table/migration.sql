/*
  Warnings:

  - You are about to drop the column `acao` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `contrato_filho` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `dias_atraso` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `escopo` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `funcionario` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `prazo_formatado` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `protocolo` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `responsavel` on the `registros` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "registros_dias_atraso_idx";

-- DropIndex
DROP INDEX "registros_responsavel_idx";

-- AlterTable
ALTER TABLE "registros" DROP COLUMN "acao",
DROP COLUMN "contrato_filho",
DROP COLUMN "dias_atraso",
DROP COLUMN "escopo",
DROP COLUMN "funcionario",
DROP COLUMN "prazo_formatado",
DROP COLUMN "protocolo",
DROP COLUMN "responsavel";

-- CreateTable
CREATE TABLE "pendencias" (
    "id" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "pendencia" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "prazo" TEXT NOT NULL,
    "prazo_data" TEXT,
    "dias_atraso" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "protocolo" TEXT,
    "funcionario" TEXT,
    "escopo" TEXT,
    "contrato_filho" TEXT,
    "contrato_numero" TEXT NOT NULL,
    "status_registro" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pendencias_registroId_idx" ON "pendencias"("registroId");

-- CreateIndex
CREATE INDEX "pendencias_responsavel_idx" ON "pendencias"("responsavel");

-- CreateIndex
CREATE INDEX "pendencias_dias_atraso_idx" ON "pendencias"("dias_atraso");

-- CreateIndex
CREATE INDEX "pendencias_status_registro_idx" ON "pendencias"("status_registro");

-- CreateIndex
CREATE INDEX "pendencias_contrato_numero_idx" ON "pendencias"("contrato_numero");

-- AddForeignKey
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "registros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
