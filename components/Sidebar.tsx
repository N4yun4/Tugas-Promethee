'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconDashboard,
  IconUsers,
  IconSliders,
  IconClipboard,
  IconPlay,
  IconTrophy,
  IconFileText,
} from './icons';

const links = [
  { href: '/', label: 'Dashboard', icon: IconDashboard },
  { href: '/mahasiswa', label: 'Data Mahasiswa', icon: IconUsers },
  { href: '/kriteria', label: 'Data Kriteria', icon: IconSliders },
  { href: '/penilaian', label: 'Data Penilaian', icon: IconClipboard },
  { href: '/proses', label: 'Proses PROMETHEE', icon: IconPlay },
  { href: '/ranking', label: 'Hasil Ranking', icon: IconTrophy },
  { href: '/laporan', label: 'Laporan', icon: IconFileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="font-mono text-sm font-semibold">Σ</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">SPK PROMETHEE</p>
          <p className="text-xs text-muted">Ranking Mahasiswa</p>
        </div>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-muted-bg hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border p-4 text-xs text-muted">
        <p>Metode PROMETHEE II</p>
        <p>254 mahasiswa &middot; 5 kriteria</p>
      </div>
    </nav>
  );
}
