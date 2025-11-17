import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import PWAFeatures from '@/components/PWAFeatures';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '逗逗狐记账APP',
  description: '可离线使用的个人记账应用程序',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '逗逗狐记账APP',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegistration />
        <PWAFeatures />
      </body>
    </html>
  );
}
