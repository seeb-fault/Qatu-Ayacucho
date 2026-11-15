import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';
import { ErrorReserva, texto, uuid } from '../dominio/solicitud';
import { claveEnvio, entradaEnvio, entradaItem, huellaEnvio, revisar, RETENCION_VENCIDOS_DIAS, type ItemLista, type RepositorioLista, type ResultadoEnvio } from '../dominio/lista';
import type { CatalogoReservas, IdentidadReservas, ProveedoresReservas, RepositorioReservas } from '../dominio/puertos';
import type { Reservas } from './reservas';

type Oferta = Awaited<ReturnType<CatalogoReservas['consultar']>>;

/**
 * Mi lista (009). Guardar solo valida y almacena; enviar crea cada solicitud con el caso de uso de 005,
 * así las reglas de fechas, tarifa, unidad y titularidad son las mismas que en una solicitud individual.
 */
export class Lista {
  constructor(private readonly repo: RepositorioLista, private readonly identidad: IdentidadReservas,
    private readonly catalogo: CatalogoReservas, private readonly proveedores: ProveedoresReservas,
    private readonly agenda: Pick<RepositorioReservas, 'disponibilidad' | 'vencer'>,
    private readonly reservas: Pick<Reservas, 'solicitar'>, private readonly ahora = () => Date.now()) {}

  private async oferta(id: string): Promise<Oferta | null> {
    try { return await this.catalogo.consultar(id); }
    catch (error) { if (error instanceof ErrorAplicacion && error.status === 404) return null; throw error; }
  }

  async agregar(token: string, value: unknown) {
    const actor = await this.identidad.resolver(token), d = entradaItem(value, this.ahora());
    const oferta = await this.oferta(d.publicacionId);
    if (!oferta) throw new ErrorReserva('OFERTA_NO_DISPONIBLE', 404, 'Esta publicación no está disponible.');
    if ((await this.proveedores.titular(oferta.proveedorId)).usuarioId === actor.id) throw new ErrorReserva('RESERVA_PROPIA', 403, 'No puedes guardar tu propia oferta.');
    if (!oferta.recursos.some(r => r.id === d.recursoId && r.activo)) throw new ErrorReserva('RECURSO_NO_DISPONIBLE', 404, 'Esta unidad no está disponible en la oferta.');
    const descripcion = oferta.tipo === 'servicio' ? texto(d.descripcion, 20, 1500) : d.descripcion;
    const item = await this.repo.agregar({ clienteId: actor.id, publicacionId: d.publicacionId, recursoId: d.recursoId, tipo: oferta.tipo,
      inicio: d.inicio, fin: d.fin, descripcion, tarifaVistaCentimos: oferta.tipo === 'herramienta' ? oferta.tarifaCentimos : null });
    return { ...item, total: await this.repo.contar(actor.id) };
  }

  /** Cada ítem se revisa contra el catálogo y la agenda de hoy; la revisión no cambia la lista. */
  async listar(token: string) {
    const actor = await this.identidad.resolver(token), ahora = this.ahora();
    await this.repo.purgarVencidos(actor.id, new Date(ahora - RETENCION_VENCIDOS_DIAS * 86_400_000).toISOString());
    await this.agenda.vencer();
    const items = await this.repo.listar(actor.id);
    const ofertas = new Map<string, Oferta | null>();
    for (const id of new Set(items.map(i => i.publicacionId))) ofertas.set(id, await this.oferta(id));
    const vistos = await Promise.all(items.map(async i => {
      const oferta = ofertas.get(i.publicacionId) ?? null;
      const recurso = oferta?.recursos.find(r => r.id === i.recursoId);
      const ocupado = Boolean(oferta && recurso?.activo && i.tipo === 'herramienta' && Date.parse(i.inicio) > ahora
        && (await this.agenda.disponibilidad(i.recursoId, i.inicio, i.fin)).franjas.length > 0);
      const { clienteId: _c, ...datos } = i;
      return { ...datos, titulo: oferta?.titulo ?? 'Publicación no disponible', proveedor: oferta?.proveedor.nombrePublico ?? '', proveedorId: oferta?.proveedorId ?? null,
        recurso: recurso?.identificador ?? '', unidad: oferta?.unidad ?? null, tarifaActualCentimos: oferta?.tarifaCentimos ?? null,
        estado: revisar(i, ahora, oferta ? { tarifaCentimos: oferta.tarifaCentimos, recursoActivo: Boolean(recurso?.activo) } : null, ocupado) };
    }));
    return { items: vistos, total: vistos.length };
  }

  async resumen(token: string) {
    const actor = await this.identidad.resolver(token);
    return { total: await this.repo.contar(actor.id) };
  }

  async quitar(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    if (!await this.repo.quitar(uuid(id), actor.id)) throw new ErrorReserva('ITEM_NO_DISPONIBLE', 404, 'Ese ítem ya no está en tu lista.');
  }

  async aceptarTarifa(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    const item = (await this.repo.listar(actor.id)).find(i => i.id === uuid(id));
    if (!item) throw new ErrorReserva('ITEM_NO_DISPONIBLE', 404, 'Ese ítem ya no está en tu lista.');
    const oferta = await this.oferta(item.publicacionId);
    if (!oferta || oferta.tarifaCentimos === null) throw new ErrorReserva('OFERTA_NO_DISPONIBLE', 404, 'Esta publicación no está disponible.');
    return this.repo.aceptarTarifa(item.id, actor.id, oferta.tarifaCentimos);
  }

  /**
   * Una solicitud por ítem. El ítem sale de la lista antes de crear su solicitud, así dos envíos a la vez
   * no la duplican; si la solicitud se rechaza, el ítem vuelve a la lista con el motivo.
   */
  async enviar(token: string, clave: unknown, value: unknown) {
    const actor = await this.identidad.resolver(token), k = claveEnvio(clave), d = entradaEnvio(value);
    const previo = await this.repo.iniciarEnvio(actor.id, k, huellaEnvio(d.ids, d.aceptaCondiciones));
    if (previo) {
      if (!previo.resultados) throw new ErrorReserva('ENVIO_EN_CURSO', 409, 'Tu lista se está enviando. Espera un momento y revisa tus solicitudes.');
      return { resultados: previo.resultados };
    }
    const elegidos = (await this.repo.listar(actor.id)).filter(i => !d.ids || d.ids.includes(i.id));
    const resultados: ResultadoEnvio[] = [];
    for (const elegido of elegidos) {
      const item = await this.repo.reclamar(elegido.id, actor.id);
      if (!item) continue;
      try {
        const creada = await this.reservas.solicitar(token, this.cuerpo(item, d.aceptaCondiciones));
        resultados.push({ itemId: item.id, estado: 'enviado', solicitudId: creada.id });
      } catch (error) {
        await this.repo.restaurar(item);
        if (!(error instanceof ErrorAplicacion)) throw error;
        resultados.push({ itemId: item.id, estado: 'rechazado', motivo: error.message });
      }
    }
    await this.repo.terminarEnvio(actor.id, k, resultados);
    return { resultados };
  }

  private cuerpo(i: ItemLista, aceptaCondiciones: boolean) {
    return i.tipo === 'herramienta'
      ? { publicacionId: i.publicacionId, recursoId: i.recursoId, inicio: i.inicio, fin: i.fin, descripcionTrabajo: i.descripcion, tipoSolicitud: 'alquiler',
          aceptaCondiciones, ...(i.tarifaVistaCentimos !== null ? { tarifaEsperadaCentimos: i.tarifaVistaCentimos } : {}) }
      : { publicacionId: i.publicacionId, recursoId: i.recursoId, inicio: i.inicio, fin: i.fin, descripcionTrabajo: i.descripcion, tipoSolicitud: 'alquiler' };
  }
}
