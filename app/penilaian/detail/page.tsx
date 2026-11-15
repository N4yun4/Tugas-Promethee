import { Suspense } from 'react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { DetailPenilaian } from './DetailPenilaian';

export default function DetailPenilaianPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DetailPenilaian />
    </Suspense>
  );
}
