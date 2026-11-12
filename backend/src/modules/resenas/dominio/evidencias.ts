import { ErrorResena, type ReservaParaResena } from './resenas';

export type Etapa = 'entrega' | 'devolucion' | 'trabajo';
/** D09: hasta 4 fotos por etapa; se conservan 90 días tras el cierre. */
export const MAXIMO_POR_ETAPA = 4;
export const DIAS_DE_RETENCION = 90;
/** Margen tras el cierre para documentar la devolución o el trabajo terminado; coincide con el plazo de incidencias. */
export const HORAS_TRAS_CIERRE = 48;

const ETAPAS: Record<Etapa, { estados: string[]; tambienCerrada?: string }> = {
  entrega: { estados: ['ENTREGA_POR_CONFIRMAR', 'EN_CURSO'] },
  devolucion: { estados: ['DEVOLUCION_PENDIENTE'], tambienCerrada: 'DEVUELTA' },
  trabajo: { estados: ['SERVICIO_EN_CURSO', 'SERVICIO_POR_CONFIRMAR', 'SERVICIO_POR_PAGAR'], tambienCerrada: 'SERVICIO_CERRADO' },
};

export interface EvidenciaResumen { id: string; etapa: Etapa; autor: 'cliente' | 'proveedor'; tipo: string; bytes: number; sha256: string; creadaEn: string; disponible: boolean }
export interface EvidenciaGuardada { id: string; reservaId: string; autorId: string; etapa: Etapa; tipo: string; bytes: number; sha256: string; creadaEn: string; eliminadaEn: string | null }
export interface CierresDeReservas { cierres(reservaIds: string[]): Promise<Map<string, string | null>> }

export function etapaValida(value: unknown): Etapa {
  if (typeof value !== 'string' || !(value in ETAPAS)) throw new ErrorResena('ENTRADA_INVALIDA', 400, 'Indica si la evidencia es de entrega, devolución o trabajo.');
  return value as Etapa;
}

/** Etapas en las que un participante puede subir evidencia ahora, según el estado de la reserva. */
export function etapasAbiertas(r: ReservaParaResena, ahora: number): Etapa[] {
  return (Object.keys(ETAPAS) as Etapa[]).filter(etapa => {
    const regla = ETAPAS[etapa];
    if (regla.estados.includes(r.estado)) return true;
    return regla.tambienCerrada === r.estado && r.cerradaEn !== null && Date.parse(r.cerradaEn) + HORAS_TRAS_CIERRE * 3_600_000 > ahora;
  });
}

export function exigirEtapaAbierta(r: ReservaParaResena, etapa: Etapa, ahora: number) {
  if (!etapasAbiertas(r, ahora).includes(etapa)) throw new ErrorResena('ETAPA_CERRADA', 409, 'En este momento de la reserva no se puede subir evidencia de esa etapa.');
}
