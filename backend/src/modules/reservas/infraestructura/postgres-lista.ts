import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ErrorReserva } from '../dominio/solicitud';
import { MAXIMO_ITEMS, type ItemLista, type NuevoItem, type RepositorioLista, type ResultadoEnvio } from '../dominio/lista';

const columnas = `id, cliente_id AS "clienteId", publicacion_id AS "publicacionId", recurso_id AS "recursoId", tipo, inicio, fin, descripcion,
  tarifa_vista_centimos AS "tarifaVistaCentimos", creado_en AS "creadoEn"`;
const aItem = (f: any): ItemLista => ({ ...f, inicio: new Date(f.inicio).toISOString(), fin: new Date(f.fin).toISOString(), creadoEn: new Date(f.creadoEn).toISOString(),
  tarifaVistaCentimos: f.tarifaVistaCentimos === null ? null : Number(f.tarifaVistaCentimos) });

export class PostgresLista implements RepositorioLista {
  constructor(private readonly pool: Pool) {}

  /** El límite se comprueba con un candado por cliente: dos altas a la vez no superan el máximo. */
  async agregar(d: NuevoItem) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('lista:' || $1))", [d.clienteId]);
      const n = (await client.query('SELECT count(*)::integer AS n FROM reservas_lista_items WHERE cliente_id=$1', [d.clienteId])).rows[0].n;
      if (n >= MAXIMO_ITEMS) throw new ErrorReserva('LISTA_LLENA', 409, `Tu lista ya tiene ${MAXIMO_ITEMS} ítems. Envía o quita alguno para agregar otro.`);
      const r = await client.query(`INSERT INTO reservas_lista_items(id,cliente_id,publicacion_id,recurso_id,tipo,inicio,fin,descripcion,tarifa_vista_centimos)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING ${columnas}`,
        [randomUUID(), d.clienteId, d.publicacionId, d.recursoId, d.tipo, d.inicio, d.fin, d.descripcion, d.tarifaVistaCentimos]);
      if (!r.rowCount) throw new ErrorReserva('ITEM_DUPLICADO', 409, 'Ya guardaste esta unidad con las mismas fechas.');
      await client.query('COMMIT');
      return aItem(r.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async listar(clienteId: string) {
    return (await this.pool.query(`SELECT ${columnas} FROM reservas_lista_items WHERE cliente_id=$1 ORDER BY creado_en, id`, [clienteId])).rows.map(aItem);
  }

  async contar(clienteId: string) {
    return (await this.pool.query('SELECT count(*)::integer AS n FROM reservas_lista_items WHERE cliente_id=$1', [clienteId])).rows[0].n as number;
  }

  async quitar(id: string, clienteId: string) {
    return Boolean((await this.pool.query('DELETE FROM reservas_lista_items WHERE id=$1 AND cliente_id=$2', [id, clienteId])).rowCount);
  }

  async aceptarTarifa(id: string, clienteId: string, tarifaCentimos: number) {
    const r = await this.pool.query(`UPDATE reservas_lista_items SET tarifa_vista_centimos=$3 WHERE id=$1 AND cliente_id=$2 RETURNING ${columnas}`, [id, clienteId, tarifaCentimos]);
    return r.rows[0] ? aItem(r.rows[0]) : null;
  }

  async reclamar(id: string, clienteId: string) {
    const r = await this.pool.query(`DELETE FROM reservas_lista_items WHERE id=$1 AND cliente_id=$2 RETURNING ${columnas}`, [id, clienteId]);
    return r.rows[0] ? aItem(r.rows[0]) : null;
  }

  async restaurar(i: ItemLista) {
    await this.pool.query(`INSERT INTO reservas_lista_items(id,cliente_id,publicacion_id,recurso_id,tipo,inicio,fin,descripcion,tarifa_vista_centimos,creado_en)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
      [i.id, i.clienteId, i.publicacionId, i.recursoId, i.tipo, i.inicio, i.fin, i.descripcion, i.tarifaVistaCentimos, i.creadoEn]);
  }

  async purgarVencidos(clienteId: string, antesDe: string) {
    await this.pool.query('DELETE FROM reservas_lista_items WHERE cliente_id=$1 AND inicio < $2', [clienteId, antesDe]);
  }

  async iniciarEnvio(clienteId: string, clave: string, huella: string) {
    const nuevo = await this.pool.query('INSERT INTO reservas_lista_envios(cliente_id,clave,huella) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [clienteId, clave, huella]);
    if (nuevo.rowCount) return null;
    const previo = (await this.pool.query('SELECT huella, resultados FROM reservas_lista_envios WHERE cliente_id=$1 AND clave=$2', [clienteId, clave])).rows[0];
    if (previo.huella !== huella) throw new ErrorReserva('CLAVE_REUTILIZADA', 409, 'Esta clave ya se usó para otro envío. Vuelve a intentarlo.');
    return { resultados: previo.resultados as ResultadoEnvio[] | null };
  }

  async terminarEnvio(clienteId: string, clave: string, resultados: ResultadoEnvio[]) {
    await this.pool.query('UPDATE reservas_lista_envios SET resultados=$3 WHERE cliente_id=$1 AND clave=$2', [clienteId, clave, JSON.stringify(resultados)]);
  }
}
