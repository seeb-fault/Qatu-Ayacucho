import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { ErrorReserva, type NuevaSolicitud, type Solicitud } from '../dominio/solicitud';
import type { RepositorioReservas } from '../dominio/puertos';
import { eventos, transicion, type AccionReserva } from '../dominio/alquiler';

const columnas = `id, cliente_id AS "clienteId", propietario_id AS "propietarioId", proveedor_id AS "proveedorId",
  publicacion_id AS "publicacionId", recurso_id AS "recursoId", inicio, fin,
  descripcion_trabajo AS "descripcionTrabajo", snapshot, estado, motivo_rechazo AS "motivoRechazo", version, creado_en AS "creadoEn",
  tipo_solicitud AS "tipoSolicitud", condiciones, vence_en AS "venceEn", pago_estado AS "pagoEstado", efectivo_centimos AS "efectivoCentimos",
  entregado_en AS "entregadoEn", recibido_en AS "recibidoEn", devolucion_informada_en AS "devolucionInformadaEn", devuelto_en AS "devueltoEn",
  importe_final_centimos AS "importeFinalCentimos", saldo_centimos AS "saldoCentimos", dias_extra AS "diasExtra", motivo_operacion AS "motivoOperacion"`;
const convertir = (r: any): Solicitud => {
  const resultado = { ...r };
  for (const campo of ['inicio','fin','creadoEn','venceEn','entregadoEn','recibidoEn','devolucionInformadaEn','devueltoEn']) resultado[campo] = r[campo] == null ? null : new Date(r[campo]).toISOString();
  for (const campo of ['efectivoCentimos','saldoCentimos','importeFinalCentimos']) resultado[campo] = r[campo] == null ? null : Number(r[campo]);
  return resultado;
};

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
      if ((error as { code?: string }).code === '23P01') throw new ErrorReserva('RECURSO_OCUPADO',409,'La unidad ya está apartada para esas fechas. Actualiza y elige otro horario.');
      if ((error as { constraint?: string }).constraint === 'reservas_posesion_unica') throw new ErrorReserva('HERRAMIENTA_SIN_DEVOLVER',409,'La unidad sigue en poder de otro cliente. Confirma su devolución antes de entregarla.');
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
      const r = await client.query(`INSERT INTO reservas(id,cliente_id,propietario_id,proveedor_id,publicacion_id,recurso_id,inicio,fin,descripcion_trabajo,snapshot,tipo_solicitud,condiciones)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ${columnas}`,
      [id,d.clienteId,d.propietarioId,d.proveedorId,d.publicacionId,d.recursoId,d.inicio,d.fin,d.descripcionTrabajo,JSON.stringify(d.snapshot),d.tipoSolicitud,d.condiciones ? JSON.stringify(d.condiciones) : null]);
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

  private async vencerEn(client: PoolClient, recursoId?: string) {
    const vencidas = await client.query(`SELECT id FROM reservas WHERE estado='ACEPTADA' AND vence_en<=clock_timestamp()
      ${recursoId ? 'AND recurso_id=$1' : ''} ORDER BY id FOR UPDATE SKIP LOCKED`, recursoId ? [recursoId] : []);
    if (!vencidas.rowCount) return 0;
    const ids = vencidas.rows.map(r => r.id);
    await client.query('UPDATE reservas_bloqueos SET activo=false WHERE reserva_id=ANY($1::uuid[])', [ids]);
    const cambios = await client.query("UPDATE reservas SET estado='VENCIDA',vence_en=NULL,version=version+1 WHERE id=ANY($1::uuid[]) RETURNING id,version", [ids]);
    for (const r of cambios.rows) await client.query('INSERT INTO reservas_outbox(id,agregado_id,tipo,payload) VALUES($1,$2,$3,$4)', [randomUUID(),r.id,'RESERVA_VENCIDA',JSON.stringify({reservaId:r.id,version:r.version})]);
    return cambios.rowCount ?? 0;
  }

  vencer() { return this.transaccion(client => this.vencerEn(client)); }

  async ejecutar(id: string, actorId: string, versionActual: number, accion: AccionReserva, motivo: string | null) {
    return this.transaccion(async client => {
      const visible = await client.query('SELECT recurso_id FROM reservas WHERE id=$1 AND (cliente_id=$2 OR propietario_id=$2)', [id,actorId]);
      if (!visible.rowCount) throw new ErrorReserva('RESERVA_NO_DISPONIBLE',404,'La solicitud no está disponible.');
      const recursoId = visible.rows[0].recurso_id;
      // Orden común por recurso: aceptación, entrega y liberación comparten la misma autoridad.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,488005))', [recursoId]);
      await this.vencerEn(client, recursoId);
      const actual = convertir((await client.query(`SELECT ${columnas} FROM reservas WHERE id=$1 FOR UPDATE`, [id])).rows[0]);
      if (actual.version !== versionActual) throw new ErrorReserva('RESERVA_MODIFICADA',409,'La reserva cambió. Actualiza antes de continuar.');
      const ahora = (await client.query('SELECT clock_timestamp() AS ahora')).rows[0].ahora.getTime();
      const s = transicion(actual,actorId,accion,motivo,ahora);
      if (accion === 'aceptacion') await client.query('INSERT INTO reservas_bloqueos(reserva_id,recurso_id,inicio,fin) VALUES($1,$2,$3,$4)', [s.id,s.recursoId,s.inicio,s.fin]);
      if (accion === 'efectivo') await client.query('UPDATE reservas_bloqueos SET inicio=LEAST(inicio,$2::timestamptz) WHERE reserva_id=$1', [s.id,s.entregadoEn]);
      if (['cancelacion','devolucion/confirmacion'].includes(accion)) await client.query('UPDATE reservas_bloqueos SET activo=false WHERE reserva_id=$1', [s.id]);
      const r = await client.query(`UPDATE reservas SET estado=$2,version=$3,vence_en=$4,pago_estado=$5,efectivo_centimos=$6,
        entregado_en=$7,recibido_en=$8,devolucion_informada_en=$9,devuelto_en=$10,importe_final_centimos=$11,saldo_centimos=$12,dias_extra=$13,motivo_operacion=$14
        WHERE id=$1 RETURNING ${columnas}`, [s.id,s.estado,s.version,s.venceEn,s.pagoEstado,s.efectivoCentimos,s.entregadoEn,s.recibidoEn,s.devolucionInformadaEn,s.devueltoEn,s.importeFinalCentimos,s.saldoCentimos,s.diasExtra,s.motivoOperacion]);
      await client.query('INSERT INTO reservas_outbox(id,agregado_id,tipo,payload) VALUES($1,$2,$3,$4)', [randomUUID(),s.id,eventos[accion],JSON.stringify({reservaId:s.id,version:s.version,actorId,estado:s.estado,pagoEstado:s.pagoEstado,motivo,entregadoEn:s.entregadoEn,devolucionInformadaEn:actual.devolucionInformadaEn ?? s.devolucionInformadaEn,devueltoEn:s.devueltoEn})]);
      return convertir(r.rows[0]);
    });
  }

  async disponibilidad(recursoId: string, inicio: string, fin: string) {
    const r = await this.pool.query(`SELECT inicio,fin FROM reservas_bloqueos WHERE recurso_id=$1 AND activo
      AND tstzrange(inicio,fin,'[)') && tstzrange($2::timestamptz,$3::timestamptz,'[)') ORDER BY inicio`, [recursoId,inicio,fin]);
    const posesion = await this.pool.query("SELECT EXISTS(SELECT 1 FROM reservas WHERE recurso_id=$1 AND estado IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE')) AS ocupada", [recursoId]);
    return { franjas: r.rows.map(f => ({inicio:f.inicio.toISOString(),fin:f.fin.toISOString()})), enUso: posesion.rows[0].ocupada as boolean };
  }
}
