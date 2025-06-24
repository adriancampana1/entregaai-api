/*
  Warnings:

  - A unique constraint covering the columns `[telefone]` on the table `entregadores` will be added. If there are existing duplicate values, this will fail.
  - Made the column `telefone` on table `entregadores` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "entregadores" ALTER COLUMN "telefone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "entregadores_telefone_key" ON "entregadores"("telefone");
