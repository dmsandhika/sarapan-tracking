import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

type SessionListItem = {
  id: string;
  title: string;
  mode: string;
  status: string;
  _count: { orders: number };
};

export default function SessionList({ sessions }: { sessions: SessionListItem[] }) {
  if (sessions.length === 0) {
    return <p className="card text-sm text-muted">Belum ada sesi. Buat sesi baru di atas.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => {
        const isOpen = session.status === "PUBLISHED";
        const isDraft = session.status === "DRAFT";
        return (
          <Link
            key={session.id}
            href={`/admin/sesi/${session.id}`}
            className="card flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{session.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>{session.mode === "MENU" ? "Menu tetap" : "Bebas"}</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    isOpen ? "text-success" : isDraft ? "text-warning" : "text-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isOpen ? "bg-success" : isDraft ? "bg-warning" : "bg-muted"
                    }`}
                  />
                  {isOpen ? "Dibuka" : isDraft ? "Draf" : "Ditutup"}
                </span>
                <span>{session._count.orders} pesanan</span>
              </div>
            </div>
            <ChevronRightIcon className="shrink-0 text-muted" />
          </Link>
        );
      })}
    </div>
  );
}
