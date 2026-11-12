import { ErrorResena, entradaModeracion, entradaResena, exigirElegible, pagina, plazoParaResenar, uuid,
  type IdentidadResenas, type RepositorioResenas, type Resena, type ReservasDeResena } from '../dominio/resenas';

/** Vista pública: sin identificadores de cliente ni de reserva. */
const publica = (r: Resena) => ({ id: r.id, titulo: r.titulo, puntuacion: r.puntuacion, texto: r.texto, creadaEn: r.creadaEn });
const MAXIMO_RESUMEN = 50;

export class Resenas {
  constructor(private readonly repo: RepositorioResenas, private readonly reservas: ReservasDeResena,
    private readonly identidad: IdentidadResenas, private readonly ahora = () => Date.now()) {}

  private async reserva(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    const reserva = await this.reservas.paraResena(uuid(id), actor.id);
    if (!reserva) throw new ErrorResena('RESERVA_NO_DISPONIBLE', 404, 'La reserva no está disponible.');
    return { actor, reserva };
  }

  /** Estado de la reseña para un participante: si existe, si puede escribirla y hasta cuándo. */
  async deReserva(token: string, id: string) {
    const { actor, reserva } = await this.reserva(token, id);
    const resena = await this.repo.deReserva(reserva.id), plazo = plazoParaResenar(reserva);
    const puedeResenar = !resena && reserva.clienteId === actor.id && plazo !== null && Date.parse(plazo) > this.ahora();
    return { resena: resena ? { ...publica(resena), oculta: resena.oculta } : null, puedeResenar, plazo };
  }

  async crear(token: string, id: string, value: unknown) {
    const datos = entradaResena(value);
    const { actor, reserva } = await this.reserva(token, id);
    exigirElegible(reserva, actor.id, this.ahora());
    const resena = await this.repo.crear({ reservaId: reserva.id, clienteId: reserva.clienteId, propietarioId: reserva.propietarioId,
      proveedorId: reserva.proveedorId, publicacionId: reserva.publicacionId, titulo: reserva.titulo, ...datos });
    return { ...publica(resena), oculta: resena.oculta };
  }

  async deProveedor(proveedorId: string, query: unknown) {
    const page = pagina((query as { page?: unknown } | null)?.page);
    const { items, total, promedio } = await this.repo.publicas(uuid(proveedorId), page);
    return { items: items.map(publica), total, promedio, page, limit: 20 };
  }

  /** Reputación de varios proveedores a la vez, para las tarjetas del catálogo. */
  async resumen(query: unknown) {
    const lista = (query as { proveedores?: unknown } | null)?.proveedores;
    if (typeof lista !== 'string' || !lista) throw new ErrorResena('ENTRADA_INVALIDA', 400, 'Indica los proveedores.');
    const ids = [...new Set(lista.split(',').map(uuid))];
    if (ids.length > MAXIMO_RESUMEN) throw new ErrorResena('ENTRADA_INVALIDA', 400, `Consulta como máximo ${MAXIMO_RESUMEN} proveedores.`);
    const mapa = await this.repo.resumen(ids);
    return Object.fromEntries(ids.map(i => [i, mapa.get(i) ?? { promedio: null, total: 0 }]));
  }

  private async administrador(token: string) {
    const actor = await this.identidad.resolver(token);
    if (!actor.roles.includes('admin')) throw new ErrorResena('SIN_PERMISO', 403, 'Esta acción requiere una cuenta administrativa.');
    return actor;
  }

  async paraAdministrar(token: string, query: unknown) {
    await this.administrador(token);
    const page = pagina((query as { page?: unknown } | null)?.page);
    return { ...(await this.repo.paraAdministrar(page)), page, limit: 20 };
  }

  async moderar(token: string, id: string, value: unknown) {
    const actor = await this.administrador(token), datos = entradaModeracion(value);
    const actual = await this.repo.porId(uuid(id));
    if (!actual) throw new ErrorResena('RESENA_NO_DISPONIBLE', 404, 'La reseña no existe.');
    // Como en la verificación de proveedores: nadie decide sobre una operación en la que participó.
    if ([actual.clienteId, actual.propietarioId].includes(actor.id)) throw new ErrorResena('SIN_PERMISO', 403, 'No puedes moderar una reseña de una operación en la que participaste.');
    const moderada = await this.repo.moderar(actual.id, actor.id, datos.oculta, datos.motivo);
    return { ...publica(moderada!), oculta: moderada!.oculta };
  }
}
