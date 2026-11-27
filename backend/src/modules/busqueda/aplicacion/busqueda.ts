import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';
import { combinar, entradaBusqueda, FalloInterprete, validarRespuesta, type CampoPreciso, type Criterios, type InterpreteIntencion, type Interpretacion, type OpcionesCatalogo } from '../dominio/intencion';

/** Lo que Búsqueda necesita del catálogo (fachada de Catálogo, solo lectura). */
export interface CatalogoBusqueda {
  opciones(): OpcionesCatalogo;
  buscar(consulta: Record<string, string>): Promise<{ items: unknown[]; total: number; page: number; limit: number }>;
}
/** Límite de uso (fachada de Usuarios): lanza 429 al superarlo. */
export interface LimitesBusqueda { limitar(clave: string, maximo: number): Promise<void> }

export type Motivo = 'sin_configurar' | 'cuota' | 'tiempo' | 'error' | 'respuesta_invalida';
export interface ResultadoBusqueda {
  modo: 'natural' | 'convencional';
  /** Por qué no se usó la IA (solo en modo convencional). */
  motivo: Motivo | null;
  criterios: Criterios;
  fechas: Interpretacion['fechas'];
  camposQueRequierenPrecision: CampoPreciso[];
  aviso: string | null;
  resultados: { items: unknown[]; total: number; page: number; limit: number };
}

export interface ConfiguracionBusqueda {
  /** Tiempo máximo de la interpretación (M007-FR04: 3 s). */
  tiempoMs: number;
  limitePorIp: number;
  limiteGlobal: number;
}

const AVISOS: Record<Motivo, string> = {
  sin_configurar: 'La búsqueda inteligente no está activada: buscamos tus palabras tal cual.',
  cuota: 'Se alcanzó el límite de búsquedas inteligentes por ahora: buscamos tus palabras tal cual.',
  tiempo: 'La búsqueda inteligente tardó demasiado: buscamos tus palabras tal cual.',
  error: 'La búsqueda inteligente no respondió: buscamos tus palabras tal cual.',
  respuesta_invalida: 'No pudimos interpretar la búsqueda: buscamos tus palabras tal cual.',
};

/** Fecha de hoy en Lima (UTC-5, sin horario de verano). */
export const hoyEnLima = (ahora: number) => new Date(ahora - 5 * 3600000).toISOString().slice(0, 10);

/**
 * Caso de uso «Buscar en lenguaje natural» (spec 007). La IA interpreta; el catálogo real decide qué ofertas y a
 * qué precio. Cualquier falla de la IA —sin llave, cuota, tiempo, error o respuesta inválida— cae en la búsqueda
 * convencional con el texto original: la búsqueda nunca se bloquea por la IA (M007-FR05).
 */
export class BuscarEnLenguajeNatural {
  constructor(
    private readonly catalogo: CatalogoBusqueda,
    private readonly limites: LimitesBusqueda,
    private readonly interprete: InterpreteIntencion | null,
    private readonly config: ConfiguracionBusqueda = { tiempoMs: 3000, limitePorIp: 30, limiteGlobal: 600 },
    private readonly ahora: () => number = Date.now,
  ) {}

  async ejecutar(ip: string, value: unknown): Promise<ResultadoBusqueda> {
    const opciones = this.catalogo.opciones();
    const entrada = entradaBusqueda(value, opciones);
    let interpretacion: Interpretacion | null = null, motivo: Motivo | null = null;
    try {
      interpretacion = await this.interpretar(ip, entrada.texto, opciones);
    } catch (error) {
      if (!(error instanceof FalloInterprete)) throw error;
      motivo = error.motivo === 'tiempo' || error.motivo === 'cuota' || error.motivo === 'respuesta_invalida' ? error.motivo : 'error';
      console.warn('Búsqueda inteligente en modo convencional:', motivo); // sin el texto de la persona
    }
    if (!interpretacion && !motivo) motivo = 'sin_configurar';

    const base: Criterios = interpretacion?.criterios ?? { q: entrada.texto.slice(0, 200), tipo: null, categoriaId: null, zonaId: null, precioMaximoCentimos: null };
    const criterios = combinar(base, entrada.manual, opciones);
    let resultados = await this.catalogo.buscar(consulta(criterios, entrada.page));
    let aviso = motivo ? AVISOS[motivo] : null;
    // Si las palabras clave dejan fuera ofertas que sí cumplen los demás criterios, se prueba sin ellas.
    if (interpretacion && resultados.total === 0 && criterios.q && (criterios.tipo || criterios.categoriaId)) {
      const sinPalabras = await this.catalogo.buscar(consulta({ ...criterios, q: null }, entrada.page));
      if (sinPalabras.total > 0) { resultados = sinPalabras; criterios.q = null; aviso = 'No encontramos esas palabras exactas; te mostramos ofertas de la misma categoría.'; }
    }
    return {
      modo: interpretacion ? 'natural' : 'convencional', motivo, criterios,
      fechas: interpretacion?.fechas ?? null,
      camposQueRequierenPrecision: interpretacion?.camposQueRequierenPrecision ?? [],
      aviso, resultados,
    };
  }

  private async interpretar(ip: string, texto: string, opciones: OpcionesCatalogo): Promise<Interpretacion | null> {
    if (!this.interprete) return null;
    try {
      await this.limites.limitar(`ip:${ip}:busqueda-ia`, this.config.limitePorIp);
      await this.limites.limitar('global:busqueda-ia', this.config.limiteGlobal);
    } catch (error) {
      if (error instanceof ErrorAplicacion && error.status === 429) throw new FalloInterprete('cuota');
      throw error;
    }
    const senal = AbortSignal.timeout(this.config.tiempoMs);
    let crudo: unknown;
    try {
      crudo = await this.interprete.interpretar(texto, { fechaReferencia: hoyEnLima(this.ahora()), opciones }, senal);
    } catch (error) {
      if (error instanceof FalloInterprete) throw error;
      throw new FalloInterprete(senal.aborted ? 'tiempo' : 'error');
    }
    return validarRespuesta(crudo, opciones);
  }
}

function consulta(c: Criterios, page: number): Record<string, string> {
  const q: Record<string, string> = { page: String(page), limit: '20' };
  if (c.q) q.q = c.q;
  if (c.tipo) q.tipo = c.tipo;
  if (c.categoriaId) q.categoriaId = c.categoriaId;
  if (c.zonaId) q.zonaId = c.zonaId;
  if (c.precioMaximoCentimos !== null) q.precioMaximoCentimos = String(c.precioMaximoCentimos);
  return q;
}
