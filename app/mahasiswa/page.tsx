import { getDb } from '@/lib/db';
import { mapMahasiswaRow } from '@/lib/mappers';
import { MahasiswaManager } from './MahasiswaManager';

export const dynamic = 'force-dynamic';

export default function MahasiswaPage() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all();
  return <MahasiswaManager initialData={rows.map(mapMahasiswaRow)} />;
}
