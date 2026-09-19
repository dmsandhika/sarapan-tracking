-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "waNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_waNumber_key" ON "Customer"("waNumber");

-- AlterTable (nullable first so existing rows can be backfilled)
ALTER TABLE "Order" ADD COLUMN "customerId" TEXT;

-- Backfill: one placeholder Customer per distinct existing order name
INSERT INTO "Customer" (id, "waNumber", name)
SELECT DISTINCT ON (o.name)
  'legacy_' || md5(o.name),
  'legacy-' || md5(o.name),
  o.name
FROM "Order" o;

UPDATE "Order" o
SET "customerId" = c.id
FROM "Customer" c
WHERE c."waNumber" = 'legacy-' || md5(o.name);

-- AlterTable (now enforce required)
ALTER TABLE "Order" ALTER COLUMN "customerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
