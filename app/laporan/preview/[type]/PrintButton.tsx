'use client';

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="print:hidden rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
      Cetak / Simpan PDF
    </button>
  );
}
