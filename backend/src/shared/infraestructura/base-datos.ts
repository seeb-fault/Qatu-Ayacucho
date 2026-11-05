import { Pool } from 'pg';

/**
 * Describe un error para los registros sin exponer datos: el mensaje de PostgreSQL puede citar valores,
 * así que solo se incluye el de errores sin código SQL, como los de conexión o de tiempo de espera.
 */
export function describirError(error: unknown): string {
  const e = error as { name?: unknown; code?: unknown; constraint?: unknown; message?: unknown } | null;
  const partes = [e?.name, e?.code, e?.constraint].filter(v => typeof v === 'string' && v);
  if (!e?.code && typeof e?.message === 'string') partes.push(e.message.slice(0, 120));
  return partes.join(' ') || 'desconocido';
}

export function crearPool(max: number): Pool {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max, connectionTimeoutMillis: 5000 });
  // Sin este manejador, una conexión inactiva cortada por PostgreSQL o la red termina todo el proceso.
  // El pool ya la descarta y abre otra cuando haga falta.
  pool.on('error', error => console.error('Se perdió una conexión inactiva con PostgreSQL:', describirError(error)));
  return pool;
}
