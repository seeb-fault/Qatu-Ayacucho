'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { fechaReserva, type PaginaReservas, type SolicitudReserva } from '@/lib/api/reservas';
import styles from './reservas.module.css';

export default function BandejaReservas() {
  const [vista, setVista] = useState<'cliente' | 'proveedor'>('cliente');
  const [page, setPage] = useState(1);
  const [datos, setDatos] = useState<PaginaReservas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sinSesion, setSinSesion] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function cargar(signal?: AbortSignal) {
    setCargando(true); setError(''); setSinSesion(false); setDatos(null);
    try {
      const resultado = await apiJson<PaginaReservas>(`/reservas?vista=${vista}&page=${page}`);
      if (!signal?.aborted) setDatos(resultado);
    } catch (e) {
      if (!signal?.aborted) { setError(e instanceof Error ? e.message : 'No se pudo cargar la bandeja.'); setSinSesion(e instanceof ErrorApi && e.status === 401); }
    } finally { if (!signal?.aborted) setCargando(false); }
  }
  useEffect(() => { const controller = new AbortController(); void cargar(controller.signal); return () => controller.abort(); }, [vista, page]);

  async function rechazar(event: FormEvent<HTMLFormElement>, solicitud: SolicitudReserva) {
    event.preventDefault();
    if (ocupado) return;
    const form = event.currentTarget;
    const motivo = new FormData(form).get('motivo');
    setOcupado(true); setError(''); setMensaje('');
    try {
      const guardada = await apiJson<SolicitudReserva>('/reservas/' + solicitud.id + '/rechazo', 'POST', { versionActual: solicitud.version, motivo });
      setDatos(actual => actual ? { ...actual, items: actual.items.map(s => s.id === guardada.id ? guardada : s) } : actual);
      setMensaje('Solicitud rechazada. El cliente podrá consultar el motivo en su bandeja.');
    } catch (e) {
      setSinSesion(e instanceof ErrorApi && e.status === 401);
      setError(e instanceof Error ? e.message : 'No se pudo responder. Recarga la bandeja antes de repetir.');
    } finally { setOcupado(false); }
  }

  function cambiar(nueva: typeof vista) { setVista(nueva); setPage(1); setMensaje(''); }
  return <section className={styles.panel} aria-labelledby="titulo-reservas">
    <span className="eyebrow">TUS PROYECTOS EN MARCHA</span><h1 id="titulo-reservas">Mis solicitudes</h1>
    <p>Consulta lo que has solicitado y las solicitudes que reciben tus ofertas.</p>
    {vista === 'proveedor' && <p className={styles.hint}>Por ahora puedes revisar o rechazar solicitudes. La aceptación y el pago se habilitarán en una próxima etapa.</p>}
    <div className={styles.toolbar} aria-label="Bandejas de solicitudes">
      <button className="button outline" aria-pressed={vista === 'cliente'} disabled={ocupado} onClick={() => cambiar('cliente')}>Enviadas</button>
      <button className="button outline" aria-pressed={vista === 'proveedor'} disabled={ocupado} onClick={() => cambiar('proveedor')}>Recibidas</button>
      <button className="button outline" disabled={ocupado || cargando} onClick={() => { void cargar(); }}>Actualizar</button>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    {sinSesion && <p><Link href="/ingresar">Inicia sesión para consultar tus solicitudes</Link>.</p>}
    {cargando && <p role="status">Cargando solicitudes…</p>}
    {!cargando && datos && <><p>{datos.total} solicitudes {vista === 'cliente' ? 'enviadas' : 'recibidas'}.</p>
      {datos.items.length === 0 && <div className={styles.notice}><p>{vista === 'cliente' ? 'Todavía no hay solicitudes en esta página. Encuentra una oferta y elige las fechas que necesitas.' : 'No hay solicitudes recibidas en esta página.'}</p><Link href="/buscar">Explorar ofertas</Link></div>}
      <div className={styles.list}>{datos.items.map(s => <article key={s.id} className={styles.card} aria-label={s.snapshot.titulo}>
        <span className={styles.status}>{s.estado === 'PENDIENTE' ? 'Pendiente de respuesta' : 'Rechazada'}</span>
        <h2>{s.snapshot.titulo}</h2><p>Proveedor: {s.snapshot.proveedor}</p>
        <dl><dt>Unidad / agenda</dt><dd>{s.snapshot.recurso}</dd><dt>Inicio</dt><dd>{fechaReserva(s.inicio)}</dd><dt>Fin</dt><dd>{fechaReserva(s.fin)}</dd></dl>
        <p className={styles.hint}>Fechas en hora de Lima. Referencia: {s.id}</p>
        {s.descripcionTrabajo && <p>{s.descripcionTrabajo}</p>}
        {s.motivoRechazo && <p><strong>Motivo del rechazo:</strong> {s.motivoRechazo}</p>}
        {s.estado === 'PENDIENTE' && <p>Esta solicitud todavía no bloquea fechas ni confirma un importe.</p>}
        {s.participacion === 'proveedor' && s.estado === 'PENDIENTE' && <form className={styles.form} aria-label={'Responder ' + s.snapshot.titulo} onSubmit={e => { void rechazar(e, s); }}>
          <label>Motivo del rechazo<textarea name="motivo" minLength={10} maxLength={500} required rows={3} disabled={ocupado}/></label>
          <button className="button outline" disabled={ocupado}>Rechazar solicitud</button>
        </form>}
      </article>)}</div>
      <nav className={styles.toolbar} aria-label="Páginas de solicitudes"><button className="button outline" disabled={page === 1 || ocupado} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {Math.max(1, Math.ceil(datos.total / 20))}</span><button className="button outline" disabled={page * 20 >= datos.total || ocupado} onClick={() => setPage(page + 1)}>Siguiente</button></nav>
    </>}
  </section>;
}
