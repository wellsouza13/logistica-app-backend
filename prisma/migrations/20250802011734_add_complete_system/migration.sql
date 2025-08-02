/*
  Warnings:

  - You are about to drop the column `cliente` on the `Venda` table. All the data in the column will be lost.
  - Added the required column `atualizadoEm` to the `Venda` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `VendaItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VendaItem" DROP CONSTRAINT "VendaItem_vendaId_fkey";

-- AlterTable
ALTER TABLE "Estoque" ADD COLUMN     "preco" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Venda" DROP COLUMN "cliente",
ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "clienteId" INTEGER,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VendaItem" ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaItem" ADD CONSTRAINT "VendaItem_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
