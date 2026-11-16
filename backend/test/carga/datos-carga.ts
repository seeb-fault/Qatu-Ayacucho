// Datos sintéticos para las pruebas de carga (EQ-01 y EQ-03): 100 proveedores, 1 000 publicaciones,
// 5 000 reservas y 5 clientes con sesión. Solo sobre una base exclusiva con sufijo _test.
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { PostgresProveedores } from '../../src/modules/proveedores/infraestructura/postgres';
import { PostgresCatalogo } from '../../src/modules/catalogo/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';
import { categorias, zonas } from '../../src/modules/catalogo/dominio/oferta';

const PROVEEDORES = 100, OFERTAS_POR_PROVEEDOR = 10, CLIENTES = 5, RESERVAS = 5000;
const nombres = { herramienta: ['Taladro percutor', 'Amoladora angular', 'Lijadora orbital', 'Compresora de pintura', 'Podadora eléctrica', 'Hidrolavadora'], servicio: ['Gasfitero a domicilio', 'Electricista certificado', 'Carpintero de muebles', 'Pintor de interiores', 'Jardinero por jornada'] };

async function preparar() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) throw new Error('Se requiere una base exclusiva con sufijo _test.');
  const pool = new Pool({ connectionString: databaseUrl, max: 8 });
  try {
    const password = 'frase sintetica exclusiva prueba de carga';
    const hash = await new ScryptPasswords().crear(password);
    const usuarios = new PostgresUsuarios(pool), proveedores = new PostgresProveedores(pool), catalogo = new PostgresCatalogo(pool);
    const recursos: { publicacionId: string; recursoId: string; propietario: string; proveedor: string; titulo: string }[] = [];
    for (let p = 0; p < PROVEEDORES; p++) {
      const sufijo = randomUUID().slice(0, 8);
      const u = await usuarios.crear(`carga-proveedor-${p}-${sufijo}@example.com`, `Proveedor de carga ${p}`, hash);
      const perfil = await proveedores.crear(u.id, { nombrePublico: `Taller de carga ${p} ${sufijo}`, descripcion: 'Proveedor sintético para medir el rendimiento del catálogo.', zonaId: zonas[p % zonas.length].id, visiblePublicamente: true });
      await pool.query("UPDATE proveedores SET estado_verificacion='aprobada' WHERE id=$1", [perfil.id]);
      for (let o = 0; o < OFERTAS_POR_PROVEEDOR; o++) {
        const c = categorias[(p + o) % categorias.length], servicio = c.tipo === 'servicio';
        const base = nombres[c.tipo][(p * 7 + o) % nombres[c.tipo].length];
        const oferta = await catalogo.crear(perfil.id, { tipo: c.tipo, categoriaId: c.id, zonaId: zonas[(p + o) % zonas.length].id, titulo: `${base} ${p}-${o}`,
          descripcion: 'Publicación sintética para la prueba de carga del catálogo de Qatu en Ayacucho.', incluye: ['Accesorios básicos'], condiciones: ['Coordinar el horario con el proveedor'],
          modalidadPrecio: servicio ? 'cotizacion' : 'fija', tarifaCentimos: servicio ? null : 1500 + ((p * 13 + o * 7) % 60) * 100, unidad: servicio ? null : 'día', activa: true,
          recursos: [{ identificador: 'Unidad 1', activo: true }] });
        recursos.push({ publicacionId: oferta.id, recursoId: oferta.recursos[0].id!, propietario: u.id, proveedor: perfil.id, titulo: oferta.titulo });
      }
    }
    const clientes = [];
    for (let i = 0; i < CLIENTES; i++) clientes.push(await usuarios.crear(`carga-cliente-${i}-${randomUUID().slice(0, 8)}@example.com`, `Cliente de carga ${i}`, hash));
    // Reservas pendientes repartidas por recurso y día, sin solaparse (no pasan por la API para no medir su creación).
    for (let lote = 0; lote < RESERVAS; lote += 500) {
      const filas = Array.from({ length: Math.min(500, RESERVAS - lote) }, (_, k) => {
        const n = lote + k, r = recursos[n % recursos.length], dia = 30 + Math.floor(n / recursos.length) * 2;
        const inicio = new Date(Date.UTC(2027, 0, 1) + dia * 86_400_000), fin = new Date(inicio.getTime() + 86_400_000);
        return [randomUUID(), clientes[n % CLIENTES].id, r.propietario, r.proveedor, r.publicacionId, r.recursoId, inicio.toISOString(), fin.toISOString(), JSON.stringify({ titulo: r.titulo })];
      });
      const valores = filas.map((_, i) => `($${i * 9 + 1},$${i * 9 + 2},$${i * 9 + 3},$${i * 9 + 4},$${i * 9 + 5},$${i * 9 + 6},$${i * 9 + 7},$${i * 9 + 8},'',$${i * 9 + 9}::jsonb)`).join(',');
      await pool.query(`INSERT INTO reservas (id,cliente_id,propietario_id,proveedor_id,publicacion_id,recurso_id,inicio,fin,descripcion_trabajo,snapshot) VALUES ${valores}`, filas.flat());
    }
    await pool.query("DELETE FROM limites_acceso");
    await pool.query('ANALYZE');
    console.log(JSON.stringify({ password, clientes: clientes.map(c => c.email), muestras: recursos.filter((_, i) => i % 10 === 0).map(r => ({ publicacionId: r.publicacionId, recursoId: r.recursoId })) }));
  } finally { await pool.end(); }
}
preparar().catch(e => { console.error('No se pudieron preparar los datos de carga:', e instanceof Error ? e.message : e); process.exitCode = 1; });
