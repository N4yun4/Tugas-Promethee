'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/lib/useAppState';
import {
  IconDashboard,
  IconUsers,
  IconSliders,
  IconClipboard,
  IconPlay,
  IconTrophy,
  IconFileText,
  IconMenu,
  IconX,
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

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-glow">
        <span className="font-mono text-base font-semibold">Σ</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-extrabold tracking-wide text-white">SPK PROMETHEE</p>
        <p className="text-xs text-indigo-300">Ranking Mahasiswa</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const state = useAppState();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 print:hidden lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-indigo-100 transition hover:bg-white/10"
        >
          <IconMenu className="h-6 w-6" />
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <nav
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink text-indigo-100 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Brand />
          <button
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-indigo-200 transition hover:bg-white/10 lg:hidden"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <p className="px-6 pb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-400">Menu</p>
        <ul className="flex-1 space-y-1 overflow-y-auto px-3">
          {links.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow'
                      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="m-3 rounded-2xl bg-white/5 p-4 text-xs text-indigo-200">
          <p className="font-semibold text-white">Metode PROMETHEE II</p>
          <p className="mt-0.5">
            {state ? `${state.mahasiswa.length} mahasiswa · ${state.kriteria.length} kriteria` : 'Memuat data...'}
          </p>
        </div>
      </nav>
    </>
  );
}
