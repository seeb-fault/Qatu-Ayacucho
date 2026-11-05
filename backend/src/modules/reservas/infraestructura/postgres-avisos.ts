import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { destinatarios, type AvisoGuardado, type RepositorioAvisos } from '../dominio/avisos';
import { NotificacionRechazada, type EventoReserva, type Notificador } from '../dominio/puertos';

/** Canal dentro de la app: entregar un evento es dejar el aviso en la bandeja de cada destinatario. */
export class AvisosNotificador implements Notificador {
  constructor(private readonly pool: Pool) {}
  async enviar(evento: EventoReserva) {
    const usuarios = destinatarios(evento);
    if (!usuarios) throw new NotificacionRechazada('TIPO_SIN_AVISO');
    // Una sola sentencia: un fallo no deja a un participante con aviso y al otro sin él.
    await this.pool.query(`INSERT INTO reservas_avisos(id,evento_id,usuario_id,reserva_id,tipo)
      SELECT a.id,$1,a.usuario_id,$2,$3 FROM unnest($4::uuid[],$5::uuid[]) AS a(id,usuario_id)
      ON CONFLICT ON CONSTRAINT reservas_avisos_unico DO NOTHING`,
    [evento.id,evento.reservaId,evento.tipo,usuarios.map(() => randomUUID()),usuarios]);
  }
}

export class PostgresAvisos implements RepositorioAvisos {
  constructor(private readonly pool: Pool) {}
  async listar(usuarioId: string, page: number) {
    const r = await this.pool.query(`SELECT a.id,a.reserva_id AS "reservaId",a.tipo,r.snapshot->>'titulo' AS titulo,
        CASE WHEN r.cliente_id=a.usuario_id THEN 'cliente' ELSE 'proveedor' END AS vista,a.creado_en AS "creadoEn",a.leido_en AS "leidoEn"
      FROM reservas_avisos a JOIN reservas r ON r.id=a.reserva_id
      WHERE a.usuario_id=$1 ORDER BY a.creado_en DESC,a.id DESC LIMIT 20 OFFSET $2`, [usuarioId,(page-1)*20]);
    const c = await this.pool.query(`SELECT count(*)::integer AS total,count(*) FILTER (WHERE leido_en IS NULL)::integer AS "noLeidos"
      FROM reservas_avisos WHERE usuario_id=$1`, [usuarioId]);
    const items: AvisoGuardado[] = r.rows.map(a => ({ ...a, creadoEn: new Date(a.creadoEn).toISOString(), leidoEn: a.leidoEn ? new Date(a.leidoEn).toISOString() : null }));
    return { items, total: c.rows[0].total as number, noLeidos: c.rows[0].noLeidos as number };
  }
  async noLeidos(usuarioId: string) {
    const r = await this.pool.query('SELECT count(*)::integer AS n FROM reservas_avisos WHERE usuario_id=$1 AND leido_en IS NULL', [usuarioId]);
    return r.rows[0].n as number;
  }
  async marcar(id: string, usuarioId: string) {
    const r = await this.pool.query('UPDATE reservas_avisos SET leido_en=COALESCE(leido_en,clock_timestamp()) WHERE id=$1 AND usuario_id=$2', [id,usuarioId]);
    return (r.rowCount ?? 0) > 0;
  }
  async marcarTodos(usuarioId: string) {
    const r = await this.pool.query('UPDATE reservas_avisos SET leido_en=clock_timestamp() WHERE usuario_id=$1 AND leido_en IS NULL', [usuarioId]);
    return r.rowCount ?? 0;
  }
}
