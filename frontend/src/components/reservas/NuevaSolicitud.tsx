'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import type { PublicacionPublica } from '@/lib/api/catalogo';
import { fechaReserva, dinero, rangoLima, type SolicitudReserva } from '@/lib/api/reservas';
import { avisarCambioLista, guardarPendiente, tomarPendiente, type ItemPendiente } from '@/lib/api/lista';
import { ingresarYVolver } from '@/lib/rutas';
import Icono from '@/components/descubrimiento/Icono';
import styles from './reservas.module.css';

/** `modoLista`: se llegó desde «Agregar a mi lista»; guardar pasa a ser la acción principal. */
export default function NuevaSolicitud({ publicacionId, modoLista = false }: { publicacionId: string; modoLista?: boolean }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState('');
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
  useEffect(() => {
    if (!oferta) return;
    const pendiente = tomarPendiente(oferta.id);
    if (pendiente) void guardar(pendiente);
  }, [oferta]);

  /** Guarda en Mi lista. Sin sesión, recuerda la elección y vuelve aquí después de ingresar. */
  async function guardar(item: ItemPendiente) {
    setGuardando(true); setError(''); setGuardado('');
    try {
      const r = await apiJson<{ total: number }>('/lista/items', 'POST', item);
      setGuardado(`Agregado a tu lista (${r.total} ${r.total === 1 ? 'ítem' : 'ítems'}). No se envió ninguna solicitud todavía.`);
      avisarCambioLista();
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) {
        guardarPendiente(item);
        router.push(ingresarYVolver('/reservas/nueva?publicacion=' + publicacionId + '&lista=1'));
        return;
      }
      setError(e instanceof Error ? e.message : 'No se pudo guardar en tu lista.');
    } finally { setGuardando(false); }
  }

  function guardarDesdeFormulario(form: HTMLFormElement) {
    if (!oferta) return;
    const campos = ['recursoId', 'inicio', 'fin', ...(oferta.tipo === 'servicio' ? ['descripcionTrabajo'] : [])];
    for (const nombre of campos) { const campo = form.elements.namedItem(nombre) as HTMLInputElement | null; if (campo && !campo.reportValidity()) return; }
    let rango;
    try { rango = rangoLima(inicio, fin); } catch (e) { setError(e instanceof Error ? e.message : 'Revisa las fechas.'); return; }
    const datos = new FormData(form), descripcion = String(datos.get('descripcionTrabajo') ?? '').trim();
    void guardar({ publicacionId: oferta.id, recursoId: String(datos.get('recursoId')), inicio: rango.inicio, fin: rango.fin, ...(descripcion ? { descripcionTrabajo: descripcion } : {}) });
  }
  // Al enviar, se lleva la vista y el foco a la confirmación.
  useEffect(() => { if (creada) { window.scrollTo({ top: 0 }); document.getElementById('solicitud-enviada')?.focus(); } }, [creada]);

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

  const herramienta = oferta?.tipo === 'herramienta';
  const visita = tipoSolicitud === 'visita';
  const recursosActivos = oferta?.recursos.filter(r => r.activo && r.id) ?? [];
  const pasos = visita ? ['Propón un horario', 'El proveedor confirma', 'Revisa la herramienta'] : herramienta ? ['Envía tu solicitud', 'El proveedor confirma', 'Recoge y paga en efectivo'] : ['Describe el trabajo', 'Recibe una cotización', 'Acepta y coordina'];
  const cambiarFechas = (nuevoInicio: string, nuevoFin: string) => { setInicio(nuevoInicio); setFin(nuevoFin); setAcepta(false); setDisponibilidad(''); };

  return <section className={styles.flujo} aria-labelledby="titulo-solicitud">
    <div className={styles.flujoTop}><Link className={styles.volver} href={'/publicaciones/' + publicacionId}><Icono nombre="arrow" size={16}/>Volver a la oferta</Link><Link href="/reservas">Ver mis solicitudes</Link></div>
    <header className={styles.flujoCabecera}>
      <span className="eyebrow">{creada ? 'TODO LISTO' : herramienta ? 'ALQUILER DE HERRAMIENTA' : oferta ? 'CONTRATACIÓN DE OFICIO' : 'COORDINA TU PROYECTO'}</span>
      <h1 id="titulo-solicitud">{creada ? 'Tu solicitud está en camino' : herramienta ? 'Alquila esta herramienta' : oferta ? 'Contrata este oficio' : 'Solicitar una reserva o visita'}</h1>
      {!creada && <ol className={styles.progreso} aria-label="Cómo funciona">{pasos.map((paso, i) => <li key={paso} className={i === 0 ? styles.pasoActual : undefined}><span>{i + 1}</span>{paso}</li>)}</ol>}
    </header>
    {cargando && <div className={styles.cargando} role="status">Cargando oferta…</div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {guardado && <p role="status" className={styles.notice}>{guardado} <Link href="/lista">Ver mi lista</Link></p>}
    {sinSesion && <p className={styles.notice}><Link href="/ingresar">Inicia sesión</Link> y vuelve a esta oferta para enviar tu solicitud.</p>}
    {!cargando && !oferta && <button className="button outline" onClick={cargar}>Reintentar</button>}
    {creada ? <div className={styles.exito} role="status">
        <span className={styles.exitoIcono} aria-hidden="true"><Icono nombre="check" size={30}/></span>
        <h2 id="solicitud-enviada" tabIndex={-1}>Solicitud enviada</h2>
        <p className={styles.exitoOferta}>{creada.snapshot.titulo} · {creada.snapshot.proveedor}</p>
        <p className={styles.exitoFechas}><Icono nombre="calendar" size={17}/>{fechaReserva(creada.inicio)} → {fechaReserva(creada.fin)} (hora de Lima).</p>
        <p>Está pendiente de respuesta. Estas fechas aún no están reservadas y no se ha realizado ningún cobro.</p>
        <ol className={styles.siguientes}>
          <li><strong>El proveedor revisa tu solicitud</strong><span>Verás su respuesta en tu bandeja de solicitudes.</span></li>
          <li><strong>{creada.snapshot.tipo === 'servicio' ? 'Recibes una cotización' : 'Coordinan la entrega'}</strong><span>{creada.snapshot.tipo === 'servicio' ? 'Podrás aceptarla o rechazarla antes de contratar.' : 'Si acepta, la herramienta se aparta para ti.'}</span></li>
        </ol>
        <div className={styles.acciones}><Link className="button primary" href="/reservas">Ir a mis solicitudes</Link><Link className="button outline" href="/buscar">Seguir explorando</Link></div>
      </div>
      : oferta && <div className={styles.flujoGrid}>
        <form className={styles.form} onSubmit={enviar} aria-label="Solicitud de reserva" aria-busy={enviando}>
          <fieldset className={styles.bloque} disabled={enviando}>
            <legend><span>1</span>¿Qué necesitas?</legend>
            <label>Qué necesitas<select name="tipoSolicitud" value={tipoSolicitud} onChange={e => {setTipoSolicitud(e.target.value);setAcepta(false);setDisponibilidad('');}}>
              <option value="alquiler">{herramienta ? 'Alquilar la herramienta' : 'Solicitar el servicio'}</option><option value="visita">Coordinar una visita previa</option></select></label>
            <label>{herramienta ? 'Unidad' : 'Agenda'}<select name="recursoId" required>{recursosActivos.map(r => <option key={r.id} value={r.id}>{r.identificador}</option>)}</select></label>
            <p className={styles.hint}>{visita ? 'La visita sirve para revisar la herramienta antes de alquilar. No la aparta ni genera cobros.' : herramienta ? 'La solicitud no bloquea fechas. Si el proveedor acepta, tendrás hasta 60 minutos para acercarte; pueden ampliar el plazo antes de que venza.' : 'El proveedor revisará tu pedido y te enviará una cotización con alcance, materiales e importe.'}</p>
          </fieldset>
          <fieldset className={styles.bloque} disabled={enviando}>
            <legend><span>2</span>¿Cuándo?</legend>
            {alquilerDiario && <div className={styles.atajos} role="group" aria-label="Duración rápida">{([[1, '1 día'], [2, '2 días'], [3, '3 días'], [7, '1 semana']] as const).map(([n, texto]) => <button key={n} type="button" disabled={!inicio} aria-pressed={dias === n} className={dias === n ? styles.atajoActivo : undefined} onClick={() => cambiarFechas(inicio, sumarDias(inicio, n))}>{texto}</button>)}{!inicio && <small>Elige primero el inicio</small>}</div>}
            <div className={styles.dates}>
              <label>Inicio (hora de Lima)<input name="inicio" type="datetime-local" required value={inicio} onChange={e => cambiarFechas(e.target.value, fin)}/></label>
              <label>Fin (hora de Lima)<input name="fin" type="datetime-local" required value={fin} onChange={e => cambiarFechas(inicio, e.target.value)}/></label>
            </div>
            {alquilerDiario && <div className={styles.disponibilidad}><button type="button" className="button outline" disabled={consultando || enviando} onClick={e => {void consultar(e.currentTarget.form!);}}>{consultando ? 'Consultando…' : 'Consultar disponibilidad'}</button>
              {disponibilidad && <p role="status">{disponibilidad}</p>}</div>}
          </fieldset>
          <fieldset className={styles.bloque} disabled={enviando}>
            <legend><span>3</span>{alquilerDiario ? 'Revisa y confirma' : 'Cuéntanos más'}</legend>
            {alquilerDiario && <div className={styles.condiciones} aria-label="Condiciones del alquiler"><h2>Alquiler por día</h2>
              <p>{dinero(oferta.tarifaCentimos!)} por cada bloque de 24 horas iniciado.</p>
              {dias && <p><strong>{dias} {dias === 1 ? 'día' : 'días'}: {dinero(dias * oferta.tarifaCentimos!)}</strong>, en efectivo al recoger.</p>}
              <p>El horario de devolución acordado se mantiene aunque recojas tarde. Tienes 30 minutos de tolerancia al devolver; después se suma un día por cada bloque adicional de 24 horas iniciado. Sin comisión de plataforma en este paso.</p>
              <label className={styles.check}><input type="checkbox" required checked={acepta} onChange={e => setAcepta(e.target.checked)}/>Acepto el horario, el importe y las condiciones de alquiler</label>
            </div>}
            <label>{oferta.tipo === 'servicio' ? 'Describe el trabajo' : 'Cuéntanos tu proyecto (opcional)'}<textarea name="descripcionTrabajo" rows={4} required={oferta.tipo === 'servicio'} minLength={oferta.tipo === 'servicio' ? 20 : undefined} maxLength={1500} placeholder={oferta.tipo === 'servicio' ? 'Ej.: cambiar dos grifos de cocina y revisar una fuga bajo el lavadero.' : 'Ej.: necesito perforar concreto para instalar repisas.'}/></label>
          </fieldset>
          {(() => {
            const enviarBoton = <button className={(modoLista ? 'button outline ' : 'button primary ') + styles.enviar} disabled={enviando || guardando || !recursosActivos.length}>{enviando ? 'Enviando…' : modoLista ? 'Enviar solicitud ahora' : 'Enviar solicitud'}</button>;
            const guardarBoton = !visita && <button type="button" className={(modoLista ? 'button primary ' : 'button outline ') + styles.enviar} disabled={enviando || guardando || !recursosActivos.length} onClick={e => guardarDesdeFormulario(e.currentTarget.form!)}>{guardando ? 'Guardando…' : 'Guardar en mi lista'}</button>;
            return modoLista ? <>{guardarBoton}{enviarBoton}</> : <>{enviarBoton}{guardarBoton}</>;
          })()}
          <p className={styles.hint}>Las fechas se muestran en hora de Lima. No se realizan pagos en este paso. Guardar en tu lista no aparta fechas ni avisa al proveedor.</p>
        </form>
        <aside className={styles.resumen} aria-label="Resumen de tu solicitud">
          <span className={styles.resumenTipo + (herramienta ? '' : ' ' + styles.resumenServicio)}><Icono nombre={herramienta ? 'drill' : 'hammer'} size={15}/>{herramienta ? 'Alquiler' : 'Oficio'}</span>
          <h2>{oferta.titulo}</h2>
          <p className={styles.resumenProveedor}><span aria-hidden="true">{oferta.proveedor.nombrePublico.split(/\s+/).slice(0, 2).map(parte => parte[0]).join('')}</span>{oferta.proveedor.nombrePublico}</p>
          <dl>
            <div><dt>Tarifa</dt><dd>{oferta.tarifaCentimos !== null ? dinero(oferta.tarifaCentimos) + (oferta.unidad ? ' / ' + oferta.unidad : '') : 'A cotizar'}</dd></div>
            <div><dt>Ubicación</dt><dd>{oferta.zona.nombre}</dd></div>
            {inicio && <div><dt>Inicio</dt><dd>{inicio.replace('T', ' · ')}</dd></div>}
            {fin && <div><dt>Fin</dt><dd>{fin.replace('T', ' · ')}</dd></div>}
          </dl>
          {alquilerDiario && <div className={styles.total}><span>Total estimado</span><strong>{dias ? dinero(dias * oferta.tarifaCentimos!) : '—'}</strong><small>{dias ? dias + (dias === 1 ? ' día' : ' días') + ' · efectivo al recoger' : 'Elige las fechas para calcularlo'}</small></div>}
          <ul className={styles.garantias}><li><Icono nombre="check" size={15}/>Sin cobros al enviar</li><li><Icono nombre="check" size={15}/>El proveedor responde en tu bandeja</li><li><Icono nombre="check" size={15}/>Fechas en hora de Lima</li></ul>
        </aside>
      </div>}
  </section>;
}

// Suma días a un valor de datetime-local sin depender de la zona horaria del navegador.
function sumarDias(valor: string, dias: number) {
  const fecha = new Date(valor + ':00Z');
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 16);
}
