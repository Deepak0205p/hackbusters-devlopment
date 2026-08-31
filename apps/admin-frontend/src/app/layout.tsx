import './globals.css';
import React from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata = {
  title: 'REVEAL 2.0 Admin',
  description: 'On-premise air-gapped agentic AI workbench for MRPL refinery operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
