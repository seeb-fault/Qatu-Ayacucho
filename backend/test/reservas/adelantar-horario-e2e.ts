// Fixture exclusivo de pruebas: lleva el horario de una reserva a la hora actual para probar el inicio del oficio.
import { Pool } from 'pg';

async function adelantar() {
  const databaseUrl = process.env.DATABASE_URL, id = process.argv[2];
  if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test') || process.env.QATU_E2E_RESERVAS !== '1' || !id) throw new Error('Se requiere una base exclusiva con sufijo _test, QATU_E2E_RESERVAS=1 y una reserva.');
  const pool = new Pool({ connectionString: databaseUrl }), client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inicio = new Date(Date.now() - 60000).toISOString(), fin = new Date(Date.now() + 3600000).toISOString();
    await client.query('UPDATE reservas SET inicio=$2,fin=$3 WHERE id=$1', [id, inicio, fin]);
    await client.query('UPDATE reservas_bloqueos SET inicio=$2,fin=$3 WHERE reserva_id=$1', [id, inicio, fin]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); await pool.end(); }
}
adelantar().catch(() => { console.error('No se pudo adelantar el horario de la reserva de prueba.'); process.exitCode = 1; });
