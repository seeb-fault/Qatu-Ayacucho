import { Module, Inject, type OnApplicationShutdown } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { Usuarios } from './aplicacion/usuarios';
import { IdentidadUsuarios } from './aplicacion/identidad';
import { PostgresUsuarios } from './infraestructura/postgres';
import { ScryptPasswords } from './infraestructura/passwords';
import { JwtTokens } from './infraestructura/tokens';
import { UsuariosController } from './presentacion/usuarios.controller';

@Module({
  controllers: [UsuariosController],
  providers: [
    { provide: Pool, useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 }) },
    { provide: Usuarios, inject: [Pool], useFactory: (pool: Pool) => new Usuarios(new PostgresUsuarios(pool), new ScryptPasswords(), new JwtTokens(new JwtService({ secret: process.env.JWT_SECRET }))) },
    { provide: IdentidadUsuarios, inject: [Usuarios], useFactory: (usuarios: Usuarios) => new IdentidadUsuarios(usuarios) },
  ],
  exports: [IdentidadUsuarios],
})
export class UsuariosModule implements OnApplicationShutdown {
  constructor(@Inject(Pool) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
