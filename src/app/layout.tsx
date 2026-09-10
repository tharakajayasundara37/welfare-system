import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tharaka Jayasundara | Full-Stack Developer",
  description: "Portfolio of Tharaka Jayasundara, an IT student and full-stack developer based in Sri Lanka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

