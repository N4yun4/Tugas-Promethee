'use client';

import { IconPrinter } from '@/components/icons';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
    >
      <IconPrinter className="h-4 w-4" />
      Cetak / Simpan PDF
    </button>
  );
}
