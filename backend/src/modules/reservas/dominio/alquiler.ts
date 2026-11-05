import { ErrorReserva, invalida, objeto, texto, type Solicitud } from './solicitud';

const DIA = 86400000;
export const MINUTOS_APARTADO = 60;
export interface CondicionesAlquiler {
  politica: 'diaria-24h-v1'; tarifaCentimos: number; dias: number; importeCentimos: number;
  toleranciaMinutos: 30; comisionCentimos: 0; medioPago: 'efectivo';
}
export type EstadoReserva = 'PENDIENTE' | 'RECHAZADA' | 'VISITA_ACORDADA' | 'ACEPTADA' | 'VENCIDA' | 'CANCELADA'
  | 'ENTREGA_POR_CONFIRMAR' | 'EN_CURSO' | 'DEVOLUCION_PENDIENTE' | 'DEVUELTA' | 'SERVICIO_CONFIRMADO'
  | 'SERVICIO_EN_CURSO' | 'SERVICIO_POR_CONFIRMAR' | 'SERVICIO_CERRADO';
export type AccionReserva = 'aceptacion' | 'visita' | 'ampliacion' | 'cancelacion' | 'efectivo' | 'recepcion'
  | 'devolucion/aviso' | 'devolucion/confirmacion' | 'devolucion/rechazo'
  | 'servicio/inicio' | 'servicio/termino' | 'servicio/confirmacion' | 'servicio/rechazo';
export const eventos: Record<AccionReserva, string> = {
  aceptacion: 'SOLICITUD_ACEPTADA', visita: 'VISITA_ACORDADA', ampliacion: 'APARTADO_AMPLIADO', cancelacion: 'RESERVA_CANCELADA',
  efectivo: 'EFECTIVO_REGISTRADO', recepcion: 'RECEPCION_CONFIRMADA', 'devolucion/aviso': 'DEVOLUCION_INFORMADA',
  'devolucion/confirmacion': 'DEVOLUCION_CONFIRMADA', 'devolucion/rechazo': 'DEVOLUCION_RECHAZADA',
  'servicio/inicio': 'SERVICIO_INICIADO', 'servicio/termino': 'SERVICIO_TERMINADO',
  'servicio/confirmacion': 'SERVICIO_CERRADO', 'servicio/rechazo': 'TERMINO_RECHAZADO',
};
export function condiciones(inicio: string, fin: string, tarifaCentimos: number): CondicionesAlquiler {
  const duracion = Date.parse(fin) - Date.parse(inicio), dias = Math.ceil(duracion / DIA);
  const importeCentimos = dias * tarifaCentimos;
  if (!Number.isFinite(duracion) || duracion <= 0 || !Number.isSafeInteger(tarifaCentimos) || tarifaCentimos <= 0 || !Number.isSafeInteger(importeCentimos)) invalida('No se puede calcular el alquiler con esas fechas y tarifa.');
  return { politica: 'diaria-24h-v1', tarifaCentimos, dias, importeCentimos, toleranciaMinutos: 30, comisionCentimos: 0, medioPago: 'efectivo' };
}
export function liquidar(c: CondicionesAlquiler, fin: string, devueltoEn: string) {
  const retraso = Date.parse(devueltoEn) - Date.parse(fin) - c.toleranciaMinutos * 60000;
  const diasExtra = Math.max(0, Math.ceil(retraso / DIA));
  const importeFinalCentimos = c.importeCentimos + diasExtra * c.tarifaCentimos;
  if (!Number.isFinite(retraso) || !Number.isSafeInteger(importeFinalCentimos)) invalida('No se pudo calcular la devolución.');
  return { diasExtra, importeFinalCentimos, saldoCentimos: importeFinalCentimos - c.importeCentimos };
}
export function entradaAccion(value: unknown, accion: AccionReserva) {
  const requiereMotivo = ['visita', 'ampliacion', 'cancelacion', 'devolucion/rechazo', 'servicio/rechazo'].includes(accion);
  const d = objeto(value, requiereMotivo ? ['versionActual', 'motivo'] : ['versionActual']);
  if (typeof d.versionActual !== 'number' || !Number.isSafeInteger(d.versionActual) || d.versionActual < 1 || d.versionActual > 2147483646) invalida('Recarga la solicitud antes de continuar.');
  return { versionActual: d.versionActual, motivo: requiereMotivo ? texto(d.motivo, 10, 500) : null };
}
export function transicion(actual: Solicitud, actorId: string, accion: AccionReserva, motivo: string | null, ahora: number): Solicitud {
  const proveedor = actual.propietarioId === actorId, cliente = actual.clienteId === actorId;
  const accionesCliente: AccionReserva[] = ['recepcion', 'devolucion/aviso', 'servicio/confirmacion', 'servicio/rechazo'];
  if ((!proveedor && !cliente) || (accionesCliente.includes(accion) ? !cliente : accion !== 'cancelacion' && !proveedor)) {
    throw new ErrorReserva('SIN_PERMISO', 403, 'Esta acción corresponde al otro participante.');
  }
  const s = { ...actual, version: actual.version + 1, motivoOperacion: motivo };
  const conflicto = (mensaje = 'La reserva no permite esa acción en su estado actual.'): never => { throw new ErrorReserva('TRANSICION_INVALIDA', 409, mensaje); };
  const estado = (...permitidos: EstadoReserva[]) => { if (!permitidos.includes(actual.estado)) conflicto(); };
  const vigente = () => { if (!s.venceEn || Date.parse(s.venceEn) <= ahora || Date.parse(s.fin) <= ahora) conflicto('El apartado venció. Actualiza la bandeja.'); };
  const nuevoVencimiento = () => new Date(Math.min(ahora + MINUTOS_APARTADO * 60000, Date.parse(s.fin))).toISOString();
  switch (accion) {
    case 'aceptacion':
      estado('PENDIENTE');
      if (s.tipoSolicitud !== 'alquiler' || s.snapshot.tipo !== 'herramienta' || !s.condiciones) conflicto('Se necesita una nueva solicitud con las condiciones de alquiler aceptadas.');
      if (Date.parse(s.inicio) <= ahora) conflicto('El horario solicitado ya comenzó. Solicita nuevas fechas.');
      s.estado = 'ACEPTADA'; s.venceEn = nuevoVencimiento(); break;
    case 'visita':
      estado('PENDIENTE'); if (s.tipoSolicitud !== 'visita' || Date.parse(s.inicio) <= ahora) conflicto();
      s.estado = 'VISITA_ACORDADA'; break;
    case 'ampliacion':
      estado('ACEPTADA'); vigente();
      if (Date.parse(nuevoVencimiento()) <= Date.parse(s.venceEn!)) conflicto('El apartado ya dispone de ese tiempo.');
      s.venceEn = nuevoVencimiento(); break;
    case 'cancelacion':
      estado('PENDIENTE', 'VISITA_ACORDADA', 'ACEPTADA', 'SERVICIO_CONFIRMADO');
      if (s.estado === 'ACEPTADA') vigente();
      s.estado = 'CANCELADA'; s.venceEn = null; break;
    case 'efectivo':
      estado('ACEPTADA'); vigente();
      s.estado = 'ENTREGA_POR_CONFIRMAR'; s.pagoEstado = 'REGISTRADO_PROVEEDOR';
      s.efectivoCentimos = s.condiciones!.importeCentimos; s.entregadoEn = new Date(ahora).toISOString(); s.venceEn = null; break;
    case 'recepcion':
      estado('ENTREGA_POR_CONFIRMAR'); s.estado = 'EN_CURSO'; s.pagoEstado = 'CONFIRMADO_PARTICIPANTES'; s.recibidoEn = new Date(ahora).toISOString(); break;
    case 'devolucion/aviso':
      estado('EN_CURSO'); s.estado = 'DEVOLUCION_PENDIENTE'; s.devolucionInformadaEn = new Date(ahora).toISOString(); break;
    case 'devolucion/rechazo':
      estado('DEVOLUCION_PENDIENTE'); s.estado = 'EN_CURSO'; s.devolucionInformadaEn = null; break;
    case 'devolucion/confirmacion': {
      estado('DEVOLUCION_PENDIENTE');
      if (!s.condiciones || !s.devolucionInformadaEn || Date.parse(s.devolucionInformadaEn) > ahora || Date.parse(s.devolucionInformadaEn) < Date.parse(s.entregadoEn!)) conflicto();
      const total = liquidar(s.condiciones!, s.fin, s.devolucionInformadaEn!);
      s.estado = 'DEVUELTA'; s.devueltoEn = s.devolucionInformadaEn; Object.assign(s, total); break;
    }
    case 'servicio/inicio':
      estado('SERVICIO_CONFIRMADO');
      if (Date.parse(s.inicio) > ahora) conflicto('Podrás registrar el inicio desde la hora acordada.');
      s.estado = 'SERVICIO_EN_CURSO'; s.servicioIniciadoEn = new Date(ahora).toISOString(); break;
    case 'servicio/termino': {
      estado('SERVICIO_EN_CURSO');
      const acordada = s.cotizaciones?.find(c => c.respuesta?.decision === 'ACEPTADA');
      if (!acordada) conflicto('El servicio no tiene una cotización aceptada.');
      s.estado = 'SERVICIO_POR_CONFIRMAR'; s.pagoEstado = 'REGISTRADO_PROVEEDOR';
      s.efectivoCentimos = acordada!.importeCentimos; s.servicioTerminadoEn = new Date(ahora).toISOString(); break;
    }
    case 'servicio/rechazo':
      estado('SERVICIO_POR_CONFIRMAR');
      s.estado = 'SERVICIO_EN_CURSO'; s.pagoEstado = 'PENDIENTE'; s.efectivoCentimos = 0; s.servicioTerminadoEn = null; break;
    case 'servicio/confirmacion':
      estado('SERVICIO_POR_CONFIRMAR');
      s.estado = 'SERVICIO_CERRADO'; s.pagoEstado = 'CONFIRMADO_PARTICIPANTES'; s.servicioCerradoEn = new Date(ahora).toISOString();
      s.importeFinalCentimos = s.efectivoCentimos; s.saldoCentimos = 0; break;
  }
  return s;
}
