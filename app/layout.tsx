import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'SPK Penentuan Peringkat Mahasiswa',
  description: 'Sistem Pendukung Keputusan ranking mahasiswa dengan metode PROMETHEE II',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-dvh bg-background font-sans text-slate-900 antialiased">
        <Sidebar />
        <main className="min-w-0 flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
