import { Global, Inject, Module, type BeforeApplicationShutdown, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { almacenDelProceso } from './almacen';
import { ArchivosExternos } from './archivos-externos';
import { crearPool, describirError } from './base-datos';

const POOL_ALMACEN = Symbol('POOL_ALMACEN');

/** Almacén de archivos compartido (013): un solo almacén por proceso y la cola de borrado, vaciada cada 5 minutos. */
@Global()
@Module({
  providers: [
    { provide: POOL_ALMACEN, useFactory: () => crearPool(2) },
    { provide: ArchivosExternos, inject: [POOL_ALMACEN], useFactory: (pool: Pool) => new ArchivosExternos(pool, almacenDelProceso()) },
  ],
  exports: [ArchivosExternos],
})
export class AlmacenModule implements OnApplicationBootstrap, BeforeApplicationShutdown, OnApplicationShutdown {
  private reloj?: ReturnType<typeof setInterval>;
  private ronda?: Promise<unknown>;

  constructor(@Inject(POOL_ALMACEN) private readonly pool: Pool, @Inject(ArchivosExternos) private readonly archivos: ArchivosExternos) {}

  private vaciar() {
    this.ronda ??= this.archivos.procesarCola()
      .catch(error => console.error('No se pudo vaciar la cola de borrado del almacén:', describirError(error)))
      .finally(() => { this.ronda = undefined; });
  }

  onApplicationBootstrap() {
    if (!this.archivos.almacen) return;
    this.vaciar();
    this.reloj = setInterval(() => this.vaciar(), 300_000);
    this.reloj.unref();
  }

  async beforeApplicationShutdown() { if (this.reloj) clearInterval(this.reloj); await this.ronda; await this.archivos.esperar(); }
  async onApplicationShutdown() { await this.pool.end(); }
}
