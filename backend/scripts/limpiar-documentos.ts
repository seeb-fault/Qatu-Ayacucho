import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import 'reflect-metadata';
import { ProveedoresModule } from '../src/modules/proveedores';
import { AlmacenModule } from '../src/shared/infraestructura/almacen.module';

/** Proveedores necesita el almacén compartido (013): sus documentos pueden estar en R2 y su purga encola objetos. */
@Module({ imports: [AlmacenModule, ProveedoresModule] })
class LimpiezaDocumentos {}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  const app = await NestFactory.createApplicationContext(LimpiezaDocumentos, { logger: false });
  try {
    const eliminados = app.get(ProveedoresModule).documentosEliminadosAlIniciar;
    console.log(`Adjuntos eliminados de cuentas inactivas: ${eliminados}`);
  } finally { await app.close(); }
}

main().catch(() => { console.error('No se pudo completar la limpieza documental.'); process.exitCode = 1; });
