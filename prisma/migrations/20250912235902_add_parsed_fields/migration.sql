-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "extra_info" TEXT NOT NULL,
    "numero" TEXT,
    "prazo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "action" TEXT,
    "protocolo" TEXT,
    "prazo_parsed" TIMESTAMP(3),
    "prazo_display" TEXT,
    "atraso" TEXT,
    "escopo" TEXT,
    "contrato_filho" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "message" TEXT,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numero_key" ON "contratos"("numero");

-- CreateIndex
CREATE INDEX "registros_contratoId_idx" ON "registros"("contratoId");

-- CreateIndex
CREATE INDEX "registros_status_idx" ON "registros"("status");

-- CreateIndex
CREATE INDEX "registros_tipo_idx" ON "registros"("tipo");

-- CreateIndex
CREATE INDEX "registros_prazo_idx" ON "registros"("prazo");

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
