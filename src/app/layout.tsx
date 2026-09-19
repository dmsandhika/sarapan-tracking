import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallAppButton } from "@/components/InstallAppButton";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jompesan",
  description: "Pesan sarapan & tracking bayar harian",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jompesan",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#faf6f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <ServiceWorkerRegister />
        <InstallAppButton />
        {children}
      </body>
    </html>
  );
}
