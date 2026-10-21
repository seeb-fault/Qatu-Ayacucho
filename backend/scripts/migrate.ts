import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';

async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(488002)");
    await client.query('CREATE TABLE IF NOT EXISTS migraciones (nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())');
    for (const nombre of ['usuarios/001-usuarios', 'usuarios/002-administracion']) {
      const result = await client.query('SELECT nombre FROM migraciones WHERE nombre = $1', [nombre]);
      if (!result.rowCount) {
        await client.query(await readFile(resolve('migrations', `${nombre}.sql`), 'utf8'));
        await client.query('INSERT INTO migraciones(nombre) VALUES ($1)', [nombre]);
      }
    }
    await client.query('COMMIT');
    console.log('Migraciones de usuarios al día.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => { console.error('No se pudo aplicar la migración. Revisa PostgreSQL y DATABASE_URL.'); process.exitCode = 1; });
