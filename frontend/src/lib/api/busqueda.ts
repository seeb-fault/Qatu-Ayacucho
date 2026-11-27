import { distritos, urlBusqueda } from '@/lib/catalogo';
import { apiJson } from './http';

/** Búsqueda en lenguaje natural (007): POST /api/v1/busqueda/intencion. */
export type CampoPreciso = 'fechas' | 'zona' | 'categoria' | 'presupuesto' | 'tipo';
export interface ResultadoIA {
  modo: 'natural' | 'convencional';
  motivo: 'sin_configurar' | 'cuota' | 'tiempo' | 'error' | 'respuesta_invalida' | null;
  criterios: { q: string | null; tipo: string | null; categoriaId: string | null; zonaId: string | null; precioMaximoCentimos: number | null };
  fechas: { inicio: string; fin: string | null } | null;
  camposQueRequierenPrecision: CampoPreciso[];
  aviso: string | null;
}

const nombreDistrito: Record<string, string> = { ayacucho: 'Ayacucho', 'san-juan-bautista': 'San Juan Bautista', 'carmen-alto': 'Carmen Alto', 'jesus-nazareno': 'Jesús Nazareno' };

export function interpretar(texto: string) {
  return apiJson<ResultadoIA>('/busqueda/intencion', 'POST', { texto });
}

/**
 * Lleva el resultado a /buscar como filtros normales de la URL (editables y quitables como chips) y agrega lo
 * necesario para explicar la búsqueda: modo, motivo, consulta original, campos a precisar y fechas mencionadas.
 */
export function urlDesdeIA(texto: string, r: ResultadoIA) {
  const c = r.criterios, distrito = c.zonaId ? nombreDistrito[c.zonaId] ?? '' : '';
  const extra: Record<string, string> = { ia: r.modo, consulta: texto.slice(0, 500) };
  if (r.motivo) extra.motivo = r.motivo;
  if (r.camposQueRequierenPrecision.length) extra.precisar = r.camposQueRequierenPrecision.join(',');
  if (r.fechas) { extra.desde = r.fechas.inicio; if (r.fechas.fin) extra.hasta = r.fechas.fin; }
  if (r.modo === 'natural' && !c.q && r.aviso) extra.nota = 'sin-palabras';
  return urlBusqueda({
    q: c.q ?? '', tipo: c.tipo ?? '', categoria: c.categoriaId ?? '', distrito: distritos.includes(distrito) ? distrito : '',
    precio: c.precioMaximoCentimos !== null ? String(Math.floor(c.precioMaximoCentimos / 100)) : '',
  }, extra);
}

/** Si la API no responde, la búsqueda sigue: se buscan las palabras tal cual. */
export function urlSinIA(texto: string) {
  return urlBusqueda({ q: texto.slice(0, 200) }, { ia: 'convencional', motivo: 'error', consulta: texto.slice(0, 500) });
}
