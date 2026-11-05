'use client';

import { useState, type FormEvent } from 'react';
import { dinero, fechaReserva, type SolicitudReserva } from '@/lib/api/reservas';
import styles from './reservas.module.css';

type Props = { solicitud: SolicitudReserva; ocupado: boolean; operar: (s: SolicitudReserva, accion: string, datos?: Record<string,unknown>) => Promise<void> };

export default function CotizacionesServicio({solicitud:s,ocupado,operar}: Props) {
  const [error,setError] = useState('');
  const propuestas = s.cotizaciones ?? [], ultima = propuestas.at(-1);
  const aceptada = propuestas.find(c => c.respuesta?.decision === 'ACEPTADA');
  const proveedor = s.participacion === 'proveedor';
  const habilitada = s.estado === 'PENDIENTE' && !aceptada;

  function proponer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    const datos = new FormData(e.currentTarget), precio = String(datos.get('importe'));
    if (!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(precio)) {setError('Indica un total en soles con hasta dos decimales.');return;}
    const [soles,fraccion=''] = precio.replace(',','.').split('.');
    const importeCentimos = Number(soles)*100+Number(fraccion.padEnd(2,'0'));
    const vigencia = new Date(String(datos.get('vigenteHasta'))+':00-05:00');
    if (!Number.isFinite(vigencia.getTime())) {setError('Indica una vigencia válida en hora de Lima.');return;}
    void operar(s,'cotizacion',{alcance:datos.get('alcance'),materiales:datos.get('materiales'),importeCentimos,vigenteHasta:vigencia.toISOString()});
  }
  function responder(e: FormEvent<HTMLFormElement>, decision: 'aceptacion' | 'rechazo') {
    e.preventDefault();
    void operar(s,'cotizacion/'+decision,{versionCotizacion:ultima!.version,...(decision === 'rechazo' ? {motivo:new FormData(e.currentTarget).get('motivo')} : {})});
  }
  return <section aria-label="Cotizaciones del oficio" className={styles.notice}>
    <h3>{aceptada ? 'Cotización acordada' : 'Propuesta para tu servicio'}</h3>
    <p className={styles.hint}>Aceptar acuerda el alcance y el precio y reserva el horario solicitado si sigue disponible. No se exige anticipo: el total se paga en efectivo al proveedor al terminar el trabajo y ambos lo confirman en Qatu.</p>
    {s.estado === 'PENDIENTE' && aceptada && <>
      <p>Tu cotización se aceptó antes de habilitar la reserva de agenda. El horario todavía necesita confirmación.</p>
      {!proveedor && <form className={styles.form} aria-label="Confirmar horario acordado" onSubmit={e=>{e.preventDefault();void operar(s,'agenda/confirmacion',{versionCotizacion:aceptada.version});}}>
        <label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Confirmo el horario del {fechaReserva(s.inicio)} al {fechaReserva(s.fin)} (Lima), sin anticipo</label>
        <button className="button primary" disabled={ocupado}>Confirmar horario acordado</button>
      </form>}
    </>}
    {!ultima && <p>{proveedor ? 'Prepara una propuesta según el trabajo solicitado.' : 'El proveedor podrá enviarte una propuesta para revisar.'}</p>}
    {propuestas.map(c => <div key={c.version} aria-label={'Cotización versión '+c.version}>
      <h4>Versión {c.version} · {dinero(c.importeCentimos)}</h4>
      <p><strong>Trabajo:</strong> {c.alcance}</p><p><strong>Materiales y exclusiones:</strong> {c.materiales}</p>
      <p>Válida hasta: {fechaReserva(c.vigenteHasta)} (Lima).</p>
      <p>{c.respuesta ? (c.respuesta.decision === 'ACEPTADA' ? 'Aceptada por el cliente' : 'Rechazada por el cliente') : c.version !== ultima?.version ? 'Sustituida por una nueva versión' : 'Pendiente de respuesta; el servidor comprobará la vigencia al responder.'}</p>
      {c.respuesta?.motivo && <p>Motivo: {c.respuesta.motivo}</p>}
    </div>)}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {habilitada && proveedor && <details><summary>{ultima ? 'Preparar nueva versión' : 'Preparar cotización'}</summary>
      <form className={styles.form} aria-label="Preparar cotización" onSubmit={proponer}>
        <label>Alcance del trabajo<textarea name="alcance" required minLength={20} maxLength={1500} disabled={ocupado}/></label>
        <label>Materiales incluidos y exclusiones<textarea name="materiales" required minLength={10} maxLength={1000} disabled={ocupado}/></label>
        <label>Importe total (S/)<input name="importe" inputMode="decimal" required pattern="[0-9]{1,6}([.,][0-9]{1,2})?" disabled={ocupado}/></label>
        <label>Vigente hasta (hora de Lima)<input name="vigenteHasta" type="datetime-local" required disabled={ocupado}/></label>
        <p className={styles.hint}>La vigencia debe terminar antes o al inicio solicitado. Incluye todos los conceptos del precio propuesto.</p>
        <button className="button primary" disabled={ocupado}>Enviar cotización</button>
      </form>
    </details>}
    {habilitada && !proveedor && ultima && !ultima.respuesta && <>
      <form className={styles.form} aria-label="Aceptar cotización" onSubmit={e=>responder(e,'aceptacion')}>
        <label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Acepto el alcance, los materiales y el total de {dinero(ultima.importeCentimos)} de la versión {ultima.version}</label>
        <p>Al aceptar, se reservará el horario del {fechaReserva(s.inicio)} al {fechaReserva(s.fin)} (Lima), si sigue disponible.</p>
        <button className="button primary" disabled={ocupado}>Aceptar cotización</button>
      </form>
      <details><summary>Rechazar esta propuesta</summary><form className={styles.form} aria-label="Rechazar cotización" onSubmit={e=>responder(e,'rechazo')}>
        <label>Motivo para rechazar la cotización<textarea name="motivo" required minLength={10} maxLength={500} disabled={ocupado}/></label>
        <button className="button outline" disabled={ocupado}>Rechazar cotización</button>
      </form></details>
    </>}
  </section>;
}
