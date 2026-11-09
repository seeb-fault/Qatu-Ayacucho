import type { Solicitud } from './solicitud';

/** Lo que corresponde pagar según el servidor, o null si ahora no se puede pagar en línea. */
export function importeAPagar(s: Solicitud, ahora: number): number | null {
  if (s.estado === 'ACEPTADA' && s.condiciones && s.venceEn && Date.parse(s.venceEn) > ahora) return s.condiciones.importeCentimos;
  if (s.estado === 'SERVICIO_POR_PAGAR') return s.cotizaciones?.find(c => c.respuesta?.decision === 'ACEPTADA')?.importeCentimos ?? null;
  return null;
}
