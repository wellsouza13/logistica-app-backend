-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "matricula" TEXT NOT NULL,
    "senha" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fluxo" (
    "id" SERIAL NOT NULL,
    "motoristaId" INTEGER NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fluxo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_matricula_key" ON "User"("matricula");
