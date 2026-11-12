import { ErrorResena, pagina, uuid, type IdentidadResenas, type ReservasDeResena } from '../dominio/resenas';
import { entradaGarantia, entradaIncidencia, entradaResolucion, exigirPuedeConfirmar, exigirPuedeDocumentar, exigirPuedeReclamar, puedeReclamar,
  type Garantia, type Incidencia } from '../dominio/incidencias';
import type { PostgresIncidencias } from '../infraestructura/postgres-incidencias';
import type { PostgresEvidencias } from '../infraestructura/postgres-evidencias';

/** Vista de una incidencia para participantes: sin ids internos de los participantes. */
const vista = (i: Incidencia, actorId?: string) => ({
  id: i.id, tipo: i.tipo, descripcion: i.descripcion, estado: i.estado, resultado: i.resultado, motivo: i.motivo,
  creadaEn: i.creadaEn, resueltaEn: i.resueltaEn, autor: i.autorId === i.clienteId ? 'cliente' as const : 'proveedor' as const,
  ...(actorId ? { propia: i.autorId === actorId } : {}),
});
const vistaGarantia = (g: Garantia | null) => g && { condiciones: g.condiciones, registradaEn: g.registradaEn, conformidadClienteEn: g.conformidadClienteEn, version: g.version };

export class Incidencias {
  constructor(private readonly repo: PostgresIncidencias, private readonly reservas: ReservasDeResena,
    private readonly identidad: IdentidadResenas, private readonly evidencias?: Pick<PostgresEvidencias, 'deReserva'>,
    private readonly ahora = () => Date.now()) {}

  private async participante(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    const reserva = await this.reservas.paraResena(uuid(id), actor.id);
    if (!reserva) throw new ErrorResena('RESERVA_NO_DISPONIBLE', 404, 'La reserva no está disponible.');
    return { actor, reserva };
  }

  async deReserva(token: string, id: string) {
    const { actor, reserva } = await this.participante(token, id);
    const items = await this.repo.deReserva(reserva.id);
    return { items: items.map(i => vista(i, actor.id)), puedeReclamar: puedeReclamar(reserva, this.ahora()) && !items.some(i => i.estado === 'abierta') };
  }

  async abrir(token: string, id: string, value: unknown) {
    const datos = entradaIncidencia(value);
    const { actor, reserva } = await this.participante(token, id);
    exigirPuedeReclamar(reserva, this.ahora());
    const incidencia = await this.reservas.conEvento(reserva.id, 'INCIDENCIA_ABIERTA', actor.id,
      tx => this.repo.abrir({ reservaId: reserva.id, autorId: actor.id, clienteId: reserva.clienteId, propietarioId: reserva.propietarioId, ...datos }, tx));
    return vista(incidencia, actor.id);
  }

  private async administrador(token: string) {
    const actor = await this.identidad.resolver(token);
    if (!actor.roles.includes('admin')) throw new ErrorResena('SIN_PERMISO', 403, 'Esta acción requiere una cuenta administrativa.');
    return actor;
  }

  async paraAdministrar(token: string, query: unknown) {
    await this.administrador(token);
    const q = (query ?? {}) as { estado?: unknown; page?: unknown };
    if (q.estado !== undefined && !['abierta', 'resuelta'].includes(q.estado as string)) throw new ErrorResena('ENTRADA_INVALIDA', 400, 'Estado de incidencia inválido.');
    const page = pagina(q.page);
    const { items, total } = await this.repo.paraAdministrar((q.estado as 'abierta' | 'resuelta' | undefined) ?? null, page);
    return { items: items.map(i => ({ ...vista(i), reservaId: i.reservaId })), total, page, limit: 20 };
  }

  async resolver(token: string, id: string, value: unknown) {
    const actor = await this.administrador(token), datos = entradaResolucion(value);
    const actual = await this.repo.porId(uuid(id));
    if (!actual) throw new ErrorResena('INCIDENCIA_NO_DISPONIBLE', 404, 'La incidencia no existe.');
    if ([actual.clienteId, actual.propietarioId].includes(actor.id)) throw new ErrorResena('SIN_PERMISO', 403, 'No puedes resolver una incidencia de una operación en la que participaste.');
    const resuelta = await this.reservas.conEvento(actual.reservaId, 'INCIDENCIA_RESUELTA', actor.id,
      tx => this.repo.resolver(actual.id, actor.id, datos.resultado, datos.motivo, tx));
    return { ...vista(resuelta), reservaId: actual.reservaId };
  }

  /** Fotos de la reserva para revisar una incidencia; solo metadata, la descarga va por su ruta autorizada. */
  async evidenciasDe(token: string, id: string) {
    await this.administrador(token);
    const incidencia = await this.repo.porId(uuid(id));
    if (!incidencia) throw new ErrorResena('INCIDENCIA_NO_DISPONIBLE', 404, 'La incidencia no existe.');
    const fotos = this.evidencias ? await this.evidencias.deReserva(incidencia.reservaId) : [];
    return { items: fotos.map(f => ({ id: f.id, etapa: f.etapa, autor: f.autorId === incidencia.clienteId ? 'cliente' : 'proveedor', disponible: f.eliminadaEn === null })) };
  }

  async garantia(token: string, id: string) {
    const { reserva } = await this.participante(token, id);
    return { aplica: reserva.tipo === 'herramienta', garantia: vistaGarantia(await this.repo.garantia(reserva.id)) };
  }

  async documentar(token: string, id: string, value: unknown) {
    const datos = entradaGarantia(value);
    const { actor, reserva } = await this.participante(token, id);
    exigirPuedeDocumentar(reserva, actor.id, await this.repo.garantia(reserva.id));
    return vistaGarantia(await this.repo.documentar(reserva.id, actor.id, datos.condiciones));
  }

  async confirmar(token: string, id: string, value: unknown) {
    const version = (value as { version?: unknown } | null)?.version;
    if (!value || typeof value !== 'object' || Object.keys(value).some(k => k !== 'version') || typeof version !== 'number' || !Number.isInteger(version) || version < 1)
      throw new ErrorResena('ENTRADA_INVALIDA', 400, 'Recarga el acuerdo antes de confirmarlo.');
    const { actor, reserva } = await this.participante(token, id);
    exigirPuedeConfirmar(reserva, actor.id, await this.repo.garantia(reserva.id));
    return vistaGarantia(await this.repo.confirmar(reserva.id, version));
  }
}
