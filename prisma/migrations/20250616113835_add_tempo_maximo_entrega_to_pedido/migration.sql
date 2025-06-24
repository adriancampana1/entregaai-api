/*
  Warnings:

  - Added the required column `tempo_maximo_entrega` to the `pedidos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "tempo_maximo_entrega" TEXT NOT NULL;
