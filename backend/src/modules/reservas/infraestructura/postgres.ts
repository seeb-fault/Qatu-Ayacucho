import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { ErrorReserva, type NuevaSolicitud, type Solicitud } from '../dominio/solicitud';
import type { RepositorioReservas } from '../dominio/puertos';

const columnas = `id, cliente_id AS "clienteId", propietario_id AS "propietarioId", proveedor_id AS "proveedorId",
  publicacion_id AS "publicacionId", recurso_id AS "recursoId", inicio, fin,
  descripcion_trabajo AS "descripcionTrabajo", snapshot, estado, motivo_rechazo AS "motivoRechazo", version, creado_en AS "creadoEn"`;
const convertir = (r: any): Solicitud => ({ ...r, inicio: new Date(r.inicio).toISOString(), fin: new Date(r.fin).toISOString(), creadoEn: new Date(r.creadoEn).toISOString() });

export class PostgresReservas implements RepositorioReservas {
  constructor(private readonly pool: Pool) {}

  private async transaccion<T>(operacion: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await operacion(client);
      await client.query('COMMIT');
      return resultado;
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { code?: string; constraint?: string }).code === '23505'
        && (error as { constraint?: string }).constraint === 'reservas_pendiente_duplicada') {
        throw new ErrorReserva('SOLICITUD_DUPLICADA', 409, 'Ya tienes una solicitud pendiente para esta unidad y estas fechas. Revisa tu bandeja.');
      }
      throw error;
    } finally { client.release(); }
  }

  async crear(d: NuevaSolicitud): Promise<Solicitud> {
    return this.transaccion(async client => {
      const id = randomUUID();
      const r = await client.query(`INSERT INTO reservas(id,cliente_id,propietario_id,proveedor_id,publicacion_id,recurso_id,inicio,fin,descripcion_trabajo,snapshot)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${columnas}`,
      [id,d.clienteId,d.propietarioId,d.proveedorId,d.publicacionId,d.recursoId,d.inicio,d.fin,d.descripcionTrabajo,JSON.stringify(d.snapshot)]);
      await client.query('INSERT INTO reservas_outbox(id,agregado_id,tipo,payload) VALUES($1,$2,$3,$4)',
        [randomUUID(),id,'SOLICITUD_CREADA',JSON.stringify({reservaId:id,version:1})]);
      return convertir(r.rows[0]);
    });
  }

  async porId(id: string, actorId: string) {
    const r = await this.pool.query(`SELECT ${columnas} FROM reservas WHERE id=$1 AND (cliente_id=$2 OR propietario_id=$2)`, [id,actorId]);
    return r.rows[0] ? convertir(r.rows[0]) : null;
  }

  async listar(actorId: string, vista: 'cliente' | 'proveedor', page: number) {
    const columna = vista === 'cliente' ? 'cliente_id' : 'propietario_id';
    const r = await this.pool.query(`WITH propias AS MATERIALIZED (SELECT ${columnas} FROM reservas WHERE ${columna}=$1),
      pagina AS (SELECT * FROM propias ORDER BY "creadoEn" DESC,id DESC LIMIT 20 OFFSET $2)
      SELECT (SELECT count(*)::integer FROM propias) AS total,
        COALESCE((SELECT jsonb_agg(p ORDER BY p."creadoEn" DESC,p.id DESC) FROM pagina p),'[]'::jsonb) AS items`, [actorId,(page-1)*20]);
    return { total: r.rows[0].total as number, items: r.rows[0].items.map(convertir) as Solicitud[] };
  }

  async rechazar(id: string, propietarioId: string, versionActual: number, motivo: string): Promise<Solicitud> {
    return this.transaccion(async client => {
      const r = await client.query(`UPDATE reservas SET estado='RECHAZADA',motivo_rechazo=$4,version=version+1
        WHERE id=$1 AND propietario_id=$2 AND version=$3 AND estado='PENDIENTE' RETURNING ${columnas}`, [id,propietarioId,versionActual,motivo]);
      if (!r.rowCount) throw new ErrorReserva('RESERVA_MODIFICADA',409,'La solicitud cambió o ya fue respondida. Recarga la bandeja.');
      await client.query('INSERT INTO reservas_outbox(id,agregado_id,tipo,payload) VALUES($1,$2,$3,$4)',
        [randomUUID(),id,'SOLICITUD_RECHAZADA',JSON.stringify({reservaId:id,version:r.rows[0].version})]);
      return convertir(r.rows[0]);
    });
  }
}
