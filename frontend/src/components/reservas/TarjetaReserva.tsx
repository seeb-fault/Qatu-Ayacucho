'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { dinero, fechaReserva, type SolicitudReserva } from '@/lib/api/reservas';
import styles from './reservas.module.css';
import CotizacionesServicio from './CotizacionesServicio';
import ResenaReserva from '../resenas/ResenaReserva';
import EvidenciasReserva from '../resenas/EvidenciasReserva';
import { ESTADOS_CERRADOS } from '@/lib/api/resenas';
import PagoEnLinea, { EstadoPago, useConfiguracionPagos } from '../pagos/PagoEnLinea';

const estados: Record<SolicitudReserva['estado'], string> = {
  PENDIENTE:'Pendiente de respuesta',RECHAZADA:'Rechazada',VISITA_ACORDADA:'Visita acordada',ACEPTADA:'Herramienta apartada',
  VENCIDA:'Apartado vencido',CANCELADA:'Cancelada',ENTREGA_POR_CONFIRMAR:'Entrega pendiente de confirmación',EN_CURSO:'Alquiler en curso',
  DEVOLUCION_PENDIENTE:'Devolución pendiente de confirmación',DEVUELTA:'Herramienta devuelta',SERVICIO_CONFIRMADO:'Servicio confirmado',
  SERVICIO_EN_CURSO:'Trabajo en curso',SERVICIO_POR_CONFIRMAR:'Término pendiente de confirmación',SERVICIO_CERRADO:'Servicio cerrado',
  APARTADO_PAGADO:'Herramienta apartada y pagada',SERVICIO_POR_PAGAR:'Trabajo terminado, pendiente de pago',
};
type Props = { solicitud: SolicitudReserva; ocupado: boolean; operar: (s: SolicitudReserva, accion: string, datos?: Record<string,unknown>) => Promise<void>; recargar: () => Promise<void> };

export default function TarjetaReserva({solicitud:s,ocupado,operar,recargar}: Props) {
  const pagos = useConfiguracionPagos();
  const proveedor = s.participacion === 'proveedor';
  const acordada = s.cotizaciones?.find(c => c.respuesta?.decision === 'ACEPTADA');
  const cotizacionAceptada = Boolean(acordada);
  const enviar = (accion:string,motivo=false) => (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form=new FormData(e.currentTarget);
    void operar(s,accion,motivo ? {motivo:form.get('motivo')} : undefined);
  };
  const textoWhatsApp = `Hola, quiero coordinar ${s.tipoSolicitud === 'visita' ? 'la visita' : 'el alquiler'} de ${s.snapshot.titulo}. Inicio: ${fechaReserva(s.inicio)}; fin: ${fechaReserva(s.fin)} (Lima). Referencia: ${s.id}. Coordinemos retiro y devolución; confirma los estados en Qatu.`;
  return <article className={styles.card} aria-label={s.snapshot.titulo}>
    <span className={styles.status}>{s.estado === 'PENDIENTE' && cotizacionAceptada ? 'Cotización acordada; agenda por coordinar' : estados[s.estado]}</span><h2>{s.snapshot.titulo}</h2>
    <p>{s.tipoSolicitud === 'visita' ? 'Visita previa, sin apartado' : 'Solicitud de alquiler o servicio'} · Proveedor: {s.snapshot.proveedor}</p>
    <dl><dt>Unidad / agenda</dt><dd>{s.snapshot.recurso}</dd><dt>Inicio</dt><dd>{fechaReserva(s.inicio)}</dd><dt>Fin acordado</dt><dd>{fechaReserva(s.fin)}</dd></dl>
    <p className={styles.hint}>Fechas en hora de Lima. Referencia: {s.id}</p>
    {s.descripcionTrabajo && <p>{s.descripcionTrabajo}</p>}
    {s.snapshot.tipo === 'servicio' && s.tipoSolicitud === 'alquiler' && <CotizacionesServicio solicitud={s} ocupado={ocupado} operar={operar}/>}
    {s.condiciones && <div className={styles.notice}>
      <p><strong>{dinero(s.condiciones.importeCentimos)}</strong> por {s.condiciones.dias} {s.condiciones.dias === 1 ? 'día' : 'días'}, a {dinero(s.condiciones.tarifaCentimos)} por bloque de 24 horas iniciado.</p>
      <p className={styles.hint}>Efectivo al recoger. Tolerancia de devolución: 30 minutos; después se suma un día por bloque adicional iniciado. El fin acordado no cambia por recoger tarde.</p>
    </div>}
    {!proveedor && s.estado === 'ACEPTADA' && s.condiciones && <PagoEnLinea solicitud={s} importe={s.condiciones.importeCentimos} config={pagos} ocupado={ocupado} alTerminar={recargar}/>}
    {s.venceEn && <p><strong>Acércate antes de: {fechaReserva(s.venceEn)}.</strong> Si vence sin registro de efectivo, la unidad se libera. Actualiza la bandeja para comprobar el estado.</p>}
    <EstadoPago solicitud={s}/>
    {s.pagoEstado === 'PAGADO_EN_LINEA' && <p>Pagado en línea: {dinero(s.pagadoEnLineaCentimos)}. Modo de prueba, sin cobro real.</p>}
    {s.pagoEstado === 'REGISTRADO_PROVEEDOR' && <p>El proveedor declara haber recibido {dinero(s.efectivoCentimos)} y {s.snapshot.tipo === 'servicio' ? 'terminado el trabajo' : 'entregado la herramienta'}. Falta la confirmación del cliente.</p>}
    {s.pagoEstado === 'CONFIRMADO_PARTICIPANTES' && <p>{s.snapshot.tipo === 'servicio' ? 'Efectivo' : 'Efectivo inicial'} confirmado por ambos participantes: {dinero(s.efectivoCentimos)}.</p>}
    {s.devolucionInformadaEn && <p>El cliente informa devolución a las {fechaReserva(s.devolucionInformadaEn)}.</p>}
    {s.condiciones && s.importeFinalCentimos !== null && <p><strong>Importe final: {dinero(s.importeFinalCentimos)}.</strong> {s.diasExtra} días adicionales. {s.saldoCentimos > 0 ? `Saldo por coordinar: ${dinero(s.saldoCentimos)}; todavía no se registra como cobrado.` : 'Sin saldo adicional.'}</p>}
    {s.motivoRechazo && <p><strong>Motivo del rechazo:</strong> {s.motivoRechazo}</p>}
    {s.motivoOperacion && <p><strong>Última coordinación:</strong> {s.motivoOperacion}</p>}
    {s.estado === 'PENDIENTE' && <p>Esta solicitud todavía no bloquea fechas.</p>}
    {s.estado === 'SERVICIO_CONFIRMADO' && <p>Horario reservado para esta agenda. No se exige anticipo ni se ha registrado un pago. Cualquiera de los dos puede cancelar con motivo mientras el trabajo no se haya iniciado.</p>}
    {s.servicioIniciadoEn && <p>El proveedor registró el inicio del trabajo: {fechaReserva(s.servicioIniciadoEn)}</p>}
    {s.estado === 'SERVICIO_CERRADO' && s.servicioCerradoEn && <p>Trabajo cerrado por ambos participantes: {fechaReserva(s.servicioCerradoEn)}</p>}
    {s.estado === 'VENCIDA' && <p>El apartado se liberó. Necesitas solicitar nuevamente para volver a coordinar.</p>}
    {['PENDIENTE','VISITA_ACORDADA','ACEPTADA','SERVICIO_CONFIRMADO'].includes(s.estado) && <p><a href={'https://wa.me/?text='+encodeURIComponent(textoWhatsApp)} target="_blank" rel="noopener noreferrer">Compartir coordinación por WhatsApp</a><span className={styles.hint}> · Tú eliges el destinatario. Esto no confirma pagos ni apartados.</span></p>}
    {!['PENDIENTE','RECHAZADA','VISITA_ACORDADA','ACEPTADA','VENCIDA','CANCELADA','APARTADO_PAGADO','SERVICIO_CONFIRMADO'].includes(s.estado) && <EvidenciasReserva reservaId={s.id}/>}
    {ESTADOS_CERRADOS.includes(s.estado) && <ResenaReserva reservaId={s.id} esCliente={s.participacion === 'cliente'}/>}
    {['VISITA_ACORDADA','VENCIDA','CANCELADA','RECHAZADA','DEVUELTA','SERVICIO_CERRADO'].includes(s.estado) && <p><Link href={'/reservas/nueva?publicacion='+s.publicacionId}>Hacer una nueva solicitud de esta oferta</Link></p>}

    {proveedor && s.estado === 'PENDIENTE' && !cotizacionAceptada && <>
      {s.tipoSolicitud === 'alquiler' && s.snapshot.tipo === 'herramienta' && s.condiciones && <><button className="button primary" disabled={ocupado} onClick={() => {void operar(s,'aceptacion');}}>Aceptar y apartar 60 minutos</button><p className={styles.hint}>Hazlo cuando el cliente pueda acercarse durante la siguiente hora. La disponibilidad se vuelve a comprobar.</p></>}
      {s.tipoSolicitud === 'alquiler' && !s.condiciones && s.snapshot.tipo === 'herramienta' && <p className={styles.hint}>Esta solicitud es anterior a las condiciones diarias; el cliente debe solicitar nuevamente para aceptarlas.</p>}
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
    {proveedor && s.estado === 'SERVICIO_CONFIRMADO' && (Date.parse(s.inicio) <= Date.now()
      ? <form className={styles.form} onSubmit={enviar('servicio/inicio')} aria-label="Registrar inicio del trabajo"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Confirmo que empecé el trabajo acordado</label><button className="button primary" disabled={ocupado}>Registrar inicio del trabajo</button></form>
      : <p className={styles.hint}>Podrás registrar el inicio del trabajo desde la hora acordada.</p>)}
    {proveedor && s.estado === 'APARTADO_PAGADO' && <form className={styles.form} onSubmit={enviar('entrega')} aria-label="Registrar entrega"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Entregué la herramienta al cliente</label><button className="button primary" disabled={ocupado}>Registrar entrega</button></form>}
    {proveedor && s.estado === 'SERVICIO_EN_CURSO' && pagos?.disponible && <form className={styles.form} onSubmit={enviar('servicio/cobro')} aria-label="Solicitar pago en línea"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Terminé el trabajo y el cliente pagará en línea</label><button className="button outline" disabled={ocupado}>Solicitar pago en línea</button></form>}
    {proveedor && s.estado === 'SERVICIO_POR_PAGAR' && acordada && <><p className={styles.hint}>El cliente debe pagar {dinero(acordada.importeCentimos)} en línea. Si prefiere efectivo, puedes registrarlo aquí.</p><form className={styles.form} onSubmit={enviar('servicio/termino')} aria-label="Declarar trabajo terminado"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Recibí {dinero(acordada.importeCentimos)} en efectivo</label><button className="button outline" disabled={ocupado}>Registrar pago en efectivo</button></form></>}
    {!proveedor && s.estado === 'SERVICIO_POR_PAGAR' && acordada && <>
      <PagoEnLinea solicitud={s} importe={acordada.importeCentimos} config={pagos} ocupado={ocupado} alTerminar={recargar}/>
      <details><summary>El trabajo aún no terminó</summary><form className={styles.form} onSubmit={enviar('servicio/rechazo',true)}><label>Motivo para rechazar el término<textarea name="motivo" required minLength={10} maxLength={500} disabled={ocupado}/></label><button className="button outline" disabled={ocupado}>Rechazar término</button></form></details>
    </>}
    {proveedor && s.estado === 'SERVICIO_EN_CURSO' && acordada && <form className={styles.form} onSubmit={enviar('servicio/termino')} aria-label="Declarar trabajo terminado"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Confirmo que terminé el trabajo y recibí {dinero(acordada.importeCentimos)} en efectivo</label><button className="button primary" disabled={ocupado}>Declarar trabajo terminado</button></form>}
    {!proveedor && s.estado === 'SERVICIO_EN_CURSO' && <p className={styles.hint}>El proveedor declarará el término al finalizar; podrás confirmarlo o rechazarlo aquí.</p>}
    {!proveedor && s.estado === 'SERVICIO_POR_CONFIRMAR' && <>
      <form className={styles.form} onSubmit={enviar('servicio/confirmacion')} aria-label="Confirmar trabajo y pago"><label className={styles.check}><input type="checkbox" required disabled={ocupado}/>Confirmo que el trabajo terminó y pagué {dinero(s.efectivoCentimos)} en efectivo</label><button className="button primary" disabled={ocupado}>Confirmar trabajo y pago</button></form>
      <details><summary>El trabajo aún no terminó</summary><form className={styles.form} onSubmit={enviar('servicio/rechazo',true)}><label>Motivo para rechazar el término<textarea name="motivo" required minLength={10} maxLength={500} disabled={ocupado}/></label><button className="button outline" disabled={ocupado}>Rechazar término</button></form></details>
    </>}
    {((!proveedor && s.estado === 'PENDIENTE') || ['VISITA_ACORDADA','ACEPTADA','SERVICIO_CONFIRMADO','APARTADO_PAGADO'].includes(s.estado)) && <details><summary>Cancelar {['ACEPTADA','APARTADO_PAGADO'].includes(s.estado) ? 'apartado' : s.estado === 'SERVICIO_CONFIRMADO' ? 'servicio' : 'solicitud'}</summary><form className={styles.form} onSubmit={enviar('cancelacion',true)}><label>Motivo de cancelación<textarea name="motivo" required minLength={10} maxLength={500} disabled={ocupado}/></label>{s.estado === 'APARTADO_PAGADO' && <p className={styles.hint}>El pago quedará pendiente de reembolso, que se gestiona manualmente.</p>}<button className="button outline" disabled={ocupado}>Confirmar cancelación</button></form></details>}
  </article>;
}
