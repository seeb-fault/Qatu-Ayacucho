import { Controller, Get, HttpException, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { Doc, entero, nulable, opciones, respuesta } from '../presentacion/openapi';
import { crearPool } from './base-datos';
import { almacenDelProceso } from './almacen';

const POOL_SALUD = Symbol('POOL_SALUD');

/**
 * Salud de la API (008, OPS-FR04). Sin datos personales ni secretos: la consultan Docker, Dokploy y Uptime Kuma.
 * - GET /salud/vida: el proceso responde (liveness). No toca la base.
 * - GET /salud: lista para atender (readiness): PostgreSQL responde en menos de 3 s. Si no, 503.
 */
@ApiTags('Salud')
@Controller('salud')
export class SaludController {
  constructor(@Inject(POOL_SALUD) private readonly pool: Pool) {}

  @Doc({ acceso: 'publico', resumen: 'Comprobar que el proceso responde', detalle: 'Liveness: no toca la base de datos.', devuelve: respuesta({ estado: opciones('ok') }) })
  @Get('vida') vida() { return { estado: 'ok' }; }

  @Doc({
    acceso: 'publico', resumen: 'Comprobar que la API puede atender',
    detalle: 'Readiness: PostgreSQL debe responder en menos de 3 s. No expone datos personales ni secretos.',
    devuelve: respuesta({ estado: opciones('ok'), base: opciones('ok'), baseMs: entero(0), almacen: opciones('postgres', 'r2', 'memoria'), version: nulable({ type: 'string' }) }),
    errores: { 503: 'PostgreSQL no respondió en 3 s (SERVICIO_NO_DISPONIBLE)' },
  })
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
