'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import type { PublicacionPublica } from '@/lib/api/catalogo';
import { fechaReserva, dinero, rangoLima, type SolicitudReserva } from '@/lib/api/reservas';
import styles from './reservas.module.css';

export default function NuevaSolicitud({ publicacionId }: { publicacionId: string }) {
  const [oferta, setOferta] = useState<PublicacionPublica | null>(null);
  const [creada, setCreada] = useState<SolicitudReserva | null>(null);
  const [error, setError] = useState('');
  const [sinSesion, setSinSesion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [tipoSolicitud, setTipoSolicitud] = useState('alquiler');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState('');
  const [consultando, setConsultando] = useState(false);
  const alquilerDiario = oferta?.tipo === 'herramienta' && tipoSolicitud === 'alquiler';
  let dias: number | null = null;
  try { dias = rangoLima(inicio,fin).dias; } catch { /* El formulario mostrará el error al enviarlo. */ }

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
      const rango = rangoLima(inicio,fin);
      setCreada(await apiJson<SolicitudReserva>('/reservas', 'POST', {
        publicacionId: oferta.id, recursoId: datos.get('recursoId'), inicio: rango.inicio, fin: rango.fin, descripcionTrabajo: datos.get('descripcionTrabajo'), tipoSolicitud,
        ...(alquilerDiario ? {aceptaCondiciones:acepta,tarifaEsperadaCentimos:oferta.tarifaCentimos} : {}),
      }));
    } catch (e) {
      setSinSesion(e instanceof ErrorApi && e.status === 401);
      setError(e instanceof Error ? e.message : 'No pudimos confirmar el envío. Revisa tu bandeja antes de repetirlo.');
    } finally { setEnviando(false); }
  }

  async function consultar(form: HTMLFormElement) {
    if (!oferta) return;
    setError(''); setDisponibilidad(''); setConsultando(true);
    try {
      const rango = rangoLima(inicio,fin), recursoId = String(new FormData(form).get('recursoId'));
      const q = new URLSearchParams({publicacionId:oferta.id,inicio:rango.inicio,fin:rango.fin});
      const r = await apiJson<{franjas:{inicio:string;fin:string}[];enUso:boolean}>('/recursos/'+recursoId+'/disponibilidad?'+q);
      setDisponibilidad(r.franjas.length ? 'Hay un apartado o alquiler que coincide con estas fechas. Puedes elegir otro horario o unidad.' : 'No hay apartados para ese rango. La disponibilidad se comprueba de nuevo al aceptar.');
      if (r.enUso) setDisponibilidad(actual => actual + ' La herramienta está actualmente en poder de un cliente.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo consultar.'); }
    finally { setConsultando(false); }
  }

  return <section className={styles.panel} aria-labelledby="titulo-solicitud">
    <span className="eyebrow">COORDINA TU PROYECTO</span><h1 id="titulo-solicitud">Solicitar una reserva o visita</h1>
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
        <div className={styles.notice}><p>{tipoSolicitud === 'visita' ? 'Puedes coordinar una visita para revisar el producto antes de alquilar. La visita no aparta la herramienta y no genera cobros.' : 'Indica el horario que necesitas. La solicitud no bloquea fechas. Si el proveedor acepta, tendrás hasta 60 minutos para acercarte; pueden ampliar el plazo expresamente antes de que venza.'}</p></div>
        <form className={styles.form} onSubmit={enviar} aria-label="Solicitud de reserva" aria-busy={enviando}>
          <label>Qué necesitas<select name="tipoSolicitud" value={tipoSolicitud} disabled={enviando} onChange={e => {setTipoSolicitud(e.target.value);setAcepta(false);setDisponibilidad('');}}>
            <option value="alquiler">{oferta.tipo === 'herramienta' ? 'Alquilar la herramienta' : 'Solicitar el servicio'}</option><option value="visita">Coordinar una visita previa</option></select></label>
          <label>{oferta.tipo === 'herramienta' ? 'Unidad' : 'Agenda'}<select name="recursoId" required disabled={enviando}>{oferta.recursos.filter(r => r.activo && r.id).map(r => <option key={r.id} value={r.id}>{r.identificador}</option>)}</select></label>
          <div className={styles.dates}>
            <label>Inicio (hora de Lima)<input name="inicio" type="datetime-local" required disabled={enviando} value={inicio} onChange={e => {setInicio(e.target.value);setAcepta(false);setDisponibilidad('');}}/></label>
            <label>Fin (hora de Lima)<input name="fin" type="datetime-local" required disabled={enviando} value={fin} onChange={e => {setFin(e.target.value);setAcepta(false);setDisponibilidad('');}}/></label>
          </div>
          {alquilerDiario && <><button type="button" className="button outline" disabled={consultando || enviando} onClick={e => {void consultar(e.currentTarget.form!);}}>{consultando ? 'Consultando…' : 'Consultar disponibilidad'}</button>
            {disponibilidad && <p role="status">{disponibilidad}</p>}
            <div className={styles.notice} aria-label="Condiciones del alquiler"><h2>Alquiler por día</h2>
              <p>{dinero(oferta.tarifaCentimos!)} por cada bloque de 24 horas iniciado.</p>
              {dias && <p><strong>{dias} {dias === 1 ? 'día' : 'días'}: {dinero(dias * oferta.tarifaCentimos!)}</strong>, en efectivo al recoger.</p>}
              <p>El horario de devolución acordado se mantiene aunque recojas tarde. Tienes 30 minutos de tolerancia al devolver; después se suma un día por cada bloque adicional de 24 horas iniciado. Sin comisión de plataforma en este paso.</p>
              <label className={styles.check}><input type="checkbox" required checked={acepta} disabled={enviando} onChange={e => setAcepta(e.target.checked)}/>Acepto el horario, el importe y las condiciones de alquiler</label>
            </div></>}
          <label>{oferta.tipo === 'servicio' ? 'Describe el trabajo' : 'Cuéntanos tu proyecto (opcional)'}<textarea name="descripcionTrabajo" rows={4} required={oferta.tipo === 'servicio'} minLength={oferta.tipo === 'servicio' ? 20 : undefined} maxLength={1500} disabled={enviando}/></label>
          <p className={styles.hint}>Las fechas se muestran en hora de Lima. No se realizan pagos en este paso.</p>
          <button className="button primary" disabled={enviando || !oferta.recursos.some(r => r.activo && r.id)}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
        </form></>}
  </section>;
}
