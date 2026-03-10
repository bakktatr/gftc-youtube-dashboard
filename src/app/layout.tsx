import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarLayout } from "@/components/sidebar-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GFTC YouTube Analytics Dashboard",
  description: "유튜브 채널 지표 자동 관리 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", var(--font-geist-sans), system-ui, sans-serif' }}
      >
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </body>
    </html>
  );
}
