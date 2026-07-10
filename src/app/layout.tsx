import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ties are for Soccer — Auction War Room",
  description: "2026 superflex auction draft tool for Sean's league.",
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
