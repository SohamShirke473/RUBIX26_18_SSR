import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from "../Provider/ConvexClientProvider";
import { ThemeProvider } from "@/lib/theme-provider";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FindIt Hub",
  description: "FindIt Hub is a community-driven lost and found platform that helps people report, match, and recover lost items securely.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body

        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <ThemeProvider>
            <ClerkProvider>
              <ConvexClientProvider>
                <Navbar />
                {children}
                <Footer />
                <Toaster />
              </ConvexClientProvider>
            </ClerkProvider>
          </ThemeProvider>
        </LanguageProvider>

      </body>
    </html>
  );
}
