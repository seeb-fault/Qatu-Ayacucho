'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { fechaReserva } from '@/lib/api/reservas';
import { estrellas, type PaginaResenasAdmin, type ResenaAdministrada } from '@/lib/api/resenas';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from './resenas.module.css';

function Resena({ resena, onCambio }: { resena: ResenaAdministrada; onCambio: () => void }) {
  const [motivo, setMotivo] = useState(''), [error, setError] = useState(''), [ocupado, setOcupado] = useState(false);
  async function guardar(e: FormEvent) {
    e.preventDefault(); setOcupado(true); setError('');
    try {
      await apiJson(`/admin/resenas/${resena.id}/moderacion`, 'PATCH', { oculta: !resena.oculta, motivo });
      setMotivo(''); onCambio();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo moderar la reseña.'); } finally { setOcupado(false); }
  }
  return <article className={catalogo.item} aria-label={`Reseña de ${resena.titulo}`}>
    <h3>{resena.titulo}</h3>
    <p><span className={styles.estrellas} aria-label={`${resena.puntuacion} de 5 estrellas`}>{estrellas(resena.puntuacion)}</span> · {fechaReserva(resena.creadaEn)} · <strong>{resena.oculta ? 'Oculta' : 'Visible'}</strong></p>
    {resena.texto ? <p className={styles.texto}>{resena.texto}</p> : <p className={styles.nota}>Sin comentario.</p>}
    {resena.ultimaModeracion && <p className={styles.nota}>Última decisión ({fechaReserva(resena.ultimaModeracion.creadaEn)}): {resena.ultimaModeracion.motivo}</p>}
    {error && <p role="alert" className={catalogo.error}>{error}</p>}
    <form onSubmit={guardar}>
      <label>Motivo de moderación<textarea value={motivo} onChange={e => setMotivo(e.target.value)} required minLength={10} maxLength={500} rows={2}/></label>
      <button className="button outline" disabled={ocupado}>{resena.oculta ? 'Mostrar de nuevo' : 'Ocultar reseña'}</button>
    </form>
  </article>;
}

export default function ModeracionResenas() {
  const [datos, setDatos] = useState<PaginaResenasAdmin | null>(null), [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true), [error, setError] = useState(''), [sinSesion, setSinSesion] = useState(false);
  async function cargar(page = pagina) {
    setCargando(true); setError('');
    try { setDatos(await apiJson<PaginaResenasAdmin>('/admin/resenas?page=' + page)); setPagina(page); setSinSesion(false); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las reseñas.'); setSinSesion(e instanceof ErrorApi && e.status === 401); }
    finally { setCargando(false); }
  }
  useEffect(() => { void cargar(1); }, []);
  return <section className={catalogo.panel} aria-labelledby="titulo-moderacion-resenas">
    <h1 id="titulo-moderacion-resenas">Moderar reseñas</h1>
    <p>Oculta o restablece reseñas con un motivo. Cada decisión queda registrada y el promedio público se recalcula sin las ocultas.</p>
    {cargando && <p role="status">Cargando reseñas…</p>}
    {error && <p role="alert" className={catalogo.error}>{error}</p>}
    {sinSesion && <Link href="/ingresar">Ingresar como administrador</Link>}
    {datos && <div className={catalogo.list}>
      {datos.total === 0 && <p>Todavía no hay reseñas.</p>}
      {datos.items.map(r => <Resena key={r.id} resena={r} onCambio={() => void cargar(pagina)}/>)}
      <div className={catalogo.toolbar}>
        <button className="button outline" disabled={pagina <= 1 || cargando} onClick={() => void cargar(pagina - 1)}>Anterior</button>
        <span>Página {pagina} de {Math.max(1, Math.ceil(datos.total / 20))}</span>
        <button className="button outline" disabled={pagina * 20 >= datos.total || cargando} onClick={() => void cargar(pagina + 1)}>Siguiente</button>
      </div>
    </div>}
  </section>;
}
