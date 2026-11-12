'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { EVENTO_AVISOS, type Aviso, type PaginaAvisos } from '@/lib/api/avisos';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { fechaReserva } from '@/lib/api/reservas';
import styles from '@/components/reservas/reservas.module.css';

export default function BandejaAvisos() {
  const [page, setPage] = useState(1);
  const [datos, setDatos] = useState<PaginaAvisos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [sinSesion, setSinSesion] = useState(false);
  const peticion = useRef(0);

  async function cargar() {
    const numero = ++peticion.current;
    setCargando(true); setError(''); setSinSesion(false);
    try {
      const r = await apiJson<PaginaAvisos>(`/avisos?page=${page}`);
      if (numero === peticion.current) setDatos(r);
    } catch (e) {
      if (numero !== peticion.current) return;
      setDatos(null); setSinSesion(e instanceof ErrorApi && e.status === 401);
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los avisos.');
    } finally { if (numero === peticion.current) setCargando(false); }
  }
  useEffect(() => { void cargar(); }, [page]);

  async function marcar(aviso: Aviso) {
    await apiJson('/avisos/' + aviso.id + '/lectura', 'POST', {});
    setDatos(d => d && ({ ...d, noLeidos: Math.max(0, d.noLeidos - (aviso.leidoEn ? 0 : 1)), items: d.items.map(a => a.id === aviso.id ? { ...a, leidoEn: a.leidoEn ?? new Date().toISOString() } : a) }));
    window.dispatchEvent(new Event(EVENTO_AVISOS));
  }
  async function operar(accion: () => Promise<void>) {
    if (ocupado) return;
    setOcupado(true); setError('');
    try { await accion(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar el aviso.'); } finally { setOcupado(false); }
  }
  const marcarTodos = () => operar(async () => {
    await apiJson('/avisos/lectura', 'POST', {});
    window.dispatchEvent(new Event(EVENTO_AVISOS));
    await cargar();
  });

  return <section className={styles.panel} aria-labelledby="titulo-avisos">
    <h1 id="titulo-avisos">Avisos</h1>
    <p>Aquí aparece cada cambio en tus solicitudes. Los avisos pueden tardar unos segundos en llegar.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {sinSesion && <p><Link href="/ingresar">Inicia sesión para consultar tus avisos</Link>.</p>}
    {cargando && !datos && <p role="status">Cargando avisos…</p>}
    {datos && <>
      <div className={styles.toolbar}>
        <p role="status">{datos.noLeidos === 0 ? 'No tienes avisos sin leer.' : datos.noLeidos === 1 ? '1 aviso sin leer.' : `${datos.noLeidos} avisos sin leer.`}</p>
        {datos.noLeidos > 0 && <button className="button outline" disabled={ocupado} onClick={() => { void marcarTodos(); }}>Marcar todos como leídos</button>}
      </div>
      {datos.total === 0 && <div className={styles.notice}><p>Todavía no tienes avisos. Te contaremos aquí cuando cambie una de tus solicitudes.</p><Link href="/reservas">Ver mis solicitudes</Link></div>}
      <div className={styles.list}>{datos.items.map(a => <article key={a.id} className={styles.card} aria-label={a.mensaje}>
        {!a.leidoEn && <span className={styles.status}>Sin leer</span>}
        <p><strong>{a.mensaje}</strong></p>
        <p>{a.titulo}</p>
        <p className={styles.hint}>{fechaReserva(a.creadoEn)} (Lima)</p>
        <p><Link href={'/reservas?vista=' + a.vista} onClick={() => { if (!a.leidoEn) void marcar(a).catch(() => undefined); }}>Ver la solicitud</Link></p>
        {!a.leidoEn && <button className="button outline" disabled={ocupado} onClick={() => { void operar(() => marcar(a)); }}>Marcar como leído</button>}
      </article>)}</div>
      {datos.total > datos.limit && <nav className={styles.toolbar} aria-label="Páginas de avisos">
        <button className="button outline" disabled={page === 1 || cargando} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {Math.ceil(datos.total / datos.limit)}</span>
        <button className="button outline" disabled={page * datos.limit >= datos.total || cargando} onClick={() => setPage(page + 1)}>Siguiente</button>
      </nav>}
    </>}
  </section>;
}
