import { Pool } from 'pg';
import { aprovisionarAdmin } from '../src/modules/usuarios/aplicacion/aprovisionar-admin';
import { PostgresUsuarios } from '../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../src/modules/usuarios/infraestructura/passwords';
import { ErrorUsuario } from '../src/modules/usuarios/dominio/usuario';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const usuario = await aprovisionarAdmin(new PostgresUsuarios(pool), new ScryptPasswords(), process.env);
    console.log(`Administrador creado y auditado: ${usuario.id}`);
  } finally {
    delete process.env.QATU_ADMIN_PASSWORD;
    await pool.end();
  }
}

main().catch(error => {
  console.error(error instanceof ErrorUsuario ? error.message : 'No se pudo aprovisionar el administrador. Revisa configuración y migraciones.');
  process.exitCode = 1;
});
