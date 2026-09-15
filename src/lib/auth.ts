import { cookies } from "next/headers";

const COOKIE_NAME = "sarapan_admin_session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "authenticated";
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME;
