import { PreviewLaporan } from './PreviewLaporan';
import { LAPORAN_TYPES, type LaporanType } from './laporanTypes';

export const dynamicParams = false;

export function generateStaticParams() {
  return LAPORAN_TYPES.map((type) => ({ type }));
}

export default function PreviewLaporanPage({ params }: { params: { type: LaporanType } }) {
  return <PreviewLaporan type={params.type} />;
}
