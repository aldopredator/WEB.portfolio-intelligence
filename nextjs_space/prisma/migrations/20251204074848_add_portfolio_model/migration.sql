-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN "portfolioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_name_key" ON "Portfolio"("name");

-- CreateIndex
CREATE INDEX "Portfolio_name_idx" ON "Portfolio"("name");

-- CreateIndex
CREATE INDEX "Stock_portfolioId_idx" ON "Stock"("portfolioId");

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
