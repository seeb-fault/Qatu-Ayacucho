import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { CatalogoModule, ConsultaCatalogo } from '../catalogo';
import { ProveedoresModule, ConsultaProveedores } from '../proveedores';
import { Reservas } from './aplicacion/reservas';
import { PostgresReservas } from './infraestructura/postgres';
import { ReservasController, DisponibilidadController } from './presentacion/reservas.controller';

@Module({
  imports: [UsuariosModule, CatalogoModule, ProveedoresModule], controllers: [ReservasController, DisponibilidadController],
  providers: [
    { provide: Pool, useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 }) },
    { provide: Reservas, inject: [Pool,IdentidadUsuarios,ConsultaCatalogo,ConsultaProveedores],
      useFactory: (pool: Pool, identidad: IdentidadUsuarios, catalogo: ConsultaCatalogo, proveedores: ConsultaProveedores) =>
        new Reservas(new PostgresReservas(pool),identidad,catalogo,proveedores) },
  ],
})
export class ReservasModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private reloj?: ReturnType<typeof setInterval>;
  private venciendo = false;
  constructor(@Inject(Pool) private readonly pool: Pool, @Inject(Reservas) private readonly reservas: Reservas) {}
  async onApplicationBootstrap() {
    await this.reservas.vencer();
    this.reloj = setInterval(() => {
      if (this.venciendo) return;
      this.venciendo = true;
      void this.reservas.vencer().catch(() => console.error('No se pudieron liberar apartados vencidos.')).finally(() => { this.venciendo = false; });
    },15000);
    this.reloj.unref();
  }
  async onApplicationShutdown() { if (this.reloj) clearInterval(this.reloj); await this.pool.end(); }
}
