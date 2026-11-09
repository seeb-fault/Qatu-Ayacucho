import type { Transaccion } from '../../../shared/dominio/transaccion';
import type { PagosDeReserva } from '../dominio/puertos';

/**
 * Punto donde el módulo Pagos se conecta sin que Reservas lo importe, para que el grafo no tenga ciclos.
 * Sin conexión no se pueden cancelar reservas pagadas: un reembolso no debe perderse en silencio.
 */
export class EnlacePagos implements PagosDeReserva {
  private pagos: PagosDeReserva | null = null;
  conectar(pagos: PagosDeReserva) { this.pagos = pagos; }
  async ultimos(reservaIds: string[]) { return this.pagos ? this.pagos.ultimos(reservaIds) : new Map(); }
  async marcarReembolso(tx: Transaccion, reservaId: string) {
    if (!this.pagos) throw new Error('El módulo de pagos no está conectado.');
    await this.pagos.marcarReembolso(tx,reservaId);
  }
}
