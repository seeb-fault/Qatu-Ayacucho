import type { Pool } from 'pg';
import type { EventoReserva, RepositorioDespacho } from '../dominio/puertos';

export class PostgresDespacho implements RepositorioDespacho {
  constructor(private readonly pool: Pool) {}

  /** Reclama a lo sumo un evento por reserva, siempre el más antiguo sin resolver, para conservar el orden. */
  async reclamar(limite: number, reclamoMs: number): Promise<EventoReserva[]> {
    const r = await this.pool.query(`WITH elegidos AS (
        SELECT o.id FROM reservas_outbox o
        WHERE o.estado='PENDIENTE' AND o.proximo_intento<=clock_timestamp()
          AND NOT EXISTS(SELECT 1 FROM reservas_outbox previo WHERE previo.agregado_id=o.agregado_id
            AND previo.estado='PENDIENTE' AND previo.secuencia<o.secuencia)
        ORDER BY o.proximo_intento,o.secuencia LIMIT $1 FOR UPDATE OF o SKIP LOCKED
      ), reclamados AS (
        UPDATE reservas_outbox o SET intentos=o.intentos+1,proximo_intento=clock_timestamp()+($2*interval '1 millisecond')
        FROM elegidos WHERE o.id=elegidos.id
        RETURNING o.id,o.agregado_id,o.tipo,o.payload,o.creado_en,o.intentos,o.secuencia
      )
      SELECT c.id,c.tipo,c.payload,c.creado_en AS "creadoEn",c.intentos AS intento,r.id AS "reservaId",
        r.cliente_id AS "clienteId",r.propietario_id AS "propietarioId"
      FROM reclamados c JOIN reservas r ON r.id=c.agregado_id ORDER BY c.secuencia`, [limite,reclamoMs]);
    return r.rows.map(e => ({ ...e, creadoEn: new Date(e.creadoEn).toISOString() }));
  }

  // Filtrar por intento impide que un proceso atrasado resuelva un evento que otro ya reclamó.
  async confirmar(id: string, intento: number) {
    await this.pool.query(`UPDATE reservas_outbox SET estado='ENVIADO',enviado_en=clock_timestamp(),ultimo_error=NULL
      WHERE id=$1 AND intentos=$2 AND estado='PENDIENTE'`, [id,intento]);
  }

  async fallar(id: string, intento: number, codigo: string, esperaMs: number | null) {
    await this.pool.query(`UPDATE reservas_outbox SET ultimo_error=$3,
        estado=CASE WHEN $4::double precision IS NULL THEN 'FALLIDO' ELSE 'PENDIENTE' END,
        proximo_intento=CASE WHEN $4::double precision IS NULL THEN proximo_intento ELSE clock_timestamp()+($4::double precision*interval '1 millisecond') END
      WHERE id=$1 AND intentos=$2 AND estado='PENDIENTE'`, [id,intento,codigo,esperaMs]);
  }
}
