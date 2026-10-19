import { getDb } from '@/lib/db';
import { mapKriteriaRow } from '@/lib/mappers';
import { KriteriaManager } from './KriteriaManager';

export const dynamic = 'force-dynamic';

export default function KriteriaPage() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM kriteria ORDER BY kode').all();
  return <KriteriaManager initialData={rows.map(mapKriteriaRow)} />;
}
