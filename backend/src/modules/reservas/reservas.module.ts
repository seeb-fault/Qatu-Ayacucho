import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { CatalogoModule, ConsultaCatalogo } from '../catalogo';
import { ProveedoresModule, ConsultaProveedores } from '../proveedores';
import { Reservas } from './aplicacion/reservas';
import { PostgresReservas } from './infraestructura/postgres';
import { ReservasController } from './presentacion/reservas.controller';

@Module({
  imports: [UsuariosModule, CatalogoModule, ProveedoresModule], controllers: [ReservasController],
  providers: [
    { provide: Pool, useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 }) },
    { provide: Reservas, inject: [Pool,IdentidadUsuarios,ConsultaCatalogo,ConsultaProveedores],
      useFactory: (pool: Pool, identidad: IdentidadUsuarios, catalogo: ConsultaCatalogo, proveedores: ConsultaProveedores) =>
        new Reservas(new PostgresReservas(pool),identidad,catalogo,proveedores) },
  ],
})
export class ReservasModule implements OnApplicationShutdown {
  constructor(@Inject(Pool) private readonly pool: Pool) {}
  async onApplicationShutdown() { await this.pool.end(); }
}
