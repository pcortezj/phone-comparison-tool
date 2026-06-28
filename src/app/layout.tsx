import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Difference AI",
  description: "Compare smartphone specs from your own local catalog.",
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
