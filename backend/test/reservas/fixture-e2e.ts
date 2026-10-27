// Fixture exclusivo de pruebas: nunca ejecutarlo sobre la base de desarrollo.
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { PostgresProveedores } from '../../src/modules/proveedores/infraestructura/postgres';
import { PostgresCatalogo } from '../../src/modules/catalogo/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

async function preparar() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test') || process.env.QATU_E2E_RESERVAS !== '1') throw new Error('Se requiere una base exclusiva con sufijo _test y QATU_E2E_RESERVAS=1.');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const sufijo = randomUUID(), password = 'frase sintetica exclusiva reservas e2e';
    const hash = await new ScryptPasswords().crear(password), usuarios = new PostgresUsuarios(pool);
    const proveedor = await usuarios.crear('reservas-e2e-proveedor-' + sufijo + '@example.com', 'Proveedor E2E', hash);
    const cliente = await usuarios.crear('reservas-e2e-cliente-' + sufijo + '@example.com', 'Cliente E2E', hash);
    const perfil = await new PostgresProveedores(pool).crear(proveedor.id, { nombrePublico: 'Taller E2E ' + sufijo.slice(0,8), descripcion: 'Proveedor sintético de herramientas para el recorrido de solicitudes.', zonaId: 'ayacucho', visiblePublicamente: true });
    // Estado verificado sintético. No acredita el flujo documental, cubierto por 003/004.
    await pool.query("UPDATE proveedores SET estado_verificacion='aprobada' WHERE id=$1", [perfil.id]);
    await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
    const oferta = await new PostgresCatalogo(pool).crear(perfil.id, { tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', titulo: 'Taladro solicitud E2E ' + sufijo.slice(0,8), descripcion: 'Herramienta sintética para comprobar solicitudes persistidas en el navegador.', incluye: ['Equipo y accesorios'], condiciones: ['Coordinación de retiro y devolución'], modalidadPrecio: 'fija', tarifaCentimos: 4250, unidad: 'día', activa: true, recursos: [{ identificador: 'Unidad E2E', activo: true }] });
    console.log(JSON.stringify({ proveedorEmail: proveedor.email, clienteEmail: cliente.email, password, publicacionId: oferta.id, titulo: oferta.titulo }));
  } finally { await pool.end(); }
}
preparar().catch(() => { console.error('No se pudo preparar el fixture aislado de reservas.'); process.exitCode = 1; });
