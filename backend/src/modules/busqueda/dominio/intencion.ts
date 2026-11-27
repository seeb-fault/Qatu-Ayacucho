import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';

/**
 * Búsqueda en lenguaje natural (spec 007). La IA solo traduce el texto a criterios; el catálogo real da precios y
 * ofertas. Todo lo que responde el modelo se trata como no confiable y se valida aquí contra listas cerradas.
 */
export class ErrorBusqueda extends ErrorAplicacion {}

export type Tipo = 'herramienta' | 'servicio';
export type CampoPreciso = 'fechas' | 'zona' | 'categoria' | 'presupuesto' | 'tipo';
export const CAMPOS_PRECISOS: CampoPreciso[] = ['fechas', 'zona', 'categoria', 'presupuesto', 'tipo'];
export const MAXIMO_TEXTO = 500;

export interface Opcion { id: string; nombre: string }
export interface OpcionesCatalogo { categorias: Array<Opcion & { tipo: Tipo }>; zonas: Opcion[] }

/** Lo que el modelo puede devolver. Todos los campos son obligatorios en el esquema; null = no se mencionó. */
export interface RespuestaModelo {
  palabrasClave: string | null;
  tipo: Tipo | null;
  categoriaId: string | null;
  zonaId: string | null;
  precioMaximoSoles: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  camposQueRequierenPrecision: CampoPreciso[];
}

/** Criterios ya validados que se aplican al catálogo. */
export interface Criterios {
  q: string | null;
  tipo: Tipo | null;
  categoriaId: string | null;
  zonaId: string | null;
  precioMaximoCentimos: number | null;
}

export interface Interpretacion {
  criterios: Criterios;
  /** Fechas mencionadas (America/Lima). Se muestran para confirmarlas; la disponibilidad se verifica al reservar. */
  fechas: { inicio: string; fin: string | null } | null;
  camposQueRequierenPrecision: CampoPreciso[];
}

export interface Contexto { fechaReferencia: string; opciones: OpcionesCatalogo }

/** Puerto: un modelo de lenguaje que interpreta la consulta. Debe respetar la señal de cancelación. */
export interface InterpreteIntencion {
  readonly nombre: string;
  interpretar(texto: string, contexto: Contexto, senal: AbortSignal): Promise<unknown>;
}

/** Falla controlada del intérprete: siempre lleva a la búsqueda convencional. */
export class FalloInterprete extends Error {
  constructor(public readonly motivo: 'tiempo' | 'cuota' | 'error' | 'respuesta_invalida', detalle?: string) { super(detalle ?? motivo); }
}

const control = /[\u0000-\u001f\u007f]/;
const fechaIso = /^\d{4}-\d{2}-\d{2}$/;

export interface EntradaBusqueda { texto: string; manual: Partial<Criterios>; page: number }

/** Entrada HTTP estricta: { texto, filtros?, page? }. */
export function entradaBusqueda(value: unknown, opciones: OpcionesCatalogo): EntradaBusqueda {
  const invalida = (mensaje = 'Revisa la búsqueda.') => { throw new ErrorBusqueda('ENTRADA_INVALIDA', 400, mensaje); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalida();
  const d = value as Record<string, unknown>;
  if (Object.keys(d).some(k => !['texto', 'filtros', 'page'].includes(k))) invalida();
  const texto = typeof d.texto === 'string' ? d.texto.trim().replace(/\s+/g, ' ') : '';
  if (!texto || Array.from(texto).length > MAXIMO_TEXTO || control.test(texto)) invalida(`Escribe lo que necesitas en 1 a ${MAXIMO_TEXTO} caracteres.`);
  const page = d.page === undefined ? 1 : d.page;
  if (!Number.isInteger(page) || (page as number) < 1 || (page as number) > 10000) invalida('Página inválida.');
  const manual: Partial<Criterios> = {};
  if (d.filtros !== undefined) {
    const f = d.filtros;
    if (!f || typeof f !== 'object' || Array.isArray(f)) return invalida();
    const filtros = f as Record<string, unknown>;
    if (Object.keys(filtros).some(k => !['tipo', 'categoriaId', 'zonaId', 'precioMaximoCentimos'].includes(k))) invalida();
    if (filtros.tipo !== undefined) { if (filtros.tipo !== 'herramienta' && filtros.tipo !== 'servicio') invalida(); manual.tipo = filtros.tipo as Tipo; }
    if (filtros.categoriaId !== undefined) { if (!opciones.categorias.some(c => c.id === filtros.categoriaId)) invalida(); manual.categoriaId = filtros.categoriaId as string; }
    if (filtros.zonaId !== undefined) { if (!opciones.zonas.some(z => z.id === filtros.zonaId)) invalida(); manual.zonaId = filtros.zonaId as string; }
    if (filtros.precioMaximoCentimos !== undefined) {
      if (!Number.isInteger(filtros.precioMaximoCentimos) || (filtros.precioMaximoCentimos as number) < 0 || (filtros.precioMaximoCentimos as number) > 99999999) invalida();
      manual.precioMaximoCentimos = filtros.precioMaximoCentimos as number;
    }
  }
  return { texto, manual, page: page as number };
}

/**
 * Valida la respuesta del modelo. Un campo inválido o desconocido se descarta (null) y se pide precisión;
 * una respuesta que no es un objeto con la forma esperada es inválida entera.
 */
export function validarRespuesta(crudo: unknown, opciones: OpcionesCatalogo): Interpretacion {
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) throw new FalloInterprete('respuesta_invalida', 'No es un objeto');
  const r = crudo as Record<string, unknown>;
  const esperadas = ['palabrasClave', 'tipo', 'categoriaId', 'zonaId', 'precioMaximoSoles', 'fechaInicio', 'fechaFin', 'camposQueRequierenPrecision'];
  if (Object.keys(r).some(k => !esperadas.includes(k)) || !Array.isArray(r.camposQueRequierenPrecision)) throw new FalloInterprete('respuesta_invalida', 'Campos inesperados');
  const precisar = new Set<CampoPreciso>((r.camposQueRequierenPrecision as unknown[]).filter((c): c is CampoPreciso => CAMPOS_PRECISOS.includes(c as CampoPreciso)));

  let tipo: Tipo | null = r.tipo === 'herramienta' || r.tipo === 'servicio' ? r.tipo : null;
  if (r.tipo !== null && r.tipo !== undefined && !tipo) precisar.add('tipo');
  let categoriaId: string | null = null;
  const categoria = opciones.categorias.find(c => c.id === r.categoriaId);
  if (categoria) {
    if (tipo && categoria.tipo !== tipo) precisar.add('categoria');
    else { categoriaId = categoria.id; tipo = categoria.tipo; }
  } else if (r.categoriaId !== null && r.categoriaId !== undefined) precisar.add('categoria');
  const zonaId = opciones.zonas.find(z => z.id === r.zonaId)?.id ?? null;
  if (!zonaId && r.zonaId !== null && r.zonaId !== undefined) precisar.add('zona');

  let precioMaximoCentimos: number | null = null;
  if (typeof r.precioMaximoSoles === 'number' && Number.isFinite(r.precioMaximoSoles) && r.precioMaximoSoles > 0 && r.precioMaximoSoles <= 999999) {
    precioMaximoCentimos = Math.round(r.precioMaximoSoles * 100);
  } else if (r.precioMaximoSoles !== null && r.precioMaximoSoles !== undefined) precisar.add('presupuesto');

  let q: string | null = null;
  if (typeof r.palabrasClave === 'string') {
    const t = r.palabrasClave.trim().replace(/\s+/g, ' ');
    if (t && t.length <= 100 && !control.test(t)) q = t;
  }

  const fecha = (v: unknown) => typeof v === 'string' && fechaIso.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z')) ? v : null;
  const inicio = fecha(r.fechaInicio), fin = fecha(r.fechaFin);
  let fechas: Interpretacion['fechas'] = null;
  if (inicio && (!fin || fin >= inicio)) fechas = { inicio, fin };
  else if (r.fechaInicio !== null || r.fechaFin !== null) precisar.add('fechas');
  // Toda fecha se confirma: la IA no afirma disponibilidad.
  if (fechas) precisar.add('fechas');

  return { criterios: { q, tipo, categoriaId, zonaId, precioMaximoCentimos }, fechas, camposQueRequierenPrecision: CAMPOS_PRECISOS.filter(c => precisar.has(c)) };
}

/**
 * Los filtros elegidos a mano prevalecen sobre lo interpretado. Si el tipo manual contradice la categoría que dedujo
 * la IA, esa categoría se descarta (una categoría manual se respeta siempre).
 */
export function combinar(ia: Criterios, manual: Partial<Criterios>, opciones: OpcionesCatalogo): Criterios {
  const c: Criterios = { ...ia };
  for (const [clave, valor] of Object.entries(manual) as [keyof Criterios, never][]) if (valor !== undefined) c[clave] = valor;
  const categoria = opciones.categorias.find(x => x.id === c.categoriaId);
  if (categoria && c.tipo && categoria.tipo !== c.tipo) {
    if (manual.categoriaId) c.tipo = categoria.tipo; else c.categoriaId = null;
  }
  return c;
}
