import type { ParticipacionReserva, RepositorioReservas } from '../dominio/puertos';

/** Fachada pública de lectura para otros módulos (Reseñas): participantes, estado y cierre de una reserva. */
export class ConsultaReservas {
  constructor(private readonly repo: RepositorioReservas) {}
  paraResena(id: string, actorId: string): Promise<ParticipacionReserva | null> { return this.repo.participacion(id, actorId); }
  /** Fechas de cierre por id, para la retención de evidencias; no devuelve otros datos. */
  cierres(ids: string[]): Promise<Map<string, string | null>> { return this.repo.cierres(ids); }
}
