-- Data-preserving migration: Day -> Session, add multi-mode/session fields.
-- Existing rows (3 sessions, 36 orders, 76 order items as of 2026-09-22) are kept.

-- Rename table + PK
ALTER TABLE "Day" RENAME TO "Session";
ALTER TABLE "Session" RENAME CONSTRAINT "Day_pkey" TO "Session_pkey";

-- Drop the old 1-session-per-date uniqueness, replace with a plain index
DROP INDEX "Day_date_key";
CREATE INDEX "Session_date_idx" ON "Session"("date");

-- New Session columns
ALTER TABLE "Session" ADD COLUMN "publicCode" TEXT;
ALTER TABLE "Session" ADD COLUMN "title" TEXT;
ALTER TABLE "Session" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'MENU';
ALTER TABLE "Session" ADD COLUMN "vendorWaNumber" TEXT;

-- Backfill existing rows: unique code + a sensible title (all pre-migration
-- sessions were single-warung breakfast rounds)
UPDATE "Session" SET
  "publicCode" = upper(substr(md5(random()::text || id), 1, 7)),
  "title" = 'Sarapan ' || "date"
WHERE "publicCode" IS NULL;

ALTER TABLE "Session" ALTER COLUMN "publicCode" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Session" ADD CONSTRAINT "Session_publicCode_key" UNIQUE ("publicCode");

-- MenuItem.dayId -> sessionId
ALTER TABLE "MenuItem" RENAME COLUMN "dayId" TO "sessionId";
ALTER TABLE "MenuItem" RENAME CONSTRAINT "MenuItem_dayId_fkey" TO "MenuItem_sessionId_fkey";

-- Order.dayId -> sessionId
ALTER TABLE "Order" RENAME COLUMN "dayId" TO "sessionId";
ALTER TABLE "Order" RENAME CONSTRAINT "Order_dayId_fkey" TO "Order_sessionId_fkey";
ALTER INDEX "Order_dayId_nomorUrut_key" RENAME TO "Order_sessionId_nomorUrut_key";

-- OrderItem: menuItemId becomes optional, add customText, require exactly one
ALTER TABLE "OrderItem" ALTER COLUMN "menuItemId" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD COLUMN "customText" TEXT;

ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_menuItemId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_exactly_one_source"
  CHECK (("menuItemId" IS NOT NULL) <> ("customText" IS NOT NULL));
