import type { Prisma } from "@prisma/client";

export type DayWithRelations = Prisma.DayGetPayload<{
  include: {
    menuItems: true;
    orders: {
      include: {
        items: { include: { menuItem: true; originalMenuItem: true } };
      };
    };
  };
}>;

export type OrderWithItems = DayWithRelations["orders"][number];
export type MenuItemRow = DayWithRelations["menuItems"][number];
