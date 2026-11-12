import type { SolicitudReserva } from './api/reservas';

type Estado = SolicitudReserva['estado'];

/** Reservas que siguen en marcha: ni cerradas ni descartadas. */
export const ACTIVAS: Estado[] = ['ACEPTADA', 'APARTADO_PAGADO', 'VISITA_ACORDADA', 'ENTREGA_POR_CONFIRMAR', 'EN_CURSO', 'DEVOLUCION_PENDIENTE',
  'SERVICIO_CONFIRMADO', 'SERVICIO_EN_CURSO', 'SERVICIO_POR_CONFIRMAR', 'SERVICIO_POR_PAGAR'];
/** La herramienta salió del local y aún no vuelve confirmada. */
export const EN_MANOS_DEL_CLIENTE: Estado[] = ['ENTREGA_POR_CONFIRMAR', 'EN_CURSO', 'DEVOLUCION_PENDIENTE'];
/** Trabajos de oficio con horario acordado que todavía no terminan. */
export const TRABAJOS_AGENDADOS: Estado[] = ['SERVICIO_CONFIRMADO', 'SERVICIO_EN_CURSO'];

/**
 * Lo que el proveedor debe hacer ahora, según las transiciones que el backend le permite a él.
 * Devuelve null cuando la reserva espera al cliente o no requiere nada.
 */
export function accionDelProveedor(s: SolicitudReserva, ahora: number): string | null {
  switch (s.estado) {
    case 'PENDIENTE': {
      if (s.snapshot.tipo === 'servicio') {
        const ultima = s.cotizaciones?.at(-1);
        // Una propuesta vigente sin respuesta espera al cliente.
        if (ultima && !ultima.respuesta && Date.parse(ultima.vigenteHasta) > ahora) return null;
        return 'Enviar cotización';
      }
      return s.tipoSolicitud === 'visita' ? 'Acordar la visita' : 'Aceptar o rechazar';
    }
    case 'ACEPTADA': return 'Entregar y registrar el efectivo';
    case 'APARTADO_PAGADO': return 'Entregar la herramienta pagada';
    case 'DEVOLUCION_PENDIENTE': return 'Confirmar la devolución';
    case 'SERVICIO_CONFIRMADO': return Date.parse(s.inicio) <= ahora ? 'Iniciar el trabajo' : null;
    case 'SERVICIO_EN_CURSO': return 'Terminar el trabajo';
    default: return null;
  }
}

/** Reservas activas que empiezan en los próximos días, de la más cercana a la más lejana. */
export function proximas(reservas: SolicitudReserva[], ahora: number, dias = 7): SolicitudReserva[] {
  const limite = ahora + dias * 86_400_000;
  return reservas
    .filter(s => ACTIVAS.includes(s.estado) && Date.parse(s.fin) > ahora && Date.parse(s.inicio) <= limite)
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}
