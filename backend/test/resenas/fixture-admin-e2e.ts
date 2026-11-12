// Fixture exclusivo de pruebas: crea un administrador sintético ajeno a las reservas. Nunca sobre la base de desarrollo.
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

async function preparar() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test') || process.env.QATU_E2E_RESERVAS !== '1') throw new Error('Se requiere una base exclusiva con sufijo _test y QATU_E2E_RESERVAS=1.');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const password = 'frase sintetica exclusiva administracion e2e';
    const admin = await new PostgresUsuarios(pool).crear('resenas-e2e-admin-' + randomUUID() + '@example.com', 'Administración E2E', await new ScryptPasswords().crear(password));
    await pool.query("INSERT INTO roles_usuario(usuario_id, rol) VALUES ($1, 'admin')", [admin.id]);
    await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
    console.log(JSON.stringify({ email: admin.email, password }));
  } finally { await pool.end(); }
}

preparar().catch(error => { console.error(error instanceof Error ? error.message : 'No se pudo preparar el administrador de prueba.'); process.exitCode = 1; });
