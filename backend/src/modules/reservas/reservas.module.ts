import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { CatalogoModule, ConsultaCatalogo } from '../catalogo';
import { ProveedoresModule, ConsultaProveedores } from '../proveedores';
import { Reservas } from './aplicacion/reservas';
import { DespachadorEventos } from './aplicacion/despacho';
import type { Notificador } from './dominio/puertos';
import { PostgresReservas } from './infraestructura/postgres';
import { PostgresDespacho } from './infraestructura/postgres-despacho';
import { ReservasController, DisponibilidadController } from './presentacion/reservas.controller';

const DESPACHADOR = Symbol('DESPACHADOR_RESERVAS');
/**
 * Aún no hay un canal externo (D08). Sin Notificador el despacho queda inactivo y los eventos siguen
 * pendientes: un adaptador simulado los marcaría como enviados sin que nadie los haya recibido.
 */
export function crearNotificador(): Notificador | null { return null; }

@Module({
  imports: [UsuariosModule, CatalogoModule, ProveedoresModule], controllers: [ReservasController, DisponibilidadController],
  providers: [
    { provide: Pool, useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 }) },
    { provide: Reservas, inject: [Pool,IdentidadUsuarios,ConsultaCatalogo,ConsultaProveedores],
      useFactory: (pool: Pool, identidad: IdentidadUsuarios, catalogo: ConsultaCatalogo, proveedores: ConsultaProveedores) =>
        new Reservas(new PostgresReservas(pool),identidad,catalogo,proveedores) },
    { provide: DESPACHADOR, inject: [Pool], useFactory: (pool: Pool) => {
      const notificador = crearNotificador();
      return notificador ? new DespachadorEventos(new PostgresDespacho(pool),notificador) : null;
    } },
  ],
})
export class ReservasModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private reloj?: ReturnType<typeof setInterval>;
  private venciendo = false;
  private relojDespacho?: ReturnType<typeof setInterval>;
  private despacho?: Promise<unknown>;
  constructor(@Inject(Pool) private readonly pool: Pool, @Inject(Reservas) private readonly reservas: Reservas,
    @Inject(DESPACHADOR) private readonly despachador: DespachadorEventos | null) {}
  private despachar() {
    if (this.despacho || !this.despachador) return;
    this.despacho = this.despachador.despachar().catch(() => console.error('No se pudieron despachar eventos de reservas.')).finally(() => { this.despacho = undefined; });
  }
  async onApplicationBootstrap() {
    await this.reservas.vencer();
    this.reloj = setInterval(() => {
      if (this.venciendo) return;
      this.venciendo = true;
      void this.reservas.vencer().catch(() => console.error('No se pudieron liberar apartados vencidos.')).finally(() => { this.venciendo = false; });
    },15000);
    this.reloj.unref();
    if (this.despachador) {
      this.despachar();
      this.relojDespacho = setInterval(() => this.despachar(),5000);
      this.relojDespacho.unref();
    }
  }
  async onApplicationShutdown() {
    if (this.reloj) clearInterval(this.reloj);
    if (this.relojDespacho) clearInterval(this.relojDespacho);
    await this.despacho;
    await this.pool.end();
  }
}
