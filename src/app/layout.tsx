import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
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
      <body>
        {children}
        <footer className="site-footer">
          Built by{" "}
          <a
            href="https://x.com/tronjcodes"
            target="_blank"
            rel="noopener noreferrer"
          >
            tronjcodes
          </a>{" "}
          · © 2026 differenceAI
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
