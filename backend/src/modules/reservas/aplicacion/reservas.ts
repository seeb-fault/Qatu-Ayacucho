import { entradaSolicitud, entradaRechazo, filtros, uuid, texto, objeto, instante, invalida, ErrorReserva, type Solicitud } from '../dominio/solicitud';
import { condiciones, entradaAccion, type AccionReserva } from '../dominio/alquiler';
import { entradaCotizacion, entradaRespuestaCotizacion } from '../dominio/cotizacion';
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
    let terminos = null;
    if (datos.tipoSolicitud === 'alquiler' && oferta.tipo === 'herramienta') {
      if (!datos.aceptaCondiciones) invalida('Acepta las condiciones de alquiler antes de solicitar.');
      if (datos.tarifaEsperadaCentimos !== oferta.tarifaCentimos) throw new ErrorReserva('TARIFA_MODIFICADA',409,'La tarifa cambió. Recarga la oferta y revisa el importe antes de aceptar.');
      terminos = condiciones(datos.inicio,datos.fin,oferta.tarifaCentimos!);
    }
    const creada = await this.repo.crear({ ...datos, condiciones: terminos, clienteId: actor.id, propietarioId: titular.usuarioId, proveedorId: oferta.proveedorId,
      snapshot: { titulo: oferta.titulo, tipo: oferta.tipo, proveedor: oferta.proveedor.nombrePublico,
        recurso: recurso.identificador, tarifaReferenciaCentimos: oferta.tarifaCentimos, unidad: oferta.unidad } });
    return this.presentar(creada, actor.id);
  }
  async listar(token: string, value: unknown) {
    const actor = await this.identidad.resolver(token), f = filtros(value);
    await this.repo.vencer();
    const pagina = await this.repo.listar(actor.id, f.vista, f.page);
    return { ...pagina, items: pagina.items.map(s => this.presentar(s, actor.id)), ...f };
  }
  async consultar(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    await this.repo.vencer();
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

  async cotizar(token: string, id: string, value: unknown) {
    const actor = await this.identidad.resolver(token), d = entradaCotizacion(value,this.ahora());
    return this.presentar(await this.repo.cotizar(uuid(id),actor.id,d.versionActual,d.propuesta),actor.id);
  }

  async responderCotizacion(token: string, id: string, value: unknown, decision: 'ACEPTADA' | 'RECHAZADA') {
    const actor = await this.identidad.resolver(token), d = entradaRespuestaCotizacion(value,decision);
    if (decision === 'ACEPTADA') await this.validarAgendaPublica(uuid(id),actor.id);
    return this.presentar(await this.repo.responderCotizacion(uuid(id),actor.id,d.versionActual,d.versionCotizacion,decision,d.motivo),actor.id);
  }

  private async validarAgendaPublica(id: string, actorId: string) {
    const s = await this.repo.porId(id,actorId);
    if (!s) throw new ErrorReserva('RESERVA_NO_DISPONIBLE',404,'La solicitud no está disponible.');
    if (s.clienteId !== actorId) throw new ErrorReserva('SIN_PERMISO',403,'Solo el cliente puede confirmar el horario.');
    const oferta = await this.catalogo.consultar(s.publicacionId);
    if (oferta.tipo !== 'servicio' || !oferta.recursos.some(r=>r.id===s.recursoId && r.activo)) {
      throw new ErrorReserva('RECURSO_NO_DISPONIBLE',409,'La agenda ya no está disponible. Coordina una nueva solicitud con el proveedor.');
    }
  }

  async confirmarAgenda(token: string, id: string, value: unknown) {
    const actor = await this.identidad.resolver(token), d = entradaRespuestaCotizacion(value,'ACEPTADA');
    await this.validarAgendaPublica(uuid(id),actor.id);
    return this.presentar(await this.repo.confirmarAgenda(id,actor.id,d.versionActual,d.versionCotizacion),actor.id);
  }

  vencer() { return this.repo.vencer(); }

  async operar(token: string, id: string, accion: AccionReserva, value: unknown) {
    const actor = await this.identidad.resolver(token), datos = entradaAccion(value,accion);
    await this.repo.vencer();
    const s = await this.repo.porId(uuid(id),actor.id);
    if (!s) throw new ErrorReserva('RESERVA_NO_DISPONIBLE',404,'La solicitud no está disponible.');
    if (accion === 'aceptacion') {
      if (s.propietarioId !== actor.id) throw new ErrorReserva('SIN_PERMISO',403,'Solo el proveedor puede aceptar.');
      const oferta = await this.catalogo.consultar(s.publicacionId);
      if (!oferta.recursos.some(r => r.id === s.recursoId && r.activo)) throw new ErrorReserva('RECURSO_NO_DISPONIBLE',409,'La unidad ya no está disponible.');
      if (!s.condiciones || oferta.tarifaCentimos !== s.condiciones.tarifaCentimos) throw new ErrorReserva('TARIFA_MODIFICADA',409,'Se necesita una nueva solicitud con la tarifa vigente y las condiciones aceptadas.');
    }
    return this.presentar(await this.repo.ejecutar(s.id,actor.id,datos.versionActual,accion,datos.motivo),actor.id);
  }

  async disponibilidad(id: string, value: unknown) {
    const d = objeto(value,['publicacionId','inicio','fin']), recursoId = uuid(id);
    const inicio = instante(d.inicio), fin = instante(d.fin);
    if (inicio >= fin) invalida('El inicio debe ser anterior al fin.');
    const oferta = await this.catalogo.consultar(uuid(d.publicacionId));
    if (!oferta.recursos.some(r => r.id === recursoId && r.activo)) throw new ErrorReserva('RECURSO_NO_DISPONIBLE',404,'La unidad no está disponible.');
    await this.repo.vencer();
    return this.repo.disponibilidad(recursoId,inicio,fin);
  }
}
