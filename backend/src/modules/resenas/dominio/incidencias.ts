import { ErrorResena, type ReservaParaResena } from './resenas';

export type TipoIncidencia = 'dano' | 'faltante' | 'servicio' | 'otro';
export type ResultadoIncidencia = 'a_favor_cliente' | 'a_favor_proveedor' | 'sin_acuerdo';
/** D09: se puede reclamar desde la entrega y hasta 48 h después del cierre. */
export const HORAS_PARA_RECLAMAR = 48;

/** Estados con la herramienta o el trabajo en marcha: ya hubo entrega o inicio. */
const EN_MARCHA = ['ENTREGA_POR_CONFIRMAR', 'EN_CURSO', 'DEVOLUCION_PENDIENTE', 'SERVICIO_EN_CURSO', 'SERVICIO_POR_CONFIRMAR', 'SERVICIO_POR_PAGAR'];
const CERRADOS = ['DEVUELTA', 'SERVICIO_CERRADO'];
/** Estados en los que la herramienta está por entregarse: el proveedor documenta su estado. */
const ANTES_DE_ENTREGAR = ['ACEPTADA', 'APARTADO_PAGADO', 'ENTREGA_POR_CONFIRMAR'];
const AL_RECIBIR = ['ENTREGA_POR_CONFIRMAR', 'EN_CURSO'];

export interface Incidencia {
  id: string; reservaId: string; autorId: string; clienteId: string; propietarioId: string;
  tipo: TipoIncidencia; descripcion: string; estado: 'abierta' | 'resuelta';
  resultado: ResultadoIncidencia | null; motivo: string | null; revisorId: string | null; creadaEn: string; resueltaEn: string | null;
}
export interface Garantia { reservaId: string; condiciones: string; registradaPor: string; registradaEn: string; conformidadClienteEn: string | null; version: number }

const invalida = (mensaje: string): never => { throw new ErrorResena('ENTRADA_INVALIDA', 400, mensaje); };
function objeto(value: unknown, campos: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !campos.includes(k))) invalida('Revisa los datos enviados.');
  return value as Record<string, unknown>;
}
function texto(value: unknown, min: number, max: number, mensaje: string): string {
  const t = typeof value === 'string' ? value.trim() : '';
  if (Array.from(t).length < min || Array.from(t).length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t)) invalida(mensaje);
  return t;
}

export function entradaIncidencia(value: unknown): { tipo: TipoIncidencia; descripcion: string } {
  const d = objeto(value, ['tipo', 'descripcion']);
  if (!['dano', 'faltante', 'servicio', 'otro'].includes(d.tipo as string)) invalida('Elige el tipo de problema.');
  return { tipo: d.tipo as TipoIncidencia, descripcion: texto(d.descripcion, 20, 1000, 'Describe el problema en 20 a 1000 caracteres.') };
}

export function entradaResolucion(value: unknown): { resultado: ResultadoIncidencia; motivo: string } {
  const d = objeto(value, ['resultado', 'motivo']);
  if (!['a_favor_cliente', 'a_favor_proveedor', 'sin_acuerdo'].includes(d.resultado as string)) invalida('Elige el resultado de la revisión.');
  return { resultado: d.resultado as ResultadoIncidencia, motivo: texto(d.motivo, 10, 500, 'El motivo debe tener entre 10 y 500 caracteres.') };
}

export function entradaGarantia(value: unknown): { condiciones: string } {
  const d = objeto(value, ['condiciones']);
  return { condiciones: texto(d.condiciones, 20, 1000, 'Describe el estado y los accesorios en 20 a 1000 caracteres.') };
}

/** Si un participante puede abrir una incidencia ahora. */
export function puedeReclamar(r: ReservaParaResena, ahora: number) {
  if (EN_MARCHA.includes(r.estado)) return true;
  return CERRADOS.includes(r.estado) && r.cerradaEn !== null && Date.parse(r.cerradaEn) + HORAS_PARA_RECLAMAR * 3_600_000 > ahora;
}

export function exigirPuedeReclamar(r: ReservaParaResena, ahora: number) {
  if (!puedeReclamar(r, ahora)) throw new ErrorResena('RECLAMO_FUERA_DE_PLAZO', 409, `Puedes reportar un problema desde la entrega y hasta ${HORAS_PARA_RECLAMAR} h después del cierre.`);
}

/** El proveedor documenta el estado antes de entregar; una vez que el cliente da conformidad, el acuerdo queda fijo. */
export function exigirPuedeDocumentar(r: ReservaParaResena, actorId: string, actual: Garantia | null) {
  if (r.tipo !== 'herramienta') throw new ErrorResena('SIN_GARANTIA', 409, 'La garantía documental aplica al alquiler de herramientas.');
  if (r.propietarioId !== actorId) throw new ErrorResena('SIN_PERMISO', 403, 'Solo el proveedor registra el estado de la herramienta.');
  if (!ANTES_DE_ENTREGAR.includes(r.estado)) throw new ErrorResena('GARANTIA_FUERA_DE_PLAZO', 409, 'El estado de la herramienta se registra antes de entregarla.');
  if (actual?.conformidadClienteEn) throw new ErrorResena('GARANTIA_CONFIRMADA', 409, 'El cliente ya dio su conformidad; el acuerdo no se puede cambiar.');
}

export function exigirPuedeConfirmar(r: ReservaParaResena, actorId: string, actual: Garantia | null) {
  if (r.clienteId !== actorId) throw new ErrorResena('SIN_PERMISO', 403, 'Solo el cliente confirma el estado recibido.');
  if (!actual) throw new ErrorResena('GARANTIA_INEXISTENTE', 409, 'El proveedor todavía no registró el estado de la herramienta.');
  if (actual.conformidadClienteEn) throw new ErrorResena('GARANTIA_CONFIRMADA', 409, 'Ya diste tu conformidad.');
  if (!AL_RECIBIR.includes(r.estado)) throw new ErrorResena('GARANTIA_FUERA_DE_PLAZO', 409, 'La conformidad se da al recibir la herramienta.');
}
