import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { ProveedoresModule } from '../src/modules/proveedores';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  const app = await NestFactory.createApplicationContext(ProveedoresModule,{ logger: false });
  try {
    const eliminados = app.get(ProveedoresModule).documentosEliminadosAlIniciar;
    console.log(`Adjuntos eliminados de cuentas inactivas: ${eliminados}`);
  } finally { await app.close(); }
}

main().catch(() => { console.error('No se pudo completar la limpieza documental.'); process.exitCode = 1; });
