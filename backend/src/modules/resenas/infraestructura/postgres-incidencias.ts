import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ErrorResena } from '../dominio/resenas';
import type { Garantia, Incidencia, ResultadoIncidencia, TipoIncidencia } from '../dominio/incidencias';

const columnas = `id, reserva_id AS "reservaId", autor_id AS "autorId", cliente_id AS "clienteId", propietario_id AS "propietarioId", tipo, descripcion,
  estado, resultado, motivo, revisor_id AS "revisorId", creada_en AS "creadaEn", resuelta_en AS "resueltaEn"`;
const fecha = (v: unknown) => v ? new Date(v as string).toISOString() : null;
const aIncidencia = (f: any): Incidencia => ({ ...f, creadaEn: fecha(f.creadaEn)!, resueltaEn: fecha(f.resueltaEn) });
const columnasGarantia = `reserva_id AS "reservaId", condiciones, registrada_por AS "registradaPor", registrada_en AS "registradaEn", conformidad_cliente_en AS "conformidadClienteEn", version`;
const aGarantia = (f: any): Garantia => ({ ...f, registradaEn: fecha(f.registradaEn)!, conformidadClienteEn: fecha(f.conformidadClienteEn) });

export class PostgresIncidencias {
  constructor(private readonly pool: Pool) {}

  async abrir(d: { reservaId: string; autorId: string; clienteId: string; propietarioId: string; tipo: TipoIncidencia; descripcion: string }) {
    try {
      const r = await this.pool.query(`INSERT INTO incidencias(id,reserva_id,autor_id,cliente_id,propietario_id,tipo,descripcion) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ${columnas}`,
        [randomUUID(), d.reservaId, d.autorId, d.clienteId, d.propietarioId, d.tipo, d.descripcion]);
      return aIncidencia(r.rows[0]);
    } catch (error) {
      if ((error as { constraint?: string }).constraint === 'incidencias_una_abierta') throw new ErrorResena('INCIDENCIA_ABIERTA', 409, 'Ya hay una incidencia abierta para esta reserva; espera su resolución.');
      throw error;
    }
  }

  async deReserva(reservaId: string) {
    return (await this.pool.query(`SELECT ${columnas} FROM incidencias WHERE reserva_id=$1 ORDER BY creada_en DESC, id DESC`, [reservaId])).rows.map(aIncidencia);
  }

  async porId(id: string) {
    const r = await this.pool.query(`SELECT ${columnas} FROM incidencias WHERE id=$1`, [id]);
    return r.rows[0] ? aIncidencia(r.rows[0]) : null;
  }

  async paraAdministrar(estado: 'abierta' | 'resuelta' | null, page: number) {
    const filtro = estado ? 'WHERE estado=$2' : '', params: unknown[] = [(page - 1) * 20, ...(estado ? [estado] : [])];
    const [lista, total] = await Promise.all([
      this.pool.query(`SELECT ${columnas} FROM incidencias ${filtro} ORDER BY creada_en DESC, id DESC LIMIT 20 OFFSET $1`, params),
      this.pool.query(`SELECT count(*)::integer AS n FROM incidencias ${estado ? 'WHERE estado=$1' : ''}`, estado ? [estado] : []),
    ]);
    return { items: lista.rows.map(aIncidencia), total: total.rows[0].n as number };
  }

  /** Solo se resuelve una incidencia abierta; dos revisores a la vez dejan una sola resolución. */
  async resolver(id: string, revisorId: string, resultado: ResultadoIncidencia, motivo: string) {
    const r = await this.pool.query(`UPDATE incidencias SET estado='resuelta', resultado=$3, motivo=$4, revisor_id=$2, resuelta_en=now()
      WHERE id=$1 AND estado='abierta' RETURNING ${columnas}`, [id, revisorId, resultado, motivo]);
    if (!r.rowCount) throw new ErrorResena('INCIDENCIA_RESUELTA', 409, 'La incidencia ya fue resuelta.');
    return aIncidencia(r.rows[0]);
  }

  /** Reservas con una incidencia abierta: sus evidencias no se borran. */
  async conIncidenciaAbierta(reservaIds: string[]) {
    if (!reservaIds.length) return new Set<string>();
    const r = await this.pool.query("SELECT DISTINCT reserva_id FROM incidencias WHERE estado='abierta' AND reserva_id=ANY($1::uuid[])", [reservaIds]);
    return new Set(r.rows.map(f => f.reserva_id as string));
  }

  async garantia(reservaId: string) {
    const r = await this.pool.query(`SELECT ${columnasGarantia} FROM garantias_documentadas WHERE reserva_id=$1`, [reservaId]);
    return r.rows[0] ? aGarantia(r.rows[0]) : null;
  }

  /** Crea o corrige el acuerdo mientras el cliente no haya dado conformidad. */
  async documentar(reservaId: string, autorId: string, condiciones: string) {
    const r = await this.pool.query(`INSERT INTO garantias_documentadas(reserva_id, condiciones, registrada_por) VALUES($1,$2,$3)
      ON CONFLICT (reserva_id) DO UPDATE SET condiciones=EXCLUDED.condiciones, registrada_en=now(), version=garantias_documentadas.version+1
        WHERE garantias_documentadas.conformidad_cliente_en IS NULL
      RETURNING ${columnasGarantia}`, [reservaId, condiciones, autorId]);
    if (!r.rowCount) throw new ErrorResena('GARANTIA_CONFIRMADA', 409, 'El cliente ya dio su conformidad; el acuerdo no se puede cambiar.');
    return aGarantia(r.rows[0]);
  }

  async confirmar(reservaId: string, version: number) {
    const r = await this.pool.query(`UPDATE garantias_documentadas SET conformidad_cliente_en=now() WHERE reserva_id=$1 AND version=$2 AND conformidad_cliente_en IS NULL
      RETURNING ${columnasGarantia}`, [reservaId, version]);
    if (!r.rowCount) throw new ErrorResena('GARANTIA_MODIFICADA', 409, 'El proveedor cambió el acuerdo o ya lo confirmaste. Revisa el texto actual.');
    return aGarantia(r.rows[0]);
  }
}
