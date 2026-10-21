import type { Usuarios } from './usuarios';

export class IdentidadUsuarios {
  constructor(private readonly usuarios: Usuarios) {}

  resolver(token: string) {
    return this.usuarios.perfil(token);
  }
}
