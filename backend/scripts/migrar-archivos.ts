import type { Pool } from 'pg';
import { claveObjeto, type AlmacenObjetos } from '../src/shared/infraestructura/almacen';

/** Tablas con archivos cifrados y su clave en el almacén. */
const TABLAS = [
  { tabla: 'documentos_proveedor', borrado: 'eliminado_en', modulo: 'proveedores', tipo: 'documentos' },
  { tabla: 'evidencias', borrado: 'eliminada_en', modulo: 'resenas', tipo: 'evidencias' },
] as const;

export interface ResultadoMigracion { movidos: Record<string, number>; pendientes: Record<string, number>; errores: string[] }

/**
 * Mueve al almacén externo (013) el contenido cifrado que todavía está en PostgreSQL.
 * Por cada archivo: sube los mismos bytes cifrados, los vuelve a leer y los compara, y recién entonces deja la fila
 * con la clave del objeto y sin contenido. La actualización exige que la fila siga igual: si cambió entretanto, no la toca.
 * Se puede repetir: solo procesa filas que aún tienen contenido. Con `simular` no escribe nada.
 */
export async function migrarArchivos(pool: Pick<Pool, 'query'>, almacen: AlmacenObjetos, { lote = 50, simular = false } = {}): Promise<ResultadoMigracion> {
  const r: ResultadoMigracion = { movidos: {}, pendientes: {}, errores: [] };
  for (const { tabla, borrado, modulo, tipo } of TABLAS) {
    r.movidos[tabla] = 0;
    r.pendientes[tabla] = (await pool.query(`SELECT count(*)::integer AS n FROM ${tabla} WHERE ${borrado} IS NULL AND contenido IS NOT NULL`)).rows[0].n;
    if (simular) continue;
    for (let desde = '00000000-0000-0000-0000-000000000000'; ;) {
      const filas = (await pool.query(`SELECT id, contenido FROM ${tabla} WHERE ${borrado} IS NULL AND contenido IS NOT NULL AND id > $1 ORDER BY id LIMIT $2`, [desde, lote])).rows;
      if (!filas.length) break;
      for (const f of filas) {
        const clave = claveObjeto(modulo, tipo, f.id), datos = f.contenido as Buffer;
        try {
          await almacen.guardar(clave, datos);
          const leido = await almacen.leer(clave);
          if (!leido || !leido.equals(datos)) throw new Error('el objeto leído no coincide con el contenido');
          const hecho = await pool.query(`UPDATE ${tabla} SET objeto=$2, contenido=NULL WHERE id=$1 AND ${borrado} IS NULL AND contenido=$3`, [f.id, clave, datos]);
          if (hecho.rowCount) r.movidos[tabla]++;
          else await almacen.borrar(clave); // La fila cambió (por ejemplo, se retiró): el objeto sobra.
        } catch (error) {
          r.errores.push(`${tabla} ${f.id}: ${error instanceof Error ? error.message : 'error desconocido'}`);
        }
      }
      desde = filas[filas.length - 1].id;
    }
    r.pendientes[tabla] = (await pool.query(`SELECT count(*)::integer AS n FROM ${tabla} WHERE ${borrado} IS NULL AND contenido IS NOT NULL`)).rows[0].n;
  }
  return r;
}
