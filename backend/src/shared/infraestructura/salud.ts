import { Controller, Get, HttpException, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { crearPool } from './base-datos';
import { almacenDelProceso } from './almacen';

const POOL_SALUD = Symbol('POOL_SALUD');

/**
 * Salud de la API (008, OPS-FR04). Sin datos personales ni secretos: la consultan Docker, Dokploy y Uptime Kuma.
 * - GET /salud/vida: el proceso responde (liveness). No toca la base.
 * - GET /salud: lista para atender (readiness): PostgreSQL responde en menos de 3 s. Si no, 503.
 */
@Controller('salud')
export class SaludController {
  constructor(@Inject(POOL_SALUD) private readonly pool: Pool) {}

  @Get('vida') vida() { return { estado: 'ok' }; }

  @Get()
  async lista() {
    const inicio = Date.now();
    try {
      await Promise.race([
        this.pool.query('SELECT 1'),
        new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('Tiempo de espera de PostgreSQL agotado')), 3000).unref()),
      ]);
    } catch {
      // El filtro global responde 503 y registra el error sin datos de PostgreSQL.
      throw new HttpException({ estado: 'no_disponible', base: 'error' }, 503);
    }
    return { estado: 'ok', base: 'ok', baseMs: Date.now() - inicio, almacen: almacenDelProceso()?.nombre ?? 'postgres', version: process.env.QATU_VERSION || null };
  }
}

@Module({ controllers: [SaludController], providers: [{ provide: POOL_SALUD, useFactory: () => crearPool(1) }] })
export class SaludModule implements OnApplicationShutdown {
  constructor(@Inject(POOL_SALUD) private readonly pool: Pool) {}
  async onApplicationShutdown() { await this.pool.end(); }
}
