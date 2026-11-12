import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import { ArchivosCifrados } from '../src/shared/infraestructura/archivos-cifrados';
import { MIGRACIONES } from './migraciones';

/** Tablas con archivos cifrados dentro de la base: la copia de PostgreSQL los incluye. */
const ARCHIVOS = [
  { tabla: 'evidencias', borrado: 'eliminada_en' },
  { tabla: 'documentos_proveedor', borrado: 'eliminado_en' },
] as const;
/** Tablas cuyo número de filas debe coincidir entre el origen y la restauración. */
const TABLAS = ['usuarios', 'proveedores', 'verificaciones_proveedor', 'catalogo_publicaciones', 'catalogo_recursos', 'reservas', 'reservas_cotizaciones', 'reservas_outbox', 'reservas_avisos', 'pagos_intentos', 'pagos_eventos_pasarela',
  'resenas', 'resenas_moderaciones', 'evidencias', 'documentos_proveedor', 'incidencias', 'garantias_documentadas'] as const;

export interface ResultadoRestauracion {
  ok: boolean;
  problemas: string[];
  filas: Record<string, number>;
  archivos: Record<string, { vigentes: number; verificados: number; retirados: number }>;
  pagos: { porEstado: Record<string, number>; porConciliar: number; reembolsosPendientes: number };
  /** Resumen del contenido: igual en el origen y en la restauración si no se perdió nada. */
  huella: string;
}

/**
 * Comprueba una base restaurada: migraciones completas, restricciones válidas, cada archivo cifrado
 * descifra con DOCUMENTOS_KEY y coincide con su hash, y el historial de pagos está completo.
 * Solo lee; no cambia la base.
 */
export async function verificarRestauracion(pool: Pick<Pool, 'query'>, archivos = new ArchivosCifrados()): Promise<ResultadoRestauracion> {
  const problemas: string[] = [], huella = createHash('sha256');

  const aplicadas = new Set((await pool.query('SELECT nombre FROM migraciones')).rows.map(f => f.nombre as string));
  for (const m of MIGRACIONES) if (!aplicadas.has(m)) problemas.push(`Falta la migración ${m}.`);

  const invalidas = await pool.query("SELECT conrelid::regclass::text AS tabla, conname FROM pg_constraint WHERE NOT convalidated AND connamespace='public'::regnamespace");
  for (const f of invalidas.rows) problemas.push(`Restricción sin validar: ${f.tabla}.${f.conname}.`);

  const filas: Record<string, number> = {};
  for (const tabla of TABLAS) {
    filas[tabla] = (await pool.query(`SELECT count(*)::integer AS n FROM ${tabla}`)).rows[0].n;
    huella.update(`${tabla}:${filas[tabla]};`);
  }

  if (!archivos.habilitado()) problemas.push('Falta DOCUMENTOS_KEY: sin la clave original los archivos restaurados no se pueden leer.');
  const resumenArchivos: ResultadoRestauracion['archivos'] = {};
  for (const { tabla, borrado } of ARCHIVOS) {
    const r = { vigentes: 0, verificados: 0, retirados: 0 };
    resumenArchivos[tabla] = r;
    r.retirados = (await pool.query(`SELECT count(*)::integer AS n FROM ${tabla} WHERE ${borrado} IS NOT NULL`)).rows[0].n;
    // Por lotes, para no cargar todos los archivos en memoria.
    for (let desde = '00000000-0000-0000-0000-000000000000'; ;) {
      const lote = (await pool.query(`SELECT id, bytes, sha256, contenido, iv, tag FROM ${tabla} WHERE ${borrado} IS NULL AND id > $1 ORDER BY id LIMIT 50`, [desde])).rows;
      if (!lote.length) break;
      for (const f of lote) {
        r.vigentes++;
        huella.update(`${tabla}/${f.id}/${f.sha256};`);
        if (!archivos.habilitado()) continue;
        try {
          const claro = archivos.descifrar(f);
          if (claro.length !== f.bytes || createHash('sha256').update(claro).digest('hex') !== f.sha256) problemas.push(`${tabla} ${f.id}: el contenido no coincide con su hash.`);
          else r.verificados++;
        } catch {
          problemas.push(`${tabla} ${f.id}: no se pudo descifrar (clave distinta o contenido dañado).`);
        }
      }
      desde = lote[lote.length - 1].id;
    }
  }

  const estados = await pool.query('SELECT estado, count(*)::integer AS n FROM pagos_intentos GROUP BY estado ORDER BY estado');
  const porEstado = Object.fromEntries(estados.rows.map(f => [f.estado as string, f.n as number]));
  const pagos = (await pool.query(`SELECT count(*) FILTER (WHERE estado IN ('PROCESANDO','DESCONOCIDO'))::integer AS conciliar,
    count(*) FILTER (WHERE reembolso_pendiente)::integer AS reembolsos FROM pagos_intentos`)).rows[0];
  const historial = await pool.query("SELECT coalesce(string_agg(id::text || ':' || estado || ':' || importe_centimos, ',' ORDER BY id), '') AS h FROM pagos_intentos");
  huella.update(`pagos:${historial.rows[0].h};`);
  // Un pago aprobado debe tener su reserva; las llaves foráneas lo exigen, esto confirma que se restauraron.
  const huerfanos = (await pool.query('SELECT count(*)::integer AS n FROM pagos_intentos p LEFT JOIN reservas r ON r.id=p.reserva_id WHERE r.id IS NULL')).rows[0].n;
  if (huerfanos) problemas.push(`${huerfanos} pagos sin su reserva.`);

  return {
    ok: !problemas.length, problemas, filas, archivos: resumenArchivos,
    pagos: { porEstado, porConciliar: pagos.conciliar, reembolsosPendientes: pagos.reembolsos },
    huella: huella.digest('hex'),
  };
}
