import type { Proveedores } from './proveedores';

export class ConsultaProveedores {
  constructor(private readonly proveedores: Proveedores) {}

  consultar(id: string) { return this.proveedores.publico(id); }
}
