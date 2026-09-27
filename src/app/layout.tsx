import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'pRash Hub - All-in-One Multi-Agent AI',
  description:
    'Personal all-in-one chat app with specialized agents (KidStory, StudyBuddy, Worksheet, DataAnalyst, Doctor, Psycho, Spiritual) and zero-downtime model failover.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
