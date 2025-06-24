/*
  Warnings:

  - Added the required column `nome_cliente` to the `pedidos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "nome_cliente" TEXT NOT NULL;
