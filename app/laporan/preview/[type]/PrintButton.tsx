'use client';

import { IconPrinter } from '@/components/icons';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden btn-primary"
    >
      <IconPrinter className="h-4 w-4" />
      Cetak / Simpan PDF
    </button>
  );
}
