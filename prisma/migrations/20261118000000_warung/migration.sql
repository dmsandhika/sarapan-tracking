-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "price" INTEGER;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "warungId" TEXT;

-- CreateTable
CREATE TABLE "Warung" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "waNumber" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarungMenuItem" (
    "id" TEXT NOT NULL,
    "warungId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarungMenuItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_warungId_fkey" FOREIGN KEY ("warungId") REFERENCES "Warung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarungMenuItem" ADD CONSTRAINT "WarungMenuItem_warungId_fkey" FOREIGN KEY ("warungId") REFERENCES "Warung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
