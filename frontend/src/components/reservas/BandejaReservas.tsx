'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { type PaginaReservas, type SolicitudReserva } from '@/lib/api/reservas';
import TarjetaReserva from './TarjetaReserva';
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
  const peticion = useRef(0);

  async function cargar(signal?: AbortSignal) {
    const numero = ++peticion.current;
    setCargando(true); setError(''); setSinSesion(false); setDatos(null);
    try {
      const resultado = await apiJson<PaginaReservas>(`/reservas?vista=${vista}&page=${page}`);
      if (!signal?.aborted && numero === peticion.current) setDatos(resultado);
    } catch (e) {
      if (!signal?.aborted && numero === peticion.current) { setError(e instanceof Error ? e.message : 'No se pudo cargar la bandeja.'); setSinSesion(e instanceof ErrorApi && e.status === 401); }
    } finally { if (!signal?.aborted && numero === peticion.current) setCargando(false); }
  }
  useEffect(() => { const controller = new AbortController(); void cargar(controller.signal); return () => controller.abort(); }, [vista, page]);

  async function operar(solicitud: SolicitudReserva, accion: string, entrada?: Record<string,unknown>) {
    if (ocupado) return;
    setOcupado(true); setError(''); setMensaje('');
    try {
      const guardada = await apiJson<SolicitudReserva>('/reservas/' + solicitud.id + '/' + accion, 'POST', { versionActual: solicitud.version, ...entrada });
      setDatos(actual => actual ? { ...actual, items: actual.items.map(s => s.id === guardada.id ? guardada : s) } : actual);
      setMensaje(accion === 'rechazo' ? 'Solicitud rechazada. El cliente podrá consultar el motivo en su bandeja.' : 'Operación registrada. El otro participante podrá consultar el estado actualizado.');
    } catch (e) {
      setSinSesion(e instanceof ErrorApi && e.status === 401);
      setError(e instanceof Error ? e.message : 'No se pudo responder. Recarga la bandeja antes de repetir.');
    } finally { setOcupado(false); }
  }

  function cambiar(nueva: typeof vista) { setVista(nueva); setPage(1); setMensaje(''); }
  return <section className={styles.panel} aria-labelledby="titulo-reservas">
    <span className="eyebrow">TUS PROYECTOS EN MARCHA</span><h1 id="titulo-reservas">Mis solicitudes</h1>
    <p>Consulta lo que has solicitado y las solicitudes que reciben tus ofertas.</p>
    <p className={styles.hint}>Herramientas: apartado de 60 minutos y efectivo al recoger, confirmado por ambos participantes. Las visitas no bloquean. Los pagos en línea se habilitarán después.</p>
    <div className={styles.toolbar} aria-label="Bandejas de solicitudes">
      <button className="button outline" aria-pressed={vista === 'cliente'} disabled={ocupado || cargando} onClick={() => cambiar('cliente')}>Enviadas</button>
      <button className="button outline" aria-pressed={vista === 'proveedor'} disabled={ocupado || cargando} onClick={() => cambiar('proveedor')}>Recibidas</button>
      <button className="button outline" disabled={ocupado || cargando} onClick={() => { void cargar(); }}>Actualizar</button>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    {sinSesion && <p><Link href="/ingresar">Inicia sesión para consultar tus solicitudes</Link>.</p>}
    {cargando && <p role="status">Cargando solicitudes…</p>}
    {!cargando && datos && <><p>{datos.total} {datos.total === 1 ? 'solicitud' : 'solicitudes'} {vista === 'cliente' ? (datos.total === 1 ? 'enviada' : 'enviadas') : (datos.total === 1 ? 'recibida' : 'recibidas')}.</p>
      {datos.items.length === 0 && <div className={styles.notice}><p>{vista === 'cliente' ? 'Todavía no hay solicitudes en esta página. Encuentra una oferta y elige las fechas que necesitas.' : 'No hay solicitudes recibidas en esta página.'}</p><Link href="/buscar">Explorar ofertas</Link></div>}
      <div className={styles.list}>{datos.items.map(s => <TarjetaReserva key={s.id} solicitud={s} ocupado={ocupado} operar={operar}/>)}</div>
      <nav className={styles.toolbar} aria-label="Páginas de solicitudes"><button className="button outline" disabled={page === 1 || ocupado} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {Math.max(1, Math.ceil(datos.total / 20))}</span><button className="button outline" disabled={page * 20 >= datos.total || ocupado} onClick={() => setPage(page + 1)}>Siguiente</button></nav>
    </>}
  </section>;
}
