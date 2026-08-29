import './globals.css';
import React from 'react';

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
    <html lang="en" className="dark">
      <body className="bg-[#131314] text-[#e3e3e3] font-sans antialiased min-h-screen flex flex-col selection:bg-[#a8c7fa]/30 selection:text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}

