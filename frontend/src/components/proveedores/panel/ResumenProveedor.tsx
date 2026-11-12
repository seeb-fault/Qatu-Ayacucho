'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icono from '@/components/descubrimiento/Icono';
import type { PaginaOfertas } from '@/lib/api/catalogo';
import { apiJson, ErrorApi } from '@/lib/api/http';
import type { Proveedor } from '@/lib/api/proveedores';
import { fechaReserva, type PaginaReservas, type SolicitudReserva } from '@/lib/api/reservas';
import type { ResenasProveedor } from '@/lib/api/resenas';
import { ACTIVAS, EN_MANOS_DEL_CLIENTE, TRABAJOS_AGENDADOS, accionDelProveedor, proximas } from '@/lib/panel-proveedor';
import styles from './panel.module.css';

/** El resumen lee como máximo estas páginas de 20 solicitudes; si hay más, lo dice. */
const PAGINAS_MAXIMAS = 10;
const rango = (s: SolicitudReserva) => `${fechaReserva(s.inicio)} – ${fechaReserva(s.fin)}`;

interface Datos { perfil: Proveedor | null; ofertas: PaginaOfertas | null; reservas: SolicitudReserva[]; totalReservas: number; reputacion?: ResenasProveedor | null }

async function leerReservas() {
  const primera = await apiJson<PaginaReservas>('/reservas?vista=proveedor&page=1');
  const reservas = [...primera.items];
  const paginas = Math.min(PAGINAS_MAXIMAS, Math.ceil(primera.total / primera.limit));
  for (let page = 2; page <= paginas; page++) reservas.push(...(await apiJson<PaginaReservas>(`/reservas?vista=proveedor&page=${page}`)).items);
  return { reservas, total: primera.total };
}

function avisoPerfil(p: Proveedor): { titulo: string; detalle: string } | null {
  if (p.estadoVerificacion === 'no_solicitada') return { titulo: 'Solicita la verificación documental', detalle: 'Es necesaria para publicar ofertas.' };
  if (p.estadoVerificacion === 'pendiente') return { titulo: 'Tu verificación está en revisión', detalle: 'Podrás publicar cuando sea aprobada.' };
  if (p.estadoVerificacion === 'rechazada') return { titulo: 'Tu verificación fue rechazada', detalle: 'Revisa el motivo y vuelve a solicitarla.' };
  if (!p.visiblePublicamente) return { titulo: 'Tu perfil no es público', detalle: 'Actívalo para que tus ofertas puedan publicarse.' };
  return null;
}

export default function ResumenProveedor() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [sinSesion, setSinSesion] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  async function cargar() {
    setCargando(true); setError(''); setSinSesion(false);
    try {
      const perfil = await apiJson<Proveedor>('/proveedores/me').catch(e => { if (e instanceof ErrorApi && e.status === 404) return null; throw e; });
      if (!perfil) { setDatos({ perfil: null, ofertas: null, reservas: [], totalReservas: 0 }); return; }
      const [ofertas, { reservas, total }, reputacion] = await Promise.all([apiJson<PaginaOfertas>('/publicaciones/mias?page=1'), leerReservas(),
        // La reputación es complementaria: si no carga, el resumen se muestra igual.
        apiJson<ResenasProveedor>(`/proveedores/${perfil.id}/resenas`).catch(() => null)]);
      setDatos({ perfil, ofertas, reservas, totalReservas: total, reputacion });
      setAhora(Date.now());
    } catch (e) {
      setSinSesion(e instanceof ErrorApi && e.status === 401);
      setError(e instanceof Error ? e.message : 'No se pudo cargar tu resumen.');
    } finally { setCargando(false); }
  }
  useEffect(() => { void cargar(); }, []);

  if (cargando) return <section className={styles.resumen} aria-labelledby="titulo-resumen"><h1 id="titulo-resumen">Resumen</h1><p role="status">Cargando tu resumen…</p></section>;
  if (sinSesion) return <section className={styles.resumen} aria-labelledby="titulo-resumen"><h1 id="titulo-resumen">Panel del proveedor</h1><p><Link href="/ingresar">Ingresa para ver tu panel de proveedor</Link>.</p></section>;
  if (error || !datos) return <section className={styles.resumen} aria-labelledby="titulo-resumen"><h1 id="titulo-resumen">Resumen</h1><p role="alert">{error || 'No se pudo cargar tu resumen.'}</p><button className="button outline" onClick={() => { void cargar(); }}>Reintentar</button></section>;

  const { perfil, ofertas, reservas, totalReservas } = datos;
  if (!perfil) return <section className={styles.resumen} aria-labelledby="titulo-resumen">
    <div className={styles.cabecera}><div><h1 id="titulo-resumen">Empieza a ofrecer en Qatu</h1><p>Alquila tus herramientas o presta tus servicios de oficio en Ayacucho.</p></div></div>
    <div className={styles.bloque}>
      <h2>Tres pasos para publicar</h2>
      <ol className={styles.pasos}><li>Crea tu perfil de proveedor con tu nombre público y distrito.</li><li>Solicita la verificación documental.</li><li>Publica tus herramientas u oficios.</li></ol>
      <Link className={styles.verTodo} href="/proveedor/perfil">Crear mi perfil de proveedor</Link>
    </div>
  </section>;

  const tipos = new Set([...(ofertas?.items ?? []).map(o => o.tipo), ...reservas.map(r => r.snapshot.tipo)]);
  const herramientas = tipos.has('herramienta') || tipos.size === 0, oficios = tipos.has('servicio') || tipos.size === 0;
  const porAtender = reservas.map(s => ({ s, accion: accionDelProveedor(s, ahora) })).filter((x): x is { s: SolicitudReserva; accion: string } => x.accion !== null)
    .sort((a, b) => Date.parse(a.s.inicio) - Date.parse(b.s.inicio));
  const siguientes = proximas(reservas, ahora);
  const aviso = avisoPerfil(perfil);
  const habilitado = !aviso;
  const cuenta = (estados: string[]) => reservas.filter(s => estados.includes(s.estado)).length;

  return <section className={styles.resumen} aria-labelledby="titulo-resumen">
    <div className={styles.cabecera}>
      <div><h1 id="titulo-resumen">Hola, {perfil.nombrePublico}</h1><p>Esto es lo que pasa hoy con tus {herramientas && oficios ? 'herramientas y oficios' : herramientas ? 'herramientas' : 'oficios'}.</p></div>
      <Link className={styles.accionPrincipal} href={habilitado ? '/proveedor/ofertas' : '/proveedor/perfil'}><Icono nombre="plus" size={18}/>Publicar oferta</Link>
    </div>

    {aviso && <div className={styles.aviso} role="status"><div><strong>{aviso.titulo}</strong><span>{aviso.detalle}</span></div><Link href="/proveedor/perfil">Ir a perfil y verificación</Link></div>}

    <dl className={styles.cifras}>
      <div className={`${styles.cifra} ${porAtender.length ? styles.destacada : ''}`}><dt>Requieren tu acción</dt><dd>{porAtender.length}</dd></div>
      <div className={styles.cifra}><dt>Reservas activas</dt><dd>{cuenta(ACTIVAS)}</dd></div>
      {herramientas && <div className={styles.cifra}><dt>Herramientas con clientes</dt><dd>{cuenta(EN_MANOS_DEL_CLIENTE)}</dd></div>}
      {oficios && <div className={styles.cifra}><dt>Trabajos agendados</dt><dd>{cuenta(TRABAJOS_AGENDADOS)}</dd></div>}
      <div className={styles.cifra}><dt>Ofertas publicadas</dt><dd>{ofertas?.total ?? 0}</dd></div>
      {datos.reputacion && <div className={styles.cifra}><dt>{datos.reputacion.total ? `Calificación · ${datos.reputacion.total} ${datos.reputacion.total === 1 ? 'reseña' : 'reseñas'}` : 'Calificación · sin reseñas aún'}</dt><dd>{datos.reputacion.promedio !== null ? `${datos.reputacion.promedio.toFixed(1)} ★` : '—'}</dd></div>}
    </dl>
    {reservas.length < totalReservas && <p className={styles.nota}>Las cifras consideran tus {reservas.length} solicitudes más recientes de {totalReservas}.</p>}

    <div className={styles.columnas}>
      <section className={styles.bloque} aria-labelledby="titulo-acciones">
        <h2 id="titulo-acciones">Requieren tu acción</h2>
        <p>Solicitudes en las que el siguiente paso es tuyo.</p>
        {porAtender.length === 0 ? <p className={styles.vacio}>No tienes nada pendiente. Te avisaremos cuando llegue una solicitud.</p> :
          <ul className={styles.lista}>{porAtender.slice(0, 6).map(({ s, accion }) => <li key={s.id} className={styles.item}>
            <div><strong>{s.snapshot.titulo}</strong><span>{rango(s)}</span></div>
            <span className={`${styles.etiqueta} ${styles.accion}`}>{accion}</span>
          </li>)}</ul>}
        <Link className={styles.verTodo} href="/proveedor/solicitudes">Ver todas las solicitudes</Link>
      </section>
      <section className={styles.bloque} aria-labelledby="titulo-proximas">
        <h2 id="titulo-proximas">Próximos 7 días</h2>
        <p>{herramientas && oficios ? 'Entregas, devoluciones y trabajos' : herramientas ? 'Entregas y devoluciones' : 'Trabajos agendados'} en marcha.</p>
        {siguientes.length === 0 ? <p className={styles.vacio}>No hay reservas activas en los próximos días.</p> :
          <ul className={styles.lista}>{siguientes.slice(0, 6).map(s => <li key={s.id} className={styles.item}>
            <div><strong>{s.snapshot.titulo}</strong><span>{rango(s)}</span></div>
            <span className={styles.etiqueta}>{s.snapshot.tipo === 'servicio' ? 'Oficio' : 'Herramienta'}</span>
          </li>)}</ul>}
      </section>
    </div>
  </section>;
}
