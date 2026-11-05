import { NotificacionRechazada, type EventoReserva, type Notificador, type RepositorioDespacho } from '../dominio/puertos';

export const MAX_INTENTOS = 10;
const ESPERA_BASE_MS = 30_000, ESPERA_MAXIMA_MS = 3_600_000;
const TIMEOUT = Symbol('timeout');

/** Espera antes del siguiente intento: 30 s, 1 min, 2 min… hasta un máximo de 1 h. */
export function esperaReintento(intento: number): number {
  return Math.min(ESPERA_BASE_MS * 2 ** Math.max(0, intento - 1), ESPERA_MAXIMA_MS);
}

export interface OpcionesDespacho { limite: number; reclamoMs: number; timeoutMs: number }
export interface ResultadoDespacho { enviados: number; reintentos: number; fallidos: number }

/**
 * Entrega eventos del outbox al menos una vez: un corte tras enviar puede repetir un evento,
 * por lo que el canal debe deduplicar por su id. Nunca mantiene una transacción durante el envío,
 * y un fallo del canal no modifica la reserva.
 */
export class DespachadorEventos {
  constructor(private readonly repo: RepositorioDespacho, private readonly notificador: Notificador,
    // El reclamo debe superar el timeout: un lote se envía en paralelo y termina antes de que venza.
    private readonly opciones: OpcionesDespacho = { limite: 20, reclamoMs: 60_000, timeoutMs: 10_000 }) {}

  private async enviar(evento: EventoReserva) {
    let reloj: ReturnType<typeof setTimeout> | undefined;
    const limite = new Promise<never>((_, rechazar) => { reloj = setTimeout(() => rechazar(TIMEOUT), this.opciones.timeoutMs); });
    try { await Promise.race([this.notificador.enviar(evento), limite]); } finally { clearTimeout(reloj); }
  }

  private async procesar(evento: EventoReserva): Promise<keyof ResultadoDespacho> {
    try {
      await this.enviar(evento);
    } catch (error) {
      // Solo se guarda un código: el mensaje del canal podría contener datos personales.
      const permanente = error instanceof NotificacionRechazada;
      const codigo = permanente ? error.codigo : error === TIMEOUT ? 'TIMEOUT' : 'ERROR_CANAL';
      const agotado = permanente || evento.intento >= MAX_INTENTOS;
      await this.repo.fallar(evento.id, evento.intento, codigo, agotado ? null : esperaReintento(evento.intento));
      return agotado ? 'fallidos' : 'reintentos';
    }
    await this.repo.confirmar(evento.id, evento.intento);
    return 'enviados';
  }

  async despachar(): Promise<ResultadoDespacho> {
    const eventos = await this.repo.reclamar(this.opciones.limite, this.opciones.reclamoMs);
    const resultado: ResultadoDespacho = { enviados: 0, reintentos: 0, fallidos: 0 };
    for (const final of await Promise.allSettled(eventos.map(e => this.procesar(e)))) {
      // Si falla el registro del resultado, el reclamo vence y el evento se reintenta.
      if (final.status === 'fulfilled') resultado[final.value]++;
      else console.error('No se pudo registrar el resultado de un evento de reservas.');
    }
    return resultado;
  }
}
