'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import type { PublicacionPublica } from '@/lib/api/catalogo';
import { fechaReserva, type SolicitudReserva } from '@/lib/api/reservas';
import styles from './reservas.module.css';

export default function NuevaSolicitud({ publicacionId }: { publicacionId: string }) {
  const [oferta, setOferta] = useState<PublicacionPublica | null>(null);
  const [creada, setCreada] = useState<SolicitudReserva | null>(null);
  const [error, setError] = useState('');
  const [sinSesion, setSinSesion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    setCargando(true); setError('');
    try { setOferta(await apiJson<PublicacionPublica>('/publicaciones/' + encodeURIComponent(publicacionId))); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar la oferta.'); }
    finally { setCargando(false); }
  }
  useEffect(() => { void cargar(); }, [publicacionId]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando || !oferta) return;
    const datos = new FormData(event.currentTarget);
    setEnviando(true); setError(''); setSinSesion(false);
    try {
      // El formulario siempre expresa hora de Lima, independientemente del huso del dispositivo.
      const inicio = new Date(String(datos.get('inicio')) + ':00-05:00');
      const fin = new Date(String(datos.get('fin')) + ':00-05:00');
      if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime()) || inicio.getTime() <= Date.now() || fin <= inicio) throw new Error('El inicio debe ser futuro y anterior al fin.');
      setCreada(await apiJson<SolicitudReserva>('/reservas', 'POST', {
        publicacionId: oferta.id, recursoId: datos.get('recursoId'), inicio: inicio.toISOString(), fin: fin.toISOString(), descripcionTrabajo: datos.get('descripcionTrabajo'),
      }));
    } catch (e) {
      setSinSesion(e instanceof ErrorApi && e.status === 401);
      setError(e instanceof Error ? e.message : 'No pudimos confirmar el envío. Revisa tu bandeja antes de repetirlo.');
    } finally { setEnviando(false); }
  }

  return <section className={styles.panel} aria-labelledby="titulo-solicitud">
    <span className="eyebrow">COORDINA TU PROYECTO</span><h1 id="titulo-solicitud">Solicitar una reserva</h1>
    <Link href="/reservas">Ver mis solicitudes</Link>
    {cargando && <p role="status">Cargando oferta…</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {sinSesion && <p><Link href="/ingresar">Inicia sesión</Link> y vuelve a esta oferta para enviar tu solicitud.</p>}
    {!cargando && !oferta && <button className="button outline" onClick={cargar}>Reintentar</button>}
    {creada ? <div className={styles.notice} role="status"><h2>Solicitud enviada</h2><p>{creada.snapshot.titulo}</p>
      <p>{fechaReserva(creada.inicio)} → {fechaReserva(creada.fin)} (hora de Lima).</p>
      <p>Está pendiente de respuesta. Estas fechas aún no están reservadas y no se ha realizado ningún cobro.</p>
      <Link className="button primary" href="/reservas">Ir a mis solicitudes</Link></div>
      : oferta && <><h2>{oferta.titulo}</h2><p>Proveedor: {oferta.proveedor.nombrePublico}</p>
        <div className={styles.notice}><p>Indica las fechas que necesitas. Enviar una solicitud no aparta la unidad ni confirma un precio final. Podrás seguir la respuesta en tu bandeja.</p></div>
        <form className={styles.form} onSubmit={enviar} aria-label="Solicitud de reserva" aria-busy={enviando}>
          <label>{oferta.tipo === 'herramienta' ? 'Unidad' : 'Agenda'}<select name="recursoId" required disabled={enviando}>{oferta.recursos.filter(r => r.activo && r.id).map(r => <option key={r.id} value={r.id}>{r.identificador}</option>)}</select></label>
          <div className={styles.dates}>
            <label>Inicio (hora de Lima)<input name="inicio" type="datetime-local" required disabled={enviando}/></label>
            <label>Fin (hora de Lima)<input name="fin" type="datetime-local" required disabled={enviando}/></label>
          </div>
          <label>{oferta.tipo === 'servicio' ? 'Describe el trabajo' : 'Cuéntanos tu proyecto (opcional)'}<textarea name="descripcionTrabajo" rows={4} required={oferta.tipo === 'servicio'} minLength={oferta.tipo === 'servicio' ? 20 : undefined} maxLength={1500} disabled={enviando}/></label>
          <p className={styles.hint}>Las fechas se muestran en hora de Lima. No se realizan pagos en este paso.</p>
          <button className="button primary" disabled={enviando || !oferta.recursos.some(r => r.activo && r.id)}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
        </form></>}
  </section>;
}
