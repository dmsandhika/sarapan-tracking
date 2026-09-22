import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionWithRelations } from "@/app/actions/sessions";
import { ArrowLeftIcon } from "@/components/icons";
import UploadMenuForm from "@/app/admin/UploadMenuForm";
import SessionDashboard from "@/app/admin/SessionDashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // extraction via Gemini can take a few seconds

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionWithRelations(id);
  if (!session) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{session.title}</h1>
          <p className="text-sm text-muted">{session.mode === "MENU" ? "Menu tetap" : "Bebas"}</p>
        </div>
        <Link
          href="/admin"
          aria-label="Kembali"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted"
        >
          <ArrowLeftIcon />
        </Link>
      </header>

      <div className="flex-1 px-5 py-5">
        {session.mode === "MENU" && session.menuItems.length === 0 ? (
          <UploadMenuForm sessionId={session.id} />
        ) : (
          <SessionDashboard session={session} />
        )}
      </div>
    </main>
  );
}
