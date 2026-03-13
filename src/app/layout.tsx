import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Pages",
  description: "Personal task manager with projects, color labels, and progress tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`} style={{ fontFamily: "var(--font-inter), 'Helvetica Neue', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
