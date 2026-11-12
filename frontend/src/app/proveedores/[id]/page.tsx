import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ProveedorPublico } from '@/lib/api/proveedores';
import { estadosVerificacion } from '@/lib/api/proveedores';
import styles from '@/components/proveedores/proveedores.module.css';
import resenas from '@/components/resenas/resenas.module.css';
import { fechaReserva } from '@/lib/api/reservas';
import { estrellas, type ResenasProveedor } from '@/lib/api/resenas';

export const metadata = { title: 'Perfil de proveedor' };

export default async function ProveedorPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await fetch(`${process.env.QATU_API_URL ?? 'http://127.0.0.1:3001'}/api/v1/proveedores/${encodeURIComponent(id)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (response.status === 404 || response.status === 400) notFound();
  if (!response.ok) throw new Error('El perfil no pudo cargarse.');
  const proveedor: ProveedorPublico = await response.json();
  // La reputación es complementaria: si no carga, el perfil se muestra igual.
  const reputacion: ResenasProveedor | null = await fetch(`${process.env.QATU_API_URL ?? 'http://127.0.0.1:3001'}/api/v1/proveedores/${encodeURIComponent(id)}/resenas`, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    .then(r => r.ok ? r.json() : null).catch(() => null);
  return <section className={styles.panel} aria-labelledby="nombre-proveedor">
    <h1 id="nombre-proveedor">{proveedor.nombrePublico}</h1>
    <p>Distrito de atención: <strong>{proveedor.zona.nombre}</strong></p>
    <div className={styles.estado}><strong>{estadosVerificacion[proveedor.estadoVerificacion]}</strong>{proveedor.estadoVerificacion === 'aprobada' ? 'La documentación fue revisada manualmente por administración. Esto no constituye una garantía sobre futuros servicios.' : 'Este perfil no tiene una verificación documental aprobada.'}</div>
    <h2>Acerca del proveedor</h2><p className={styles.descripcion}>{proveedor.descripcion}</p>
    {reputacion && <section className={resenas.reputacion} aria-labelledby="titulo-resenas">
      <h2 id="titulo-resenas">Reseñas de clientes</h2>
      {reputacion.total === 0 || reputacion.promedio === null ? <p>Todavía no tiene reseñas. Solo los clientes con una operación terminada pueden reseñar.</p> : <>
        <p className={resenas.resumen}><span className={resenas.promedio}>{reputacion.promedio.toFixed(1)}</span><span className={resenas.estrellas} aria-hidden="true">{estrellas(Math.round(reputacion.promedio))}</span><span>{reputacion.total} {reputacion.total === 1 ? 'reseña' : 'reseñas'}</span></p>
        <ul className={resenas.lista}>{reputacion.items.map(r => <li key={r.id}>
          <span className={resenas.estrellas} aria-label={`${r.puntuacion} de 5 estrellas`}>{estrellas(r.puntuacion)}</span>
          <span className={resenas.meta}> · {r.titulo} · {fechaReserva(r.creadaEn)}</span>
          {r.texto && <p>{r.texto}</p>}
        </li>)}</ul>
      </>}
    </section>}
    <Link href="/buscar">Explorar herramientas y oficios</Link>
  </section>;
}
