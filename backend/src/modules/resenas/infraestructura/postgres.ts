import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ErrorResena, type Moderacion, type RepositorioResenas, type Resena, type Reputacion } from '../dominio/resenas';

const columnas = `id, reserva_id AS "reservaId", cliente_id AS "clienteId", propietario_id AS "propietarioId", proveedor_id AS "proveedorId",
  publicacion_id AS "publicacionId", titulo, puntuacion, texto, oculta, creada_en AS "creadaEn"`;
const aResena = (r: any): Resena => ({ ...r, puntuacion: Number(r.puntuacion), creadaEn: new Date(r.creadaEn).toISOString() });
const redondear = (v: unknown) => v === null || v === undefined ? null : Math.round(Number(v) * 10) / 10;

export class PostgresResenas implements RepositorioResenas {
  constructor(private readonly pool: Pool) {}

  async crear(r: Omit<Resena, 'id' | 'oculta' | 'creadaEn'>) {
    try {
      const q = await this.pool.query(`INSERT INTO resenas(id,reserva_id,cliente_id,propietario_id,proveedor_id,publicacion_id,titulo,puntuacion,texto)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${columnas}`,
        [randomUUID(), r.reservaId, r.clienteId, r.propietarioId, r.proveedorId, r.publicacionId, r.titulo.slice(0, 160), r.puntuacion, r.texto]);
      return aResena(q.rows[0]);
    } catch (error) {
      if ((error as { constraint?: string }).constraint === 'resenas_una_por_reserva') throw new ErrorResena('RESENA_DUPLICADA', 409, 'Esta reserva ya tiene una reseña.');
      throw error;
    }
  }

  async deReserva(reservaId: string) {
    const r = await this.pool.query(`SELECT ${columnas} FROM resenas WHERE reserva_id=$1`, [reservaId]);
    return r.rows[0] ? aResena(r.rows[0]) : null;
  }

  async porId(id: string) {
    const r = await this.pool.query(`SELECT ${columnas} FROM resenas WHERE id=$1`, [id]);
    return r.rows[0] ? aResena(r.rows[0]) : null;
  }

  async publicas(proveedorId: string, page: number) {
    const [lista, agregado] = await Promise.all([
      this.pool.query(`SELECT ${columnas} FROM resenas WHERE proveedor_id=$1 AND NOT oculta ORDER BY creada_en DESC, id DESC LIMIT 20 OFFSET $2`, [proveedorId, (page - 1) * 20]),
      this.pool.query('SELECT count(*)::integer AS total, avg(puntuacion) AS promedio FROM resenas WHERE proveedor_id=$1 AND NOT oculta', [proveedorId]),
    ]);
    return { items: lista.rows.map(aResena), total: agregado.rows[0].total as number, promedio: redondear(agregado.rows[0].promedio) };
  }

  async resumen(proveedorIds: string[]) {
    const r = await this.pool.query(`SELECT proveedor_id, count(*)::integer AS total, avg(puntuacion) AS promedio FROM resenas
      WHERE proveedor_id=ANY($1::uuid[]) AND NOT oculta GROUP BY proveedor_id`, [proveedorIds]);
    return new Map<string, Reputacion>(r.rows.map(f => [f.proveedor_id as string, { total: f.total as number, promedio: redondear(f.promedio) }]));
  }

  async paraAdministrar(page: number) {
    const r = await this.pool.query(`WITH pagina AS (SELECT ${columnas} FROM resenas ORDER BY creada_en DESC, id DESC LIMIT 20 OFFSET $1)
      SELECT p.*, (SELECT jsonb_build_object('oculta',m.oculta,'motivo',m.motivo,'creadaEn',m.creada_en) FROM resenas_moderaciones m
        WHERE m.resena_id=p.id ORDER BY m.creada_en DESC, m.id DESC LIMIT 1) AS "ultimaModeracion",
        (SELECT count(*)::integer FROM resenas) AS total FROM pagina p ORDER BY p."creadaEn" DESC, p.id DESC`, [(page - 1) * 20]);
    const total = r.rows[0]?.total ?? Number((await this.pool.query('SELECT count(*)::integer AS n FROM resenas')).rows[0].n);
    return { total, items: r.rows.map(({ total: _t, ultimaModeracion, ...f }) => ({ ...aResena(f), ultimaModeracion: ultimaModeracion as Moderacion | null })) };
  }

  /** Cambia la visibilidad y registra la decisión en la misma transacción. */
  async moderar(id: string, adminId: string, oculta: boolean, motivo: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const r = await client.query(`UPDATE resenas SET oculta=$2, version=version+1 WHERE id=$1 RETURNING ${columnas}`, [id, oculta]);
      if (!r.rowCount) { await client.query('ROLLBACK'); return null; }
      await client.query('INSERT INTO resenas_moderaciones(id,resena_id,admin_id,oculta,motivo) VALUES($1,$2,$3,$4,$5)', [randomUUID(), id, adminId, oculta, motivo]);
      await client.query('COMMIT');
      return aResena(r.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}
