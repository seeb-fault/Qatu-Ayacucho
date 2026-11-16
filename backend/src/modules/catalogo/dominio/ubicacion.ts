import { createHash } from 'node:crypto';
import { fallo, objeto } from './oferta';

/** Mapas y ubicación (011). Zona de servicio de Qatu: provincia de Huamanga y alrededores. */
export const LIMITES = { latMin: -13.6, latMax: -12.6, lngMin: -74.7, lngMax: -73.7 } as const;
export type Precision = 'exacta' | 'aproximada';
export interface Punto { lat: number; lng: number }
export interface UbicacionOferta extends Punto { precision: Precision; publica: Punto }

const METROS_POR_GRADO = 111_320;
const redondear = (v: number) => Math.round(v * 1e6) / 1e6;

export function entradaUbicacion(value: unknown): Punto & { precision: Precision } {
  const d = objeto(value, ['lat', 'lng', 'precision']);
  const numero = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? redondear(v) : fallo('Marca la ubicación en el mapa.');
  const lat = numero(d.lat), lng = numero(d.lng);
  if (lat < LIMITES.latMin || lat > LIMITES.latMax || lng < LIMITES.lngMin || lng > LIMITES.lngMax) fallo('La ubicación debe estar en Ayacucho, dentro de la zona de servicio de Qatu.');
  if (d.precision !== 'exacta' && d.precision !== 'aproximada') fallo('Elige si se muestra la ubicación exacta o casi exacta.');
  return { lat, lng, precision: d.precision };
}

/**
 * Punto que ve el público. «Exacta»: el mismo punto (un local abierto al público).
 * «Aproximada»: desplazado entre 50 y 100 m en una dirección fija para ese proveedor y ese lugar,
 * así varias ofertas en la misma casa muestran el mismo punto y no se puede promediar para hallarla.
 */
export function puntoPublico(proveedorId: string, p: Punto, precision: Precision): Punto {
  if (precision === 'exacta') return { lat: p.lat, lng: p.lng };
  const h = createHash('sha256').update(`${proveedorId}:${p.lat.toFixed(4)}:${p.lng.toFixed(4)}`).digest();
  const rumbo = (h.readUInt16BE(0) / 65_536) * 2 * Math.PI;
  const metros = 50 + (h[2] / 255) * 50;
  const dLat = (metros * Math.cos(rumbo)) / METROS_POR_GRADO;
  const dLng = (metros * Math.sin(rumbo)) / (METROS_POR_GRADO * Math.cos((p.lat * Math.PI) / 180));
  return { lat: redondear(p.lat + dLat), lng: redondear(p.lng + dLng) };
}

/** Distancia aproximada en metros (fórmula de haversine), para pruebas y para «cerca de ti». */
export function distanciaMetros(a: Punto, b: Punto) {
  const r = 6_371_000, rad = (g: number) => (g * Math.PI) / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}
