import { createHash } from 'node:crypto';
import { ErrorReserva, instante, invalida, objeto, texto, uuid } from './solicitud';

/** Mi lista (009): borradores de solicitud. Guardarlos no bloquea fechas ni avisa al proveedor. */
export const MAXIMO_ITEMS = 20;
/** Los ítems con fechas pasadas se muestran como vencidos y se borran pasado este plazo. */
export const RETENCION_VENCIDOS_DIAS = 30;

export type EstadoItem = 'listo' | 'tarifa_cambiada' | 'fechas_vencidas' | 'no_disponible' | 'inactiva';
export interface ItemLista {
  id: string; clienteId: string; publicacionId: string; recursoId: string; tipo: 'herramienta' | 'servicio';
  inicio: string; fin: string; descripcion: string; tarifaVistaCentimos: number | null; creadoEn: string;
}
export type NuevoItem = Omit<ItemLista, 'id' | 'creadoEn'>;
export interface ResultadoEnvio { itemId: string; estado: 'enviado' | 'rechazado'; solicitudId?: string; motivo?: string }

export interface RepositorioLista {
  agregar(item: NuevoItem): Promise<ItemLista>;
  listar(clienteId: string): Promise<ItemLista[]>;
  contar(clienteId: string): Promise<number>;
  quitar(id: string, clienteId: string): Promise<boolean>;
  /** El cliente acepta la tarifa vigente de un ítem cuya tarifa cambió. */
  aceptarTarifa(id: string, clienteId: string, tarifaCentimos: number): Promise<ItemLista | null>;
  /** Saca el ítem de la lista para enviarlo: si dos envíos compiten, solo uno lo obtiene. */
  reclamar(id: string, clienteId: string): Promise<ItemLista | null>;
  /** Devuelve a la lista un ítem cuyo envío falló. */
  restaurar(item: ItemLista): Promise<void>;
  purgarVencidos(clienteId: string, antesDe: string): Promise<void>;
  /** Registra la clave; devuelve el resultado guardado si ya se usó, o null si es nueva. */
  iniciarEnvio(clienteId: string, clave: string, huella: string): Promise<{ resultados: ResultadoEnvio[] | null } | null>;
  terminarEnvio(clienteId: string, clave: string, resultados: ResultadoEnvio[]): Promise<void>;
}

/** Entrada para agregar: las fechas siguen las mismas reglas que una solicitud. */
export function entradaItem(value: unknown, ahora: number) {
  const d = objeto(value, ['publicacionId', 'recursoId', 'inicio', 'fin', 'descripcionTrabajo']);
  const inicio = instante(d.inicio), fin = instante(d.fin);
  if (Date.parse(inicio) <= ahora || inicio >= fin) invalida('El inicio debe ser futuro y anterior al fin.');
  return { publicacionId: uuid(d.publicacionId), recursoId: uuid(d.recursoId), inicio, fin,
    descripcion: d.descripcionTrabajo === undefined ? '' : texto(d.descripcionTrabajo, 0, 1500) };
}

export function claveEnvio(value: unknown) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(value)) throw new ErrorReserva('CLAVE_REQUERIDA', 400, 'Falta la clave del envío. Vuelve a intentarlo.');
  return value;
}

export function entradaEnvio(value: unknown) {
  const d = objeto(value ?? {}, ['ids', 'aceptaCondiciones']);
  if (d.aceptaCondiciones !== undefined && typeof d.aceptaCondiciones !== 'boolean') invalida();
  if (d.ids !== undefined && (!Array.isArray(d.ids) || d.ids.length < 1 || d.ids.length > MAXIMO_ITEMS)) invalida('Elige qué ítems enviar.');
  const ids = d.ids === undefined ? null : [...new Set((d.ids as unknown[]).map(uuid))];
  return { ids, aceptaCondiciones: d.aceptaCondiciones === true };
}

/** Misma clave con otro pedido es un error del cliente, no un reintento. */
export function huellaEnvio(ids: string[] | null, aceptaCondiciones: boolean) {
  return createHash('sha256').update(JSON.stringify({ ids: ids ? [...ids].sort() : null, aceptaCondiciones })).digest('hex');
}

/** Estado de un ítem frente a lo que hoy ofrece el catálogo y la agenda. */
export function revisar(item: ItemLista, ahora: number, oferta: { tarifaCentimos: number | null; recursoActivo: boolean } | null, ocupado: boolean): EstadoItem {
  if (!oferta || !oferta.recursoActivo) return 'inactiva';
  if (Date.parse(item.inicio) <= ahora) return 'fechas_vencidas';
  if (item.tipo === 'herramienta' && oferta.tarifaCentimos !== item.tarifaVistaCentimos) return 'tarifa_cambiada';
  if (ocupado) return 'no_disponible';
  return 'listo';
}
