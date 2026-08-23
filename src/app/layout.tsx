import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DifferenceAI",
  description: "Search, filter, and compare thousands of smartphones side by side, with an AI assistant to answer your questions.",
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
