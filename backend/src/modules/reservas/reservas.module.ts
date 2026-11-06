import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { crearPool } from '../../shared/infraestructura/base-datos';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { CatalogoModule, ConsultaCatalogo } from '../catalogo';
import { ProveedoresModule, ConsultaProveedores } from '../proveedores';
import { Reservas } from './aplicacion/reservas';
import { Avisos } from './aplicacion/avisos';
import { Pagos } from './aplicacion/pagos';
import { DespachadorEventos } from './aplicacion/despacho';
import type { Notificador } from './dominio/puertos';
import { PostgresReservas } from './infraestructura/postgres';
import { AvisosNotificador, PostgresAvisos } from './infraestructura/postgres-avisos';
import { PostgresDespacho } from './infraestructura/postgres-despacho';
import { crearProcesador } from './infraestructura/culqi';
import { ReservasController, DisponibilidadController, PagosController } from './presentacion/reservas.controller';
import { AvisosController } from './presentacion/avisos.controller';

const DESPACHADOR = Symbol('DESPACHADOR_RESERVAS');
/** El canal vigente es la bandeja de avisos de la app. Los canales externos siguen pendientes de D08. */
export function crearNotificador(pool: Pool): Notificador | null {
  return process.env.QATU_DESPACHO_EVENTOS === 'inactivo' ? null : new AvisosNotificador(pool);
}

@Module({
  imports: [UsuariosModule, CatalogoModule, ProveedoresModule], controllers: [ReservasController, DisponibilidadController, AvisosController, PagosController],
  providers: [
    { provide: Pagos, inject: [Pool,IdentidadUsuarios], useFactory: (pool: Pool, identidad: IdentidadUsuarios) => {
      const { procesador, llavePublica } = crearProcesador();
      return new Pagos(new PostgresReservas(pool),identidad,procesador,llavePublica);
    } },
    { provide: Avisos, inject: [Pool,IdentidadUsuarios], useFactory: (pool: Pool, identidad: IdentidadUsuarios) => new Avisos(new PostgresAvisos(pool),identidad) },
    { provide: Pool, useFactory: () => crearPool(5) },
    { provide: Reservas, inject: [Pool,IdentidadUsuarios,ConsultaCatalogo,ConsultaProveedores],
      useFactory: (pool: Pool, identidad: IdentidadUsuarios, catalogo: ConsultaCatalogo, proveedores: ConsultaProveedores) =>
        new Reservas(new PostgresReservas(pool),identidad,catalogo,proveedores) },
    { provide: DESPACHADOR, inject: [Pool], useFactory: (pool: Pool) => {
      const notificador = crearNotificador(pool);
      return notificador ? new DespachadorEventos(new PostgresDespacho(pool),notificador) : null;
    } },
  ],
})
export class ReservasModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private reloj?: ReturnType<typeof setInterval>;
  private venciendo = false;
  private relojDespacho?: ReturnType<typeof setInterval>;
  private despacho?: Promise<unknown>;
  private relojConciliacion?: ReturnType<typeof setInterval>;
  private conciliacion?: Promise<unknown>;
  constructor(@Inject(Pool) private readonly pool: Pool, @Inject(Reservas) private readonly reservas: Reservas,
    @Inject(DESPACHADOR) private readonly despachador: DespachadorEventos | null, @Inject(Pagos) private readonly pagos: Pagos) {}
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
    this.relojConciliacion = setInterval(() => {
      if (this.conciliacion) return;
      this.conciliacion = this.pagos.conciliar().catch(() => console.error('No se pudieron conciliar pagos.')).finally(() => { this.conciliacion = undefined; });
    },60000);
    this.relojConciliacion.unref();
    if (this.despachador) {
      this.despachar();
      this.relojDespacho = setInterval(() => this.despachar(),5000);
      this.relojDespacho.unref();
    }
  }
  async onApplicationShutdown() {
    if (this.reloj) clearInterval(this.reloj);
    if (this.relojDespacho) clearInterval(this.relojDespacho);
    if (this.relojConciliacion) clearInterval(this.relojConciliacion);
    await this.despacho;
    await this.conciliacion;
    await this.pool.end();
  }
}
