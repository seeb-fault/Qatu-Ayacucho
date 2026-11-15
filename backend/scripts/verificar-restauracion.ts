import { Pool } from 'pg';
import { verificarRestauracion } from './restauracion';

/** EQ-09: ejecutar contra la base restaurada con la DOCUMENTOS_KEY de producción. Solo lee. */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const r = await verificarRestauracion(pool);
    console.log(JSON.stringify(r, null, 2));
    if (r.pagos.porConciliar) console.log(`Hay ${r.pagos.porConciliar} pagos por conciliar: el conciliador de Pagos los consultará en la pasarela.`);
    console.log(r.ok ? 'Restauración verificada.' : 'La restauración tiene problemas.');
    if (!r.ok) process.exitCode = 1;
  } finally { await pool.end(); }
}

main().catch(() => { console.error('No se pudo verificar la restauración. Revisa PostgreSQL y DATABASE_URL.'); process.exitCode = 1; });
