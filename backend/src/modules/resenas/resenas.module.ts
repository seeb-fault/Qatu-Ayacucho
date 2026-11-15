import { Inject, Module, type BeforeApplicationShutdown, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { crearPool } from '../../shared/infraestructura/base-datos';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { ReservasModule, ConsultaReservas } from '../reservas';
import { Resenas } from './aplicacion/resenas';
import { Evidencias } from './aplicacion/evidencias';
import { Incidencias } from './aplicacion/incidencias';
import { PostgresResenas } from './infraestructura/postgres';
import { PostgresEvidencias } from './infraestructura/postgres-evidencias';
import { PostgresIncidencias } from './infraestructura/postgres-incidencias';
import { ModeracionResenasController, ResenaReservaController, ResenasPublicasController } from './presentacion/resenas.controller';
import { DescargaEvidenciaController, EvidenciasReservaController, ParticipanteEvidenciaGuard } from './presentacion/evidencias.controller';
import { IncidenciasReservaController, ResolucionIncidenciasController } from './presentacion/incidencias.controller';

/** Reputación y confianza (técnicamente «resenas»). Depende de Reservas por su fachada; Reservas no lo importa. */
@Module({
  imports: [UsuariosModule, ReservasModule],
  controllers: [ResenaReservaController, ResenasPublicasController, ModeracionResenasController, EvidenciasReservaController, DescargaEvidenciaController, IncidenciasReservaController, ResolucionIncidenciasController],
  providers: [
    { provide: Pool, useFactory: () => crearPool(5) },
    { provide: Resenas, inject: [Pool, ConsultaReservas, IdentidadUsuarios],
      useFactory: (pool: Pool, reservas: ConsultaReservas, identidad: IdentidadUsuarios) => new Resenas(new PostgresResenas(pool), reservas, identidad) },
    { provide: PostgresIncidencias, inject: [Pool], useFactory: (pool: Pool) => new PostgresIncidencias(pool) },
    { provide: Evidencias, inject: [Pool, ConsultaReservas, IdentidadUsuarios, PostgresIncidencias],
      useFactory: (pool: Pool, reservas: ConsultaReservas, identidad: IdentidadUsuarios, incidencias: PostgresIncidencias) => new Evidencias(new PostgresEvidencias(pool), reservas, identidad, incidencias) },
    { provide: Incidencias, inject: [PostgresIncidencias, ConsultaReservas, IdentidadUsuarios, Pool],
      useFactory: (repo: PostgresIncidencias, reservas: ConsultaReservas, identidad: IdentidadUsuarios, pool: Pool) => new Incidencias(repo, reservas, identidad, new PostgresEvidencias(pool)) },
    ParticipanteEvidenciaGuard,
  ],
})
export class ResenasModule implements OnApplicationBootstrap, BeforeApplicationShutdown, OnApplicationShutdown {
  private reloj?: ReturnType<typeof setInterval>;
  private limpieza?: Promise<unknown>;
  constructor(@Inject(Pool) private readonly pool: Pool, @Inject(Evidencias) private readonly evidencias: Evidencias) {}

  private limpiar() {
    if (this.limpieza) return;
    this.limpieza = this.evidencias.limpiar().catch(() => console.error('No se pudo completar la limpieza de evidencias.')).finally(() => { this.limpieza = undefined; });
  }

  /** Retención D09: al arrancar y cada hora se borra el contenido de evidencias con más de 90 días desde el cierre. */
  onApplicationBootstrap() { this.limpiar(); this.reloj = setInterval(() => this.limpiar(), 3_600_000); this.reloj.unref(); }
  async beforeApplicationShutdown() { if (this.reloj) clearInterval(this.reloj); await this.limpieza; }
  async onApplicationShutdown() { await this.pool.end(); }
}
