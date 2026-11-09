import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { Transaccion } from '../../../shared/dominio/transaccion';
import { ErrorPago, type IntentoPago, type RepositorioPagos, type ReservasDePago } from '../dominio/pagos';

const columnas = `id,reserva_id AS "reservaId",importe_centimos AS "importeCentimos",moneda,estado,codigo,reembolso_pendiente AS "reembolsoPendiente",creado_en AS "creadoEn"`;
const aPago = (p: any): IntentoPago => ({ ...p, importeCentimos: Number(p.importeCentimos), creadoEn: new Date(p.creadoEn).toISOString() });

/** Traduce las restricciones de la tabla de pagos: quien abre la transacción no las conoce. */
async function conErrores<T>(operacion: () => Promise<T>): Promise<T> {
  try {
    return await operacion();
  } catch (error) {
    const restriccion = (error as { constraint?: string }).constraint;
    if (restriccion === 'pagos_intentos_activo') throw new ErrorPago('PAGO_EN_CURSO',409,'Ya hay un pago en proceso para esta reserva. Espera a que se confirme antes de volver a intentarlo.');
    if (restriccion === 'pagos_intentos_vigente') throw new ErrorPago('PAGO_YA_REGISTRADO',409,'Esta reserva ya tiene un pago registrado.');
    throw error;
  }
}

export class PostgresPagos implements RepositorioPagos {
  constructor(private readonly pool: Pool, private readonly reservas: ReservasDePago) {}

  prepararPago(id: string, actorId: string, clave: string, huella: string) {
    return conErrores(() => this.reservas.conReserva(id, actorId, async reserva => {
      if (reserva.clienteId !== actorId) throw new ErrorPago('SIN_PERMISO',403,'Solo el cliente puede pagar en línea.');
      const previo = await reserva.tx.query(`SELECT ${columnas},huella FROM pagos_intentos WHERE cliente_id=$1 AND clave=$2`, [actorId,clave]);
      if (previo.rowCount) {
        const { huella: guardada, ...p } = previo.rows[0];
        if (guardada !== huella || p.reservaId !== id) throw new ErrorPago('CLAVE_REUTILIZADA',409,'Esta clave ya se usó para otro pago. Recarga antes de continuar.');
        return { intento: aPago(p), repetido: true, titulo: reserva.titulo };
      }
      if (reserva.importePagable === null) throw new ErrorPago('PAGO_NO_DISPONIBLE',409,'Esta reserva no se puede pagar en línea en su estado actual. Actualiza la bandeja.');
      const r = await reserva.tx.query(`INSERT INTO pagos_intentos(id,reserva_id,cliente_id,clave,huella,importe_centimos) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${columnas}`, [randomUUID(),id,actorId,clave,huella,reserva.importePagable]);
      return { intento: aPago(r.rows[0]), repetido: false, titulo: reserva.titulo };
    }));
  }

  async rechazarPago(intentoId: string, codigo: string) {
    const r = await this.pool.query(`UPDATE pagos_intentos SET estado='RECHAZADO',codigo=$2,resuelto_en=clock_timestamp()
      WHERE id=$1 AND estado IN ('PROCESANDO','DESCONOCIDO') RETURNING ${columnas}`, [intentoId,codigo]);
    return r.rows[0] ? aPago(r.rows[0]) : this.pagoPorId(intentoId);
  }

  async marcarPagoDesconocido(intentoId: string) {
    const r = await this.pool.query(`UPDATE pagos_intentos SET estado='DESCONOCIDO' WHERE id=$1 AND estado='PROCESANDO' RETURNING ${columnas}`, [intentoId]);
    return r.rows[0] ? aPago(r.rows[0]) : this.pagoPorId(intentoId);
  }

  /** Idempotente. Si la reserva ya no admite el pago, no se reactiva: el pago queda marcado para reembolso. */
  async aprobarPago(intentoId: string, referencia: string) {
    const previo = await this.pool.query('SELECT reserva_id FROM pagos_intentos WHERE id=$1', [intentoId]);
    if (!previo.rowCount) return null;
    return conErrores(() => this.reservas.conReserva(previo.rows[0].reserva_id, null, async reserva => {
      const intento = (await reserva.tx.query(`SELECT ${columnas} FROM pagos_intentos WHERE id=$1 FOR UPDATE`, [intentoId])).rows[0];
      // Un cargo confirmado tras darlo por no localizado también se registra, para poder devolverlo.
      const resoluble = ['PROCESANDO','DESCONOCIDO'].includes(intento.estado) || (intento.estado === 'RECHAZADO' && intento.codigo === 'SIN_CARGO_CONFIRMADO');
      if (!resoluble) return aPago(intento);
      const importe = Number(intento.importeCentimos), admite = reserva.importePagable === importe;
      const r = await reserva.tx.query(`UPDATE pagos_intentos SET estado='APROBADO',referencia=$2,codigo=NULL,resuelto_en=clock_timestamp(),
        reembolso_pendiente=$3,reembolso_motivo=$4 WHERE id=$1 RETURNING ${columnas}`, [intentoId,referencia,!admite,admite ? null : 'PAGO_TARDIO']);
      if (admite) await reserva.registrarPago(intentoId,importe);
      else await reserva.registrarPagoTardio(intentoId);
      return aPago(r.rows[0]);
    }));
  }

  async pagosDe(id: string, actorId: string) {
    if (!await this.reservas.visible(id,actorId)) return null;
    const r = await this.pool.query(`SELECT ${columnas} FROM pagos_intentos WHERE reserva_id=$1 ORDER BY creado_en DESC,id DESC`, [id]);
    return r.rows.map(aPago);
  }

  async pagoPorId(intentoId: string) {
    const r = await this.pool.query(`SELECT ${columnas} FROM pagos_intentos WHERE id=$1`, [intentoId]);
    return r.rows[0] ? aPago(r.rows[0]) : null;
  }

  async pagosPorConciliar(procesandoMs: number, limite: number) {
    const r = await this.pool.query(`SELECT ${columnas} FROM pagos_intentos
      WHERE estado='DESCONOCIDO' OR (estado='PROCESANDO' AND creado_en<=clock_timestamp()-($1*interval '1 millisecond'))
      ORDER BY creado_en LIMIT $2`, [procesandoMs,limite]);
    return r.rows.map(aPago);
  }

  async eventoPasarelaRegistrado(proveedor: string, eventoId: string) {
    return Boolean((await this.pool.query('SELECT 1 FROM pagos_eventos_pasarela WHERE proveedor=$1 AND evento_id=$2', [proveedor,eventoId])).rowCount);
  }

  async registrarEventoPasarela(proveedor: string, eventoId: string) {
    await this.pool.query('INSERT INTO pagos_eventos_pasarela(proveedor,evento_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [proveedor,eventoId]);
  }

  // --- Lo que Reservas necesita de Pagos, a través de su puerto PagosDeReserva.

  async ultimos(reservaIds: string[]) {
    const r = await this.pool.query(`SELECT DISTINCT ON (reserva_id) reserva_id,estado,codigo,reembolso_pendiente FROM pagos_intentos
      WHERE reserva_id=ANY($1::uuid[]) ORDER BY reserva_id,creado_en DESC,id DESC`, [reservaIds]);
    return new Map(r.rows.map(p => [p.reserva_id as string, { estado: p.estado as string, codigo: p.codigo as string | null, reembolsoPendiente: p.reembolso_pendiente as boolean }]));
  }

  async marcarReembolso(tx: Transaccion, reservaId: string) {
    await tx.query("UPDATE pagos_intentos SET reembolso_pendiente=true,reembolso_motivo='RESERVA_CANCELADA' WHERE reserva_id=$1 AND estado='APROBADO' AND NOT reembolso_pendiente", [reservaId]);
  }
}
