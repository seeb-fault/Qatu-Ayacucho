'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { dinero, fechaReserva, type SolicitudReserva } from '@/lib/api/reservas';
import styles from './reservas.module.css';

const estados: Record<SolicitudReserva['estado'], string> = {
  PENDIENTE:'Pendiente de respuesta',RECHAZADA:'Rechazada',VISITA_ACORDADA:'Visita acordada',ACEPTADA:'Apartada por 60 minutos',
  VENCIDA:'Apartado vencido',CANCELADA:'Cancelada',ENTREGA_POR_CONFIRMAR:'Entrega pendiente de confirmación',EN_CURSO:'Alquiler en curso',
  DEVOLUCION_PENDIENTE:'Devolución pendiente de confirmación',DEVUELTA:'Herramienta devuelta',
};
type Props = { solicitud: SolicitudReserva; ocupado: boolean; operar: (s: SolicitudReserva, accion: string, datos?: Record<string,unknown>) => Promise<void> };

export default function TarjetaReserva({solicitud:s,ocupado,operar}: Props) {
  const proveedor = s.participacion === 'proveedor';
  const enviar = (accion:string,motivo=false) => (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form=new FormData(e.currentTarget);
    void operar(s,accion,motivo ? {motivo:form.get('motivo')} : undefined);
  };
  const textoWhatsApp = `Hola, quiero coordinar ${s.tipoSolicitud === 'visita' ? 'la visita' : 'el alquiler'} de ${s.snapshot.titulo}. Inicio: ${fechaReserva(s.inicio)}; fin: ${fechaReserva(s.fin)} (Lima). Referencia: ${s.id}. Coordinemos retiro y devolución; confirma los estados en Qatu.`;
  return <article className={styles.card} aria-label={s.snapshot.titulo}>
    <span className={styles.status}>{estados[s.estado]}</span><h2>{s.snapshot.titulo}</h2>
    <p>{s.tipoSolicitud === 'visita' ? 'Visita previa, sin apartado' : 'Solicitud de alquiler o servicio'} · Proveedor: {s.snapshot.proveedor}</p>
    <dl><dt>Unidad / agenda</dt><dd>{s.snapshot.recurso}</dd><dt>Inicio</dt><dd>{fechaReserva(s.inicio)}</dd><dt>Fin acordado</dt><dd>{fechaReserva(s.fin)}</dd></dl>
    <p className={styles.hint}>Fechas en hora de Lima. Referencia: {s.id}</p>
    {s.descripcionTrabajo && <p>{s.descripcionTrabajo}</p>}
    {s.condiciones && <div className={styles.notice}>
      <p><strong>{dinero(s.condiciones.importeCentimos)}</strong> por {s.condiciones.dias} {s.condiciones.dias === 1 ? 'día' : 'días'}, a {dinero(s.condiciones.tarifaCentimos)} por bloque de 24 horas iniciado.</p>
      <p className={styles.hint}>Efectivo al recoger. Tolerancia de devolución: 30 minutos; después se suma un día por bloque adicional iniciado. El fin acordado no cambia por recoger tarde.</p>
    </div>}
    {s.venceEn && <p><strong>Acércate antes de: {fechaReserva(s.venceEn)}.</strong> Si vence sin registro de efectivo, la unidad se libera. Actualiza la bandeja para comprobar el estado.</p>}
    {s.pagoEstado === 'REGISTRADO_PROVEEDOR' && <p>El proveedor declara haber recibido {dinero(s.efectivoCentimos)} y entregado la herramienta. Falta la confirmación del cliente.</p>}
    {s.pagoEstado === 'CONFIRMADO_PARTICIPANTES' && <p>Efectivo inicial confirmado por ambos participantes: {dinero(s.efectivoCentimos)}.</p>}
    {s.devolucionInformadaEn && <p>El cliente informa devolución a las {fechaReserva(s.devolucionInformadaEn)}.</p>}
    {s.importeFinalCentimos !== null && <p><strong>Importe final: {dinero(s.importeFinalCentimos)}.</strong> {s.diasExtra} días adicionales. {s.saldoCentimos > 0 ? `Saldo por coordinar: ${dinero(s.saldoCentimos)}; todavía no se registra como cobrado.` : 'Sin saldo adicional.'}</p>}
    {s.motivoRechazo && <p><strong>Motivo del rechazo:</strong> {s.motivoRechazo}</p>}
    {s.motivoOperacion && <p><strong>Última coordinación:</strong> {s.motivoOperacion}</p>}
    {s.estado === 'PENDIENTE' && <p>Esta solicitud todavía no bloquea fechas.</p>}
    {s.estado === 'VENCIDA' && <p>El apartado se liberó. Necesitas solicitar nuevamente para volver a coordinar.</p>}
    {['PENDIENTE','VISITA_ACORDADA','ACEPTADA'].includes(s.estado) && <p><a href={'https://wa.me/?text='+encodeURIComponent(textoWhatsApp)} target="_blank" rel="noopener noreferrer">Compartir coordinación por WhatsApp</a><span className={styles.hint}> · Tú eliges el destinatario. Esto no confirma pagos ni apartados.</span></p>}
    {['VISITA_ACORDADA','VENCIDA','CANCELADA','RECHAZADA','DEVUELTA'].includes(s.estado) && <p><Link href={'/reservas/nueva?publicacion='+s.publicacionId}>Hacer una nueva solicitud de esta oferta</Link></p>}

    {proveedor && s.estado === 'PENDIENTE' && <>
      {s.tipoSolicitud === 'alquiler' && s.snapshot.tipo === 'herramienta' && s.condiciones && <><button className="button primary" disabled={ocupado} onClick={() => {void operar(s,'aceptacion');}}>Aceptar y apartar 60 minutos</button><p className={styles.hint}>Hazlo cuando el cliente pueda acercarse durante la siguiente hora. La disponibilidad se vuelve a comprobar.</p></>}
      {s.tipoSolicitud === 'alquiler' && !s.condiciones && <p className={styles.hint}>{s.snapshot.tipo === 'servicio' ? 'La cotización y aceptación de servicios se habilitarán después del flujo de herramientas.' : 'Esta solicitud es anterior a las condiciones diarias; el cliente debe solicitar nuevamente para aceptarlas.'}</p>}
      {s.tipoSolicitud === 'visita' && <form className={styles.form} onSubmit={enviar('visita',true)} aria-label="Acordar visita"><label>Indicaciones para la visita<textarea name="motivo" minLength={10} maxLength={500} required disabled={ocupado}/></label><button className="button primary" disabled={ocupado}>Acordar visita sin apartar</button></form>}
      <form className={styles.form} aria-label={'Responder '+s.snapshot.titulo} onSubmit={enviar('rechazo',true)}>
        <label>Motivo del rechazo<textarea name="motivo" minLength={10} maxLength={500} required rows={3} disabled={ocupado}/></label><button className="button outline" disabled={ocupado}>Rechazar solicitud</button>
      </form>
    </>}
    {proveedor && s.estado === 'ACEPTADA' && <>
      <form className={styles.form} onSubmit={enviar('efectivo')} aria-label="Registrar efectivo y entrega"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Confirmo que recibí {dinero(s.condiciones!.importeCentimos)} en efectivo y entregué la herramienta al cliente</label><button className="button primary" disabled={ocupado}>Registrar efectivo y entrega</button></form>
      <details><summary>Dar más tiempo para acercarse</summary><form className={styles.form} onSubmit={enviar('ampliacion',true)}><label>Motivo de ampliación<textarea name="motivo" required minLength={10} maxLength={500} disabled={ocupado}/></label><p className={styles.hint}>Hasta 60 minutos desde ahora, sin superar el fin acordado. Solo antes del vencimiento.</p><button className="button outline" disabled={ocupado}>Ampliar apartado</button></form></details>
    </>}
    {!proveedor && s.estado === 'ENTREGA_POR_CONFIRMAR' && <form className={styles.form} onSubmit={enviar('recepcion')} aria-label="Confirmar recepción"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Confirmo que pagué {dinero(s.efectivoCentimos)} en efectivo y recibí la herramienta</label><button className="button primary" disabled={ocupado}>Confirmar pago y recepción</button></form>}
    {!proveedor && s.estado === 'EN_CURSO' && <form className={styles.form} onSubmit={enviar('devolucion/aviso')} aria-label="Avisar devolución"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Ya devolví la herramienta al proveedor</label><button className="button primary" disabled={ocupado}>Avisar devolución</button></form>}
    {proveedor && s.estado === 'DEVOLUCION_PENDIENTE' && <>
      <form className={styles.form} onSubmit={enviar('devolucion/confirmacion')} aria-label="Confirmar devolución"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Recibí la herramienta y acepto la hora de devolución informada por el cliente</label><button className="button primary" disabled={ocupado}>Confirmar devolución</button></form>
      <details><summary>La herramienta aún no fue devuelta</summary><form className={styles.form} onSubmit={enviar('devolucion/rechazo',true)}><label>Motivo para rechazar la devolución<textarea name="motivo" required minLength={10} maxLength={500} disabled={ocupado}/></label><button className="button outline" disabled={ocupado}>Rechazar aviso de devolución</button></form></details>
    </>}
    {((!proveedor && s.estado === 'PENDIENTE') || ['VISITA_ACORDADA','ACEPTADA'].includes(s.estado)) && <details><summary>Cancelar {s.estado === 'ACEPTADA' ? 'apartado' : 'solicitud'}</summary><form className={styles.form} onSubmit={enviar('cancelacion',true)}><label>Motivo de cancelación<textarea name="motivo" required minLength={10} maxLength={500} disabled={ocupado}/></label><button className="button outline" disabled={ocupado}>Confirmar cancelación</button></form></details>}
  </article>;
}
