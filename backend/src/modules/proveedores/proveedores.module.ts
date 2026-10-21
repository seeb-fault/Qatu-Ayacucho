import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { IdentidadUsuarios, UsuariosModule } from '../usuarios';
import { Proveedores } from './aplicacion/proveedores';
import { ConsultaProveedores } from './aplicacion/consulta';
import { PostgresProveedores } from './infraestructura/postgres';
import { ProveedoresController, RevisionProveedoresController, SesionProveedorGuard } from './presentacion/proveedores.controller';
import { DocumentosPrivados } from './infraestructura/documentos';

@Module({
  imports: [UsuariosModule],
  controllers: [ProveedoresController, RevisionProveedoresController],
  providers: [
    SesionProveedorGuard,
    { provide: Pool, useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 }) },
    { provide: Proveedores, inject: [Pool, IdentidadUsuarios], useFactory: (pool: Pool, identidad: IdentidadUsuarios) => new Proveedores(new PostgresProveedores(pool), identidad, new DocumentosPrivados()) },
    { provide: ConsultaProveedores, inject: [Proveedores], useFactory: (proveedores: Proveedores) => new ConsultaProveedores(proveedores) },
  ],
  exports: [ConsultaProveedores],
})
export class ProveedoresModule implements OnApplicationBootstrap, OnApplicationShutdown {
  documentosEliminadosAlIniciar = 0;
  private limpieza?: ReturnType<typeof setInterval>;
  private limpiando = false;

  constructor(@Inject(Pool) private readonly pool: Pool, @Inject(Proveedores) private readonly proveedores: Proveedores) {}

  async onApplicationBootstrap() {
    this.documentosEliminadosAlIniciar = await this.proveedores.limpiarDocumentosInactivos();
    this.limpieza = setInterval(() => {
      if (this.limpiando) return;
      this.limpiando = true;
      void this.proveedores.limpiarDocumentosInactivos().catch(() => console.error('No se pudo completar la limpieza documental periódica.')).finally(() => { this.limpiando = false; });
    },3600000);
    this.limpieza.unref();
  }

  async onApplicationShutdown() {
    if (this.limpieza) clearInterval(this.limpieza);
    await this.pool.end();
  }
}
