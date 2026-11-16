import type { Usuarios } from './usuarios';

export class IdentidadUsuarios {
  constructor(private readonly usuarios: Usuarios) {}

  resolver(token: string) {
    return this.usuarios.perfil(token);
  }

  cuentasActivas(ids: string[]) { return this.usuarios.cuentasActivas(ids); }

  /** WhatsApp de la contraparte de una reserva (010); null si no consintió mostrarlo. */
  contactoPublico(usuarioId: string) { return this.usuarios.contactoPublico(usuarioId); }
  tieneWhatsapp(usuarioId: string) { return this.usuarios.tieneWhatsapp(usuarioId); }

  /** Cuota de intentos por clave (15 min); 429 al superarla. La usa el Libro de Reclamaciones (012) para formularios anónimos. */
  limitar(clave: string, maximo: number) { return this.usuarios.limitar(clave, maximo); }

  cuentaActiva(usuarioId: string) {
    return this.usuarios.cuentaActiva(usuarioId);
  }
}
