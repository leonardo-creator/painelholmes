/*
  Warnings:

  - You are about to drop the column `action` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `atraso` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `prazo_display` on the `registros` table. All the data in the column will be lost.
  - You are about to drop the column `prazo_parsed` on the `registros` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "registros" DROP COLUMN "action",
DROP COLUMN "atraso",
DROP COLUMN "prazo_display",
DROP COLUMN "prazo_parsed",
ADD COLUMN     "acao" TEXT,
ADD COLUMN     "dias_atraso" INTEGER,
ADD COLUMN     "funcionario" TEXT,
ADD COLUMN     "prazo_formatado" TEXT,
ADD COLUMN     "responsavel" TEXT;

-- CreateIndex
CREATE INDEX "registros_responsavel_idx" ON "registros"("responsavel");

-- CreateIndex
CREATE INDEX "registros_dias_atraso_idx" ON "registros"("dias_atraso");
