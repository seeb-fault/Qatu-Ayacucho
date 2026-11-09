import { Inject, Module, type BeforeApplicationShutdown, type OnApplicationBootstrap, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { crearPool } from '../../shared/infraestructura/base-datos';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { ReservasModule, EnlacePagos, OperacionesPago } from '../reservas';
import { Pagos } from './aplicacion/pagos';
import { crearProcesador } from './infraestructura/culqi';
import { PostgresPagos } from './infraestructura/postgres';
import { PagosController, PagosReservaController } from './presentacion/pagos.controller';

@Module({
  imports: [UsuariosModule, ReservasModule], controllers: [PagosReservaController, PagosController],
  providers: [
    { provide: Pool, useFactory: () => crearPool(5) },
    { provide: PostgresPagos, inject: [Pool,OperacionesPago], useFactory: (pool: Pool, reservas: OperacionesPago) => new PostgresPagos(pool,reservas) },
    { provide: Pagos, inject: [PostgresPagos,IdentidadUsuarios], useFactory: (repo: PostgresPagos, identidad: IdentidadUsuarios) => {
      const { procesador, llavePublica } = crearProcesador();
      return new Pagos(repo,identidad,procesador,llavePublica);
    } },
  ],
})
export class PagosModule implements OnModuleInit, OnApplicationBootstrap, BeforeApplicationShutdown, OnApplicationShutdown {
  private reloj?: ReturnType<typeof setInterval>;
  private conciliacion?: Promise<unknown>;
  constructor(@Inject(Pool) private readonly pool: Pool, @Inject(Pagos) private readonly pagos: Pagos,
    @Inject(PostgresPagos) private readonly repo: PostgresPagos, @Inject(EnlacePagos) private readonly enlace: EnlacePagos) {}
  /** Reservas no importa este módulo: es Pagos quien se presenta ante su puerto. */
  onModuleInit() { this.enlace.conectar(this.repo); }
  onApplicationBootstrap() {
    this.reloj = setInterval(() => {
      if (this.conciliacion) return;
      this.conciliacion = this.pagos.conciliar().catch(() => console.error('No se pudieron conciliar pagos.')).finally(() => { this.conciliacion = undefined; });
    },60000);
    this.reloj.unref();
  }
  /** Antes de que se cierre ningún pool: una conciliación en curso usa también el de Reservas. */
  async beforeApplicationShutdown() {
    if (this.reloj) clearInterval(this.reloj);
    await this.conciliacion;
  }
  async onApplicationShutdown() { await this.pool.end(); }
}
