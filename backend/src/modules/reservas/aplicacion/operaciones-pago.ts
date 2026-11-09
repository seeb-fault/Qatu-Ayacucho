import type { RepositorioReservas, ReservaParaPago } from '../dominio/puertos';

/** Fachada pública para el módulo Pagos: no expone el repositorio ni las tablas de Reservas. */
export class OperacionesPago {
  constructor(private readonly repo: RepositorioReservas) {}
  conReserva<T>(id: string, actorId: string | null, operar: (reserva: ReservaParaPago) => Promise<T>) { return this.repo.conReserva(id,actorId,operar); }
  visible(id: string, actorId: string) { return this.repo.visible(id,actorId); }
}
