import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/mahasiswa', label: 'Data Mahasiswa' },
  { href: '/kriteria', label: 'Data Kriteria' },
  { href: '/penilaian', label: 'Data Penilaian' },
  { href: '/proses', label: 'Proses PROMETHEE' },
  { href: '/ranking', label: 'Hasil Ranking' },
  { href: '/laporan', label: 'Laporan' },
];

export function Sidebar() {
  return (
    <nav className="w-60 shrink-0 border-r border-slate-200 bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-slate-900">SPK PROMETHEE</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
