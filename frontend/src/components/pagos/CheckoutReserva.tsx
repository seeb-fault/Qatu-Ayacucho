'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icono from '@/components/descubrimiento/Icono';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { dinero, fechaReserva, type SolicitudReserva } from '@/lib/api/reservas';
import type { Usuario } from '@/lib/api/usuarios';
import { EstadoPago, importePendiente, useConfiguracionPagos, usePagoCulqi, type MetodoEnLinea } from './PagoEnLinea';
import styles from './checkout.module.css';

type Metodo = MetodoEnLinea | 'efectivo';
type Estado = { tipo: 'cargando' } | { tipo: 'error'; mensaje: string; sesion: boolean } | { tipo: 'listo'; reserva: SolicitudReserva; usuario: Usuario; imagen: string | null };

const metodos: { id: Metodo; nombre: string; detalle: string }[] = [
  { id: 'tarjeta', nombre: 'Tarjeta', detalle: 'Visa o Mastercard' },
  { id: 'yape', nombre: 'Yape', detalle: 'Desde tu celular' },
  { id: 'efectivo', nombre: 'Efectivo', detalle: 'Al proveedor' },
];

function Logo({ metodo }: { metodo: Metodo }) {
  if (metodo === 'tarjeta') return <span className={styles.logoTarjeta} aria-hidden="true"><i/><i/><b>VISA</b></span>;
  if (metodo === 'yape') return <span className={styles.logoYape} aria-hidden="true">yape</span>;
  return <span className={styles.logoEfectivo} aria-hidden="true">S/</span>;
}

/** Página de pago de una reserva: datos, reserva y método a la izquierda; resumen y pago a la derecha. */
export default function CheckoutReserva({ id }: { id: string }) {
  const router = useRouter();
  const config = useConfiguracionPagos();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [metodo, setMetodo] = useState<Metodo>('tarjeta');
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [reserva, usuario] = await Promise.all([apiJson<SolicitudReserva>('/reservas/' + encodeURIComponent(id)), apiJson<Usuario>('/usuarios/me')]);
      const publicacion = await apiJson<{ imagen: string | null }>('/publicaciones/' + encodeURIComponent(reserva.publicacionId)).catch(() => null);
      setEstado({ tipo: 'listo', reserva, usuario, imagen: publicacion?.imagen ?? null });
      return reserva;
    } catch (e) {
      const sesion = e instanceof ErrorApi && e.status === 401;
      setEstado({ tipo: 'error', sesion, mensaje: sesion ? 'Inicia sesión para pagar tu reserva.' : e instanceof ErrorApi && e.status === 404 ? 'Esta reserva no está disponible.' : 'No pudimos cargar tu reserva. Intenta nuevamente.' });
      return null;
    }
  }, [id]);
  useEffect(() => { void cargar(); }, [cargar]);

  const reserva = estado.tipo === 'listo' ? estado.reserva : null;
  const importe = reserva ? importePendiente(reserva) : null;
  const { pagar, procesando, error } = usePagoCulqi(id, importe ?? 0, config?.llavePublica ?? null, async () => {
    const actual = await cargar();
    if (actual?.ultimoPago?.estado === 'APROBADO' && !actual.ultimoPago.reembolsoPendiente) router.push('/reservas');
  });

  if (estado.tipo === 'cargando') return <div className={styles.pagina}><p className={styles.cargando} role="status">Cargando tu reserva…</p></div>;
  if (estado.tipo === 'error') return <div className={styles.pagina}><div className={styles.vacio}><h1>Pagar reserva</h1><p role="alert">{estado.mensaje}</p>{estado.sesion ? <Link className="button primary" href="/ingresar">Iniciar sesión</Link> : <Link className="button outline" href="/reservas">Volver a mis reservas</Link>}</div></div>;

  const { reserva: s, usuario, imagen } = estado;
  const servicio = s.snapshot.tipo === 'servicio';
  const acordada = s.cotizaciones?.find(c => c.respuesta?.decision === 'ACEPTADA');
  const enLinea = config?.disponible && config.llavePublica;

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso('');
    if (metodo === 'efectivo') { router.push('/reservas'); return; }
    void pagar(metodo);
  }

  const resumen = <>
    <div className={styles.imagen}>{imagen ? <Image src={imagen} alt="" width={320} height={240}/> : <Icono nombre={servicio ? 'hammer' : 'drill'} size={56}/>}</div>
    <h3 className={styles.producto}>{s.snapshot.titulo}</h3>
    <p className={styles.meta}><span>{servicio ? 'Oficio' : 'Herramienta'}</span>Por {s.snapshot.proveedor}</p>
    <dl className={styles.lineas}>
      {!servicio && s.condiciones && <><div><dt>Tarifa diaria</dt><dd>{dinero(s.condiciones.tarifaCentimos)}</dd></div><div><dt>Días</dt><dd>{s.condiciones.dias}</dd></div></>}
      {servicio && acordada && <div><dt>Cotización aceptada</dt><dd>{dinero(acordada.importeCentimos)}</dd></div>}
      <div><dt>Cargo por servicio</dt><dd className={styles.gratis}>Gratis</dd></div>
    </dl>
  </>;

  return <div className={styles.pagina}>
    <div className={styles.columnas}>
      <header className={styles.cabecera}><Link href="/reservas" className={styles.volver} aria-label="Volver a mis reservas"><Icono nombre="arrow" size={22} style={{ transform: 'rotate(180deg)' }}/></Link><h1>Pagar reserva</h1></header>
      <div className={styles.formulario}>

        <section aria-labelledby="paso-datos" className={styles.paso}>
          <h2 id="paso-datos"><span>1.</span> Tus datos</h2>
          <div className={styles.campos}>
            <div className={styles.campo}><span>Nombre</span><span className={styles.valor}>{usuario.nombre}<Icono nombre="check" size={16}/></span></div>
            <div className={styles.campo}><span>Correo electrónico</span><span className={styles.valor}>{usuario.email}<Icono nombre="check" size={16}/></span></div>
          </div>
          <p className={styles.nota}>Culqi enviará el comprobante a este correo. <Link href="/cuenta">Cambiar mis datos</Link></p>
        </section>

        <section aria-labelledby="paso-reserva" className={styles.paso}>
          <h2 id="paso-reserva"><span>2.</span> Tu reserva</h2>
          <div className={styles.pills} aria-hidden="true"><span className={servicio ? '' : styles.pillActiva}><Icono nombre="drill" size={18}/>Alquiler</span><span className={servicio ? styles.pillActiva : ''}><Icono nombre="hammer" size={18}/>Servicio</span></div>
          <div className={styles.campos}>
            <div className={styles.campo}><span>{servicio ? 'Inicio del trabajo' : 'Desde'}</span><span className={styles.valor}>{fechaReserva(s.inicio)}<Icono nombre="calendar" size={16}/></span></div>
            <div className={styles.campo}><span>{servicio ? 'Fin estimado' : 'Hasta'}</span><span className={styles.valor}>{fechaReserva(s.fin)}<Icono nombre="calendar" size={16}/></span></div>
            <div className={styles.campo}><span>{servicio ? 'Proveedor' : 'Herramienta'}</span><span className={styles.valor}>{servicio ? s.snapshot.proveedor : s.snapshot.recurso}</span></div>
            <div className={styles.campo}><span>Tolerancia</span><span className={styles.valor}>{s.condiciones ? `${s.condiciones.toleranciaMinutos} min para devolver` : 'Según la cotización'}</span></div>
          </div>
          {servicio && acordada && <p className={styles.nota}><strong>Alcance:</strong> {acordada.alcance}</p>}
        </section>

        <section aria-labelledby="paso-pago" className={styles.paso}>
          <h2 id="paso-pago"><span>3.</span> Método de pago</h2>
          <div className={styles.metodos} role="radiogroup" aria-labelledby="paso-pago">
            {metodos.map(m => {
              const deshabilitado = m.id !== 'efectivo' && !enLinea;
              return <label key={m.id} className={styles.metodo + (metodo === m.id ? ' ' + styles.metodoActivo : '')}>
                <input type="radio" name="metodo" value={m.id} checked={metodo === m.id} disabled={deshabilitado} onChange={() => setMetodo(m.id)}/>
                <Logo metodo={m.id}/><strong>{m.nombre}</strong><small>{m.detalle}</small>
              </label>;
            })}
          </div>
          <div className={styles.instrucciones} key={metodo} aria-live="polite">
            {metodo === 'tarjeta' && <p><Icono nombre="shield" size={18}/>Ingresarás tu tarjeta en la ventana segura de Culqi. Qatu nunca ve ni guarda sus datos.</p>}
            {metodo === 'yape' && <p><Icono nombre="shield" size={18}/>Se abrirá Culqi: escribe tu número de celular y el código de aprobación que ves en tu app de Yape.</p>}
            {metodo === 'efectivo' && <p><Icono nombre="info" size={18}/>{servicio ? 'Paga al proveedor al terminar el trabajo; él registrará el pago en Qatu.' : 'Paga al proveedor cuando te entregue la herramienta; él registrará el pago en Qatu.'}{s.venceEn && !servicio ? ` Tu reserva se mantiene hasta el ${fechaReserva(s.venceEn)}.` : ''}</p>}
            {metodo !== 'efectivo' && <p className={styles.prueba}><strong>Modo de prueba:</strong> no se realizan cobros reales. Usa solo datos de prueba.</p>}
          </div>
        </section>
      </div>

      <aside className={styles.resumen} aria-labelledby="resumen-titulo">
        <div className={styles.tarjetaResumen}>
        <div className={styles.resumenCabecera}>
          <h2 id="resumen-titulo">Tu reserva</h2>
          <button type="button" className={styles.desplegar} aria-expanded={resumenAbierto} aria-controls="resumen-detalle" onClick={() => setResumenAbierto(a => !a)}>{resumenAbierto ? 'Ocultar detalle' : 'Ver detalle'}<Icono nombre="down" size={16}/></button>
        </div>
        <div id="resumen-detalle" className={styles.detalle + (resumenAbierto ? ' ' + styles.detalleAbierto : '')}>{resumen}</div>
        <EstadoPago solicitud={s}/>
        </div>
        {importe === null
          ? <div className={styles.sinPago}><p>Esta reserva no tiene pagos pendientes.</p><Link className="button outline" href="/reservas">Volver a mis reservas</Link></div>
          : <form onSubmit={enviar} onInvalid={() => setAviso('Marca la casilla para confirmar el pago.')} className={styles.pagar}>
            <div className={styles.total}><span>Total</span><strong>{dinero(importe)}</strong></div>
            <button className={'button primary ' + styles.boton} disabled={procesando}>{procesando ? 'Procesando…' : metodo === 'efectivo' ? 'Pagaré en efectivo' : `Pagar ${dinero(importe)} en línea`}{!procesando && <Icono nombre="arrow" size={18}/>}</button>
            <label className={styles.acepto}><input type="checkbox" required onChange={() => setAviso('')}/>{metodo === 'efectivo' ? `Acepto pagar ${dinero(importe)} en efectivo según las condiciones de esta reserva.` : `Acepto pagar ${dinero(importe)} por esta reserva según las condiciones mostradas.`}</label>
            {(aviso || error) && <p role="alert" className={styles.error}>{aviso || error}</p>}
            <p className={styles.seguro}><Icono nombre="shield" size={15}/>Pago procesado por Culqi</p>
          </form>}
      </aside>
    </div>
  </div>;
}
