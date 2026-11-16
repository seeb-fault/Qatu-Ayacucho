import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { anioLima, numeroHoja, venceEn, type EntradaHoja, type Hoja, type MedioRespuesta, type Titular } from '../dominio/reclamaciones';

const columnas = `id, numero, tipo, titular, usuario_id AS "usuarioId", nombre, tipo_documento AS "tipoDocumento", numero_documento AS "numeroDocumento",
  domicilio, telefono, email, medio_respuesta AS "medioRespuesta", menor_de_edad AS "menorDeEdad", apoderado_nombre AS "apoderadoNombre",
  apoderado_documento AS "apoderadoDocumento", bien_tipo AS "bienTipo", bien_descripcion AS "bienDescripcion", monto_centimos AS "montoCentimos",
  detalle, pedido, presentada_en AS "presentadaEn", to_char(vence_en, 'YYYY-MM-DD') AS "venceEn", respuesta, respuesta_medio AS "respuestaMedio",
  respondida_en AS "respondidaEn"`;
const fecha = (v: unknown) => v ? new Date(v as string).toISOString() : null;
const aHoja = (f: any): Hoja => ({ ...f, presentadaEn: fecha(f.presentadaEn)!, respondidaEn: fecha(f.respondidaEn) });

export class PostgresReclamaciones {
  constructor(private readonly pool: Pool) {}

  /** Asigna el siguiente número del año (sin saltos: el contador se bloquea en la transacción) y guarda la hoja. */
  async presentar(d: EntradaHoja & { titular: Titular; usuarioId: string | null; codigoHash: string }, ahora = new Date()): Promise<Hoja> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const anio = anioLima(ahora);
      const c = await cliente.query(`INSERT INTO reclamaciones_correlativo(anio, ultimo) VALUES ($1, 1)
        ON CONFLICT (anio) DO UPDATE SET ultimo = reclamaciones_correlativo.ultimo + 1 RETURNING ultimo`, [anio]);
      const r = await cliente.query(`INSERT INTO reclamaciones_hojas(id, numero, codigo_consulta_hash, tipo, titular, usuario_id, nombre, tipo_documento,
          numero_documento, domicilio, telefono, email, medio_respuesta, menor_de_edad, apoderado_nombre, apoderado_documento, bien_tipo,
          bien_descripcion, monto_centimos, detalle, pedido, presentada_en, vence_en)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING ${columnas}`,
        [randomUUID(), numeroHoja(anio, c.rows[0].ultimo), d.codigoHash, d.tipo, JSON.stringify(d.titular), d.usuarioId, d.nombre, d.tipoDocumento,
          d.numeroDocumento, d.domicilio, d.telefono, d.email, d.medioRespuesta, d.menorDeEdad, d.apoderadoNombre, d.apoderadoDocumento, d.bienTipo,
          d.bienDescripcion, d.montoCentimos, d.detalle, d.pedido, ahora.toISOString(), venceEn(ahora)]);
      await cliente.query('COMMIT');
      return aHoja(r.rows[0]);
    } catch (error) {
      await cliente.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      cliente.release();
    }
  }

  async porConsulta(numero: string, codigoHash: string) {
    const r = await this.pool.query(`SELECT ${columnas} FROM reclamaciones_hojas WHERE numero=$1 AND codigo_consulta_hash=$2`, [numero, codigoHash]);
    return r.rows[0] ? aHoja(r.rows[0]) : null;
  }

  async porId(id: string) {
    const r = await this.pool.query(`SELECT ${columnas} FROM reclamaciones_hojas WHERE id=$1`, [id]);
    return r.rows[0] ? aHoja(r.rows[0]) : null;
  }

  /** Pendientes primero por vencimiento; respondidas de la más reciente a la más antigua. */
  async paraAdministrar(estado: 'pendiente' | 'respondida', page: number) {
    const filtro = estado === 'pendiente' ? 'respuesta IS NULL' : 'respuesta IS NOT NULL';
    const orden = estado === 'pendiente' ? 'vence_en ASC, numero ASC' : 'respondida_en DESC, numero DESC';
    const [lista, total] = await Promise.all([
      this.pool.query(`SELECT ${columnas} FROM reclamaciones_hojas WHERE ${filtro} ORDER BY ${orden} LIMIT 20 OFFSET $1`, [(page - 1) * 20]),
      this.pool.query(`SELECT count(*)::int AS total FROM reclamaciones_hojas WHERE ${filtro}`),
    ]);
    return { items: lista.rows.map(aHoja), total: total.rows[0].total as number };
  }

  /** Solo registra la primera respuesta: la hoja no se edita después. */
  async responder(id: string, adminId: string, respuesta: string, medio: MedioRespuesta) {
    const r = await this.pool.query(`UPDATE reclamaciones_hojas SET respuesta=$3, respuesta_medio=$4, respondida_en=now(), respondida_por=$2
      WHERE id=$1 AND respuesta IS NULL RETURNING ${columnas}`, [id, adminId, respuesta, medio]);
    return r.rows[0] ? aHoja(r.rows[0]) : null;
  }
}
