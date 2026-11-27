import { Pool } from 'pg';
import { crearAlmacen } from '../src/shared/infraestructura/almacen';
import { migrarArchivos } from './migrar-archivos';

/**
 * 013: mueve al almacén externo los archivos cifrados que siguen en PostgreSQL.
 * Uso: QATU_ALMACEN=r2 (con las variables QATU_R2_*) y `npm run archivos:mover -- --simular` para ver cuántos hay;
 * sin `--simular` los mueve. Hacer antes una copia de la base.
 */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  const almacen = crearAlmacen();
  if (!almacen) throw new Error('Configura QATU_ALMACEN=r2 para elegir el almacén de destino.');
  const simular = process.argv.includes('--simular');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const r = await migrarArchivos(pool, almacen, { simular });
    console.log(JSON.stringify(r, null, 2));
    console.log(simular ? 'Simulación: no se movió nada.' : r.errores.length ? 'Terminó con errores: vuelve a ejecutarlo para reintentar.' : 'Archivos movidos al almacén.');
    if (r.errores.length) process.exitCode = 1;
  } finally { await pool.end(); }
}

main().catch(error => { console.error('No se pudieron mover los archivos:', error instanceof Error ? error.message : 'error desconocido'); process.exitCode = 1; });
