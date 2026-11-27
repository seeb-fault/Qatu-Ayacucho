import type { Pool } from 'pg';
import type { ArchivoCifrado } from '../../../shared/infraestructura/archivos-cifrados';
import { claveObjeto } from '../../../shared/infraestructura/almacen';
import type { ArchivosExternos } from '../../../shared/infraestructura/archivos-externos';
import { ErrorResena } from '../dominio/resenas';
import { MAXIMO_POR_ETAPA, type Etapa, type EvidenciaGuardada } from '../dominio/evidencias';

const columnas = `id, reserva_id AS "reservaId", autor_id AS "autorId", etapa, tipo, bytes, sha256, creada_en AS "creadaEn", eliminada_en AS "eliminadaEn"`;
const aEvidencia = (f: any): EvidenciaGuardada => ({ ...f, bytes: Number(f.bytes), creadaEn: new Date(f.creadaEn).toISOString(), eliminadaEn: f.eliminadaEn ? new Date(f.eliminadaEn).toISOString() : null });

export class PostgresEvidencias {
  /** Sin `archivos` (o sin almacén configurado) el contenido cifrado se guarda en la propia tabla, como antes de 013. */
  constructor(private readonly pool: Pool, private readonly archivos?: ArchivosExternos) {}

  /** Guarda varias fotos de una etapa; el cupo se comprueba bajo un bloqueo por reserva y etapa. */
  async guardar(reservaId: string, autorId: string, etapa: Etapa, archivos: ArchivoCifrado[]) {
    // Con almacén externo, el contenido cifrado se sube antes y la fila guarda solo su clave.
    const externo = this.archivos?.almacen ? archivos.map(a => ({ clave: claveObjeto('resenas', 'evidencias', a.id), datos: a.contenido })) : [];
    if (externo.length) await this.archivos!.subir(externo);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 488006))', [reservaId + ':' + etapa]);
      const usadas = Number((await client.query('SELECT count(*) AS n FROM evidencias WHERE reserva_id=$1 AND etapa=$2', [reservaId, etapa])).rows[0].n);
      if (usadas + archivos.length > MAXIMO_POR_ETAPA) throw new ErrorResena('CUPO_EVIDENCIAS', 409, `Cada etapa admite como máximo ${MAXIMO_POR_ETAPA} fotos; quedan ${Math.max(0, MAXIMO_POR_ETAPA - usadas)}.`);
      const guardadas: EvidenciaGuardada[] = [];
      for (const a of archivos) {
        const objeto = externo.length ? claveObjeto('resenas', 'evidencias', a.id) : null;
        const r = await client.query(`INSERT INTO evidencias(id,reserva_id,autor_id,etapa,tipo,bytes,sha256,contenido,iv,tag,objeto) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING ${columnas}`,
          [a.id, reservaId, autorId, etapa, a.tipo, a.bytes, a.sha256, objeto ? null : Buffer.from(a.contenido), Buffer.from(a.iv), Buffer.from(a.tag), objeto]);
        guardadas.push(aEvidencia(r.rows[0]));
      }
      await client.query('COMMIT');
      return guardadas;
    } catch (error) {
      await client.query('ROLLBACK');
      // La transacción no se confirmó: los objetos ya subidos no deben quedar en el almacén.
      await this.archivos?.descartar(externo.map(o => o.clave));
      throw error;
    } finally { client.release(); }
  }

  async deReserva(reservaId: string) {
    return (await this.pool.query(`SELECT ${columnas} FROM evidencias WHERE reserva_id=$1 ORDER BY creada_en, id`, [reservaId])).rows.map(aEvidencia);
  }

  async archivo(id: string) {
    const r = await this.pool.query(`SELECT ${columnas}, contenido, objeto, iv, tag FROM evidencias WHERE id=$1`, [id]);
    if (!r.rows[0]) return null;
    const { contenido, objeto, iv, tag, ...f } = r.rows[0];
    const datos = contenido ? contenido as Buffer : objeto ? await this.leerObjeto(objeto) : null;
    return { ...aEvidencia(f), contenido: datos, iv: iv as Buffer | null, tag: tag as Buffer | null };
  }

  private async leerObjeto(objeto: string) {
    if (!this.archivos) throw new Error('La evidencia está en el almacén externo y no hay almacén configurado.');
    return this.archivos.contenido({ contenido: null, objeto });
  }

  async reservasConContenido(limite: number) {
    return (await this.pool.query('SELECT DISTINCT reserva_id FROM evidencias WHERE eliminada_en IS NULL LIMIT $1', [limite])).rows.map(f => f.reserva_id as string);
  }

  /**
   * Borra el contenido cifrado y conserva metadata y hash. Los objetos del almacén externo se encolan en la misma
   * sentencia: si borrarlos falla, la cola los reintenta y ninguno queda olvidado.
   */
  async borrarContenido(reservaIds: string[]) {
    if (!reservaIds.length) return 0;
    const r = await this.pool.query(`WITH v AS (SELECT id, objeto FROM evidencias WHERE reserva_id=ANY($1::uuid[]) AND eliminada_en IS NULL FOR UPDATE),
        cola AS (INSERT INTO objetos_por_borrar(objeto) SELECT objeto FROM v WHERE objeto IS NOT NULL ON CONFLICT (objeto) DO NOTHING)
      UPDATE evidencias e SET contenido=NULL, objeto=NULL, iv=NULL, tag=NULL, eliminada_en=now() FROM v WHERE e.id=v.id`, [reservaIds]);
    if (r.rowCount) void this.archivos?.procesarCola().catch(() => undefined);
    return r.rowCount ?? 0;
  }
}
