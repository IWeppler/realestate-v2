import type { Metadata } from "next";
import { Toaster } from "@/shared/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TerraNova",
};

// Layout raíz: único lugar con <html> y <body>. Los layouts de cada grupo
// de rutas (p. ej. `(public)`) solo agregan su envoltorio, fuentes y chrome.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
