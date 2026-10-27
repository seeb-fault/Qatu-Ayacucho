import type { Proveedores } from './proveedores';

export class ConsultaProveedores {
  constructor(private readonly proveedores: Proveedores) {}

  propio(token: string) { return this.proveedores.propio(token); }

  habilitados() { return this.proveedores.habilitados(); }

  consultar(id: string) { return this.proveedores.publico(id); }

  titular(id: string) { return this.proveedores.titular(id); }
}
