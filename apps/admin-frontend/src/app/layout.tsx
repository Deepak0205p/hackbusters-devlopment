import './globals.css';
import React from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata = {
  title: 'MRPL Sovereign AI Workbench (SIH26117)',
  description: 'On-premise air-gapped agentic AI workbench for MRPL refinery operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-[#000000] text-[#ededed] font-sans antialiased min-h-screen flex flex-col selection:bg-blue-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
