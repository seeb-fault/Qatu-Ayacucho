import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ProveedorPublico } from '@/lib/api/proveedores';
import { estadosVerificacion } from '@/lib/api/proveedores';
import styles from '@/components/proveedores/proveedores.module.css';

export const metadata = { title: 'Perfil de proveedor' };

export default async function ProveedorPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await fetch(`${process.env.QATU_API_URL ?? 'http://127.0.0.1:3001'}/api/v1/proveedores/${encodeURIComponent(id)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (response.status === 404 || response.status === 400) notFound();
  if (!response.ok) throw new Error('El perfil no pudo cargarse.');
  const proveedor: ProveedorPublico = await response.json();
  return <section className={styles.panel} aria-labelledby="nombre-proveedor">
    <span className="eyebrow">PROVEEDOR LOCAL</span><h1 id="nombre-proveedor">{proveedor.nombrePublico}</h1>
    <p>Distrito de atención: <strong>{proveedor.zona.nombre}</strong></p>
    <div className={styles.estado}><strong>{estadosVerificacion[proveedor.estadoVerificacion]}</strong>{proveedor.estadoVerificacion === 'aprobada' ? 'La documentación fue revisada manualmente por administración. Esto no constituye una garantía sobre futuros servicios.' : 'Este perfil no tiene una verificación documental aprobada.'}</div>
    <h2>Acerca del proveedor</h2><p className={styles.descripcion}>{proveedor.descripcion}</p>
    <Link href="/buscar">Explorar herramientas y oficios</Link>
  </section>;
}
