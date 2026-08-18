import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantasy Football Draft Planner",
  description: "2026 superflex auction draft tool for Sean's league.",
};

// The board's inputs are deliberately small (11–12px) so the table fits a
// phone, and iOS auto-zooms into any focused field under 16px. Capping the
// scale stops that jump; pinch-to-zoom still works, since iOS keeps it
// available for accessibility regardless of this setting.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
