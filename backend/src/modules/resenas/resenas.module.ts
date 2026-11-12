import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { crearPool } from '../../shared/infraestructura/base-datos';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { ReservasModule, ConsultaReservas } from '../reservas';
import { Resenas } from './aplicacion/resenas';
import { PostgresResenas } from './infraestructura/postgres';
import { ModeracionResenasController, ResenaReservaController, ResenasPublicasController } from './presentacion/resenas.controller';

/** Reputación y confianza (técnicamente «resenas»). Depende de Reservas por su fachada; Reservas no lo importa. */
@Module({
  imports: [UsuariosModule, ReservasModule],
  controllers: [ResenaReservaController, ResenasPublicasController, ModeracionResenasController],
  providers: [
    { provide: Pool, useFactory: () => crearPool(5) },
    { provide: Resenas, inject: [Pool, ConsultaReservas, IdentidadUsuarios],
      useFactory: (pool: Pool, reservas: ConsultaReservas, identidad: IdentidadUsuarios) => new Resenas(new PostgresResenas(pool), reservas, identidad) },
  ],
})
export class ResenasModule implements OnApplicationShutdown {
  constructor(@Inject(Pool) private readonly pool: Pool) {}
  async onApplicationShutdown() { await this.pool.end(); }
}
