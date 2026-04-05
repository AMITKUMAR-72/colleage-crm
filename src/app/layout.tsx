import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raffles CRM",
  description: "Raffles University College Management System",
  icons: {
    icon: '/raffles-logo.png',
  },
};

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* Global API response toasts — shown for 2s on every API hit */}
        <Toaster
          position="top-right"
          gutter={8}
          containerStyle={{ top: 20, right: 20 }}
          toastOptions={{
            duration: 2000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              fontFamily: 'var(--font-inter), sans-serif',
              fontWeight: '700',
              fontSize: '13px',
              borderRadius: '14px',
              padding: '12px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              maxWidth: '380px',
              letterSpacing: '-0.01em',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' },
              style: {
                background: '#052e16',
                color: '#bbf7d0',
                border: '1px solid #166534',
              },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
              style: {
                background: '#450a0a',
                color: '#fecaca',
                border: '1px solid #991b1b',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

