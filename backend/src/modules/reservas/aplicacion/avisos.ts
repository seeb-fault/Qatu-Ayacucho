import { AVISOS, paginaAvisos, type RepositorioAvisos } from '../dominio/avisos';
import type { IdentidadReservas } from '../dominio/puertos';
import { ErrorReserva, objeto, uuid } from '../dominio/solicitud';

export class Avisos {
  constructor(private readonly repo: RepositorioAvisos, private readonly identidad: IdentidadReservas) {}

  async listar(token: string, query: unknown) {
    const actor = await this.identidad.resolver(token), page = paginaAvisos(query);
    const r = await this.repo.listar(actor.id, page);
    return { ...r, page, limit: 20, items: r.items.map(a => ({ ...a, mensaje: AVISOS[a.tipo]?.mensaje ?? 'Tu reserva tiene novedades.' })) };
  }
  async resumen(token: string) {
    const actor = await this.identidad.resolver(token);
    return { noLeidos: await this.repo.noLeidos(actor.id) };
  }
  async marcar(token: string, id: string, cuerpo: unknown) {
    const actor = await this.identidad.resolver(token);
    objeto(cuerpo ?? {}, []);
    // El aviso de otra persona responde igual que uno inexistente: no se revela que existe.
    if (!await this.repo.marcar(uuid(id), actor.id)) throw new ErrorReserva('AVISO_NO_DISPONIBLE', 404, 'El aviso no está disponible.');
    return { noLeidos: await this.repo.noLeidos(actor.id) };
  }
  async marcarTodos(token: string, cuerpo: unknown) {
    const actor = await this.identidad.resolver(token);
    objeto(cuerpo ?? {}, []);
    return { marcados: await this.repo.marcarTodos(actor.id), noLeidos: 0 };
  }
}
