import type { Pool } from 'pg';
import type { Transaccion } from '../dominio/transaccion';
import { ErrorAlmacen, type AlmacenObjetos } from './almacen';

/**
 * Acceso de los módulos al almacén externo (013) y a la cola `objetos_por_borrar`.
 * - Sin almacén (QATU_ALMACEN vacío o «postgres») los archivos siguen dentro de PostgreSQL.
 * - Retirar un archivo encola su objeto en la misma transacción; `procesarCola` lo borra del almacén y reintenta si falla.
 */
export class ArchivosExternos {
  private procesando?: Promise<number>;

  constructor(private readonly pool: Pool, readonly almacen: AlmacenObjetos | null) {}

  /** Lee el contenido cifrado de un archivo, esté en PostgreSQL o en el almacén. */
  async contenido(fila: { contenido: Uint8Array | null; objeto: string | null }): Promise<Buffer | null> {
    if (fila.contenido) return Buffer.from(fila.contenido);
    if (!fila.objeto) return null;
    if (!this.almacen) throw new ErrorAlmacen('El archivo está en el almacén externo, pero QATU_ALMACEN no lo habilita.');
    const datos = await this.almacen.leer(fila.objeto);
    if (!datos) throw new ErrorAlmacen('El archivo no está en el almacén externo.');
    return datos;
  }

  /** Sube objetos antes de la transacción que los registra. Si algo falla, encola los ya subidos para borrarlos. */
  async subir(objetos: { clave: string; datos: Uint8Array }[]) {
    const subidos: string[] = [];
    try {
      for (const o of objetos) { await this.almacen!.guardar(o.clave, o.datos); subidos.push(o.clave); }
    } catch (error) {
      await this.descartar(subidos);
      throw error;
    }
  }

  /** Objetos subidos cuya transacción no llegó a confirmarse: se encolan y se intenta borrarlos ya. */
  async descartar(claves: string[]) {
    if (!claves.length) return;
    await encolarBorrado(this.pool, claves);
    void this.procesarCola().catch(() => undefined);
  }

  /** Espera la ronda de borrado en curso, si la hay (al cerrar la aplicación). */
  async esperar() { await this.procesando?.catch(() => undefined); }

  /** Borra del almacén lo que está en la cola. Devuelve cuántos objetos se borraron. */
  procesarCola(lote = 100): Promise<number> {
    if (!this.almacen) return Promise.resolve(0);
    this.procesando ??= this.vaciar(lote).finally(() => { this.procesando = undefined; });
    return this.procesando;
  }

  private async vaciar(lote: number) {
    const pendientes = (await this.pool.query('SELECT objeto FROM objetos_por_borrar ORDER BY desde, objeto LIMIT $1', [lote])).rows.map(f => f.objeto as string);
    let borrados = 0;
    for (const objeto of pendientes) {
      try {
        await this.almacen!.borrar(objeto);
        await this.pool.query('DELETE FROM objetos_por_borrar WHERE objeto=$1', [objeto]);
        borrados++;
      } catch (error) {
        await this.pool.query('UPDATE objetos_por_borrar SET intentos=intentos+1, ultimo_error=$2 WHERE objeto=$1',
          [objeto, (error instanceof Error ? error.message : 'Error desconocido').slice(0, 300)]);
      }
    }
    return borrados;
  }
}

/** Encola objetos para borrar, dentro de la transacción que retira los archivos. */
export async function encolarBorrado(tx: Transaccion | Pick<Pool, 'query'>, claves: string[]) {
  if (!claves.length) return;
  await tx.query('INSERT INTO objetos_por_borrar(objeto) SELECT unnest($1::text[]) ON CONFLICT (objeto) DO NOTHING', [claves]);
}
