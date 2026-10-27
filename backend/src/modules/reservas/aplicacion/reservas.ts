import { entradaSolicitud, entradaRechazo, filtros, uuid, texto, ErrorReserva, type Solicitud } from '../dominio/solicitud';
import type { CatalogoReservas, IdentidadReservas, ProveedoresReservas, RepositorioReservas } from '../dominio/puertos';

export class Reservas {
  constructor(private readonly repo: RepositorioReservas, private readonly identidad: IdentidadReservas,
    private readonly catalogo: CatalogoReservas, private readonly proveedores: ProveedoresReservas,
    private readonly ahora = () => Date.now()) {}

  private presentar(s: Solicitud, actorId: string) {
    const { clienteId, propietarioId, ...datos } = s;
    return { ...datos, participacion: clienteId === actorId ? 'cliente' as const : 'proveedor' as const };
  }
  async solicitar(token: string, value: unknown) {
    const actor = await this.identidad.resolver(token);
    const datos = entradaSolicitud(value, this.ahora());
    const oferta = await this.catalogo.consultar(datos.publicacionId);
    const titular = await this.proveedores.titular(oferta.proveedorId);
    if (titular.usuarioId === actor.id) throw new ErrorReserva('RESERVA_PROPIA', 403, 'No puedes solicitar tu propia oferta.');
    const recurso = oferta.recursos.find(r => r.id === datos.recursoId && r.activo);
    if (!recurso) throw new ErrorReserva('RECURSO_NO_DISPONIBLE', 404, 'Esta unidad no está disponible en la oferta.');
    if (oferta.tipo === 'servicio') texto(datos.descripcionTrabajo, 20, 1500);
    const creada = await this.repo.crear({ ...datos, clienteId: actor.id, propietarioId: titular.usuarioId, proveedorId: oferta.proveedorId,
      snapshot: { titulo: oferta.titulo, tipo: oferta.tipo, proveedor: oferta.proveedor.nombrePublico,
        recurso: recurso.identificador, tarifaReferenciaCentimos: oferta.tarifaCentimos, unidad: oferta.unidad } });
    return this.presentar(creada, actor.id);
  }
  async listar(token: string, value: unknown) {
    const actor = await this.identidad.resolver(token), f = filtros(value);
    const pagina = await this.repo.listar(actor.id, f.vista, f.page);
    return { ...pagina, items: pagina.items.map(s => this.presentar(s, actor.id)), ...f };
  }
  async consultar(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    const solicitud = await this.repo.porId(uuid(id), actor.id);
    if (!solicitud) throw new ErrorReserva('RESERVA_NO_DISPONIBLE', 404, 'La solicitud no está disponible.');
    return this.presentar(solicitud, actor.id);
  }
  async rechazar(token: string, id: string, value: unknown) {
    const actor = await this.identidad.resolver(token), datos = entradaRechazo(value);
    const solicitud = await this.repo.porId(uuid(id), actor.id);
    if (!solicitud) throw new ErrorReserva('RESERVA_NO_DISPONIBLE', 404, 'La solicitud no está disponible.');
    if (solicitud.propietarioId !== actor.id) throw new ErrorReserva('SIN_PERMISO', 403, 'Solo el proveedor puede rechazar la solicitud.');
    return this.presentar(await this.repo.rechazar(id, actor.id, datos.versionActual, datos.motivo), actor.id);
  }
}
