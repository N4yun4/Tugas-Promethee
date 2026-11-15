import { IconChevronLeft, IconChevronRight } from './icons';

export function Pagination({
  shown,
  total,
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  shown: number;
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <span>
        Menampilkan <span className="font-medium text-slate-700">{shown}</span> dari{' '}
        <span className="font-medium text-slate-700">{total}</span> mahasiswa
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={onPrev}
          aria-label="Halaman sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[5rem] text-center font-medium text-slate-700">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={onNext}
          aria-label="Halaman berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
