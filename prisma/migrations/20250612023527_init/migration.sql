-- CreateEnum
CREATE TYPE "StatusEntregador" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('AGUARDANDO_ROTA', 'EM_ROTA', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusCorrida" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusParada" AS ENUM ('PENDENTE', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "entregadores" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "StatusEntregador" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entregadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "crm_pedido_id" TEXT NOT NULL,
    "endereco_completo" TEXT NOT NULL,
    "status_geral" "StatusPedido" NOT NULL DEFAULT 'AGUARDANDO_ROTA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corridas" (
    "id" SERIAL NOT NULL,
    "status" "StatusCorrida" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "entregador_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corridas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paradas" (
    "id" SERIAL NOT NULL,
    "ordem" INTEGER NOT NULL,
    "status" "StatusParada" NOT NULL DEFAULT 'PENDENTE',
    "horario_conclusao" TIMESTAMP(3),
    "corrida_id" INTEGER NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paradas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_crm_pedido_id_key" ON "pedidos"("crm_pedido_id");

-- CreateIndex
CREATE INDEX "corridas_entregador_id_idx" ON "corridas"("entregador_id");

-- CreateIndex
CREATE INDEX "paradas_corrida_id_idx" ON "paradas"("corrida_id");

-- CreateIndex
CREATE INDEX "paradas_pedido_id_idx" ON "paradas"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "paradas_corrida_id_pedido_id_key" ON "paradas"("corrida_id", "pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "paradas_corrida_id_ordem_key" ON "paradas"("corrida_id", "ordem");

-- AddForeignKey
ALTER TABLE "corridas" ADD CONSTRAINT "corridas_entregador_id_fkey" FOREIGN KEY ("entregador_id") REFERENCES "entregadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradas" ADD CONSTRAINT "paradas_corrida_id_fkey" FOREIGN KEY ("corrida_id") REFERENCES "corridas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradas" ADD CONSTRAINT "paradas_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
