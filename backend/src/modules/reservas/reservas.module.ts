import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { crearPool } from '../../shared/infraestructura/base-datos';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { CatalogoModule, ConsultaCatalogo } from '../catalogo';
import { ProveedoresModule, ConsultaProveedores } from '../proveedores';
import { Reservas } from './aplicacion/reservas';
import { Avisos } from './aplicacion/avisos';
import { EnlacePagos } from './aplicacion/enlace-pagos';
import { OperacionesPago } from './aplicacion/operaciones-pago';
import { ConsultaReservas } from './aplicacion/consulta-reservas';
import { DespachadorEventos } from './aplicacion/despacho';
import type { Notificador } from './dominio/puertos';
import { PostgresReservas } from './infraestructura/postgres';
import { AvisosNotificador, PostgresAvisos } from './infraestructura/postgres-avisos';
import { PostgresDespacho } from './infraestructura/postgres-despacho';
import { ReservasController, DisponibilidadController } from './presentacion/reservas.controller';
import { AvisosController } from './presentacion/avisos.controller';

const DESPACHADOR = Symbol('DESPACHADOR_RESERVAS');
/** El canal vigente es la bandeja de avisos de la app. Los canales externos siguen pendientes de D08. */
export function crearNotificador(pool: Pool): Notificador | null {
  return process.env.QATU_DESPACHO_EVENTOS === 'inactivo' ? null : new AvisosNotificador(pool);
}

@Module({
  imports: [UsuariosModule, CatalogoModule, ProveedoresModule], controllers: [ReservasController, DisponibilidadController, AvisosController],
  providers: [
    { provide: EnlacePagos, useFactory: () => new EnlacePagos() },
    { provide: ConsultaReservas, inject: [Pool,EnlacePagos], useFactory: (pool: Pool, enlace: EnlacePagos) => new ConsultaReservas(new PostgresReservas(pool,enlace)) },
    { provide: OperacionesPago, inject: [Pool,EnlacePagos], useFactory: (pool: Pool, enlace: EnlacePagos) => new OperacionesPago(new PostgresReservas(pool,enlace)) },
    { provide: Avisos, inject: [Pool,IdentidadUsuarios], useFactory: (pool: Pool, identidad: IdentidadUsuarios) => new Avisos(new PostgresAvisos(pool),identidad) },
    { provide: Pool, useFactory: () => crearPool(5) },
    { provide: Reservas, inject: [Pool,IdentidadUsuarios,ConsultaCatalogo,ConsultaProveedores,EnlacePagos],
      useFactory: (pool: Pool, identidad: IdentidadUsuarios, catalogo: ConsultaCatalogo, proveedores: ConsultaProveedores, enlace: EnlacePagos) =>
        new Reservas(new PostgresReservas(pool,enlace),identidad,catalogo,proveedores,enlace) },
    { provide: DESPACHADOR, inject: [Pool], useFactory: (pool: Pool) => {
      const notificador = crearNotificador(pool);
      return notificador ? new DespachadorEventos(new PostgresDespacho(pool),notificador) : null;
    } },
  ],
  exports: [EnlacePagos, OperacionesPago, ConsultaReservas],
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
