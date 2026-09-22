import type { Prisma } from "@prisma/client";

export type SessionWithRelations = Prisma.SessionGetPayload<{
  include: {
    menuItems: true;
    orders: {
      include: {
        items: { include: { menuItem: true; originalMenuItem: true } };
      };
    };
  };
}>;

export type OrderWithItems = SessionWithRelations["orders"][number];
export type MenuItemRow = SessionWithRelations["menuItems"][number];

export type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: {
    orders: {
      include: {
        session: true;
        items: { include: { menuItem: true; originalMenuItem: true } };
      };
    };
  };
}>;
