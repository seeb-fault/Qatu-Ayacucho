'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { enGoogleMaps, enOpenStreetMap } from '@/components/mapa/Mapa';
import { apiJson } from '@/lib/api/http';
import { fechaReserva, type SolicitudReserva } from '@/lib/api/reservas';
import styles from './reservas.module.css';

/** Mismos momentos que el backend (010): desde el compromiso hasta que la operación termina. */
const ACTIVOS = new Set(['VISITA_ACORDADA', 'ACEPTADA', 'APARTADO_PAGADO', 'ENTREGA_POR_CONFIRMAR', 'EN_CURSO', 'DEVOLUCION_PENDIENTE',
  'SERVICIO_CONFIRMADO', 'SERVICIO_EN_CURSO', 'SERVICIO_POR_CONFIRMAR', 'SERVICIO_POR_PAGAR']);
export const puedeCoordinar = (s: SolicitudReserva) => ACTIVOS.has(s.estado) || (s.estado === 'PENDIENTE' && (s.cotizaciones?.length ?? 0) > 0);

interface Contacto { rol: 'cliente' | 'proveedor'; nombre: string; whatsapp: string | null; ubicacion?: { lat: number; lng: number } | null }

const Mapa = dynamic(() => import('@/components/mapa/Mapa'), { ssr: false, loading: () => <div className="q-mapa" style={{ height: 200 }} aria-hidden="true"/> });

function mensaje(s: SolicitudReserva) {
  const que = s.tipoSolicitud === 'visita' ? 'la visita para ver' : s.snapshot.tipo === 'servicio' ? 'el servicio' : 'el alquiler de';
  return `Hola, te escribo desde Qatu por ${que} «${s.snapshot.titulo}» (${fechaReserva(s.inicio)} – ${fechaReserva(s.fin)}). ¿Coordinamos los detalles?`;
}

/** Enlace a WhatsApp de la otra parte, con el mensaje ya escrito. El número solo llega si su dueño consintió mostrarlo. */
export default function CoordinarWhatsapp({ solicitud: s }: { solicitud: SolicitudReserva }) {
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const activo = puedeCoordinar(s);
  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    apiJson<Contacto>('/reservas/' + s.id + '/contacto').then(c => { if (vigente) setContacto(c); }).catch(() => { if (vigente) setContacto(null); });
    return () => { vigente = false; };
  }, [s.id, s.estado, activo]);
  if (!activo || !contacto) return null;
  const otro = contacto.rol === 'proveedor' ? 'el proveedor' : 'el cliente';
  return <div className={styles.whatsapp} aria-label="Coordinar por WhatsApp y ubicación">
    {contacto.whatsapp
      ? <a className={styles.botonWhatsapp} href={`https://wa.me/${contacto.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje(s))}`} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z"/></svg>
          Escribir a {contacto.nombre} por WhatsApp
        </a>
      : <p className={styles.hint}>{contacto.nombre} aún no comparte su WhatsApp. Coordina con {otro} desde esta solicitud.</p>}
    {contacto.ubicacion && <div className={styles.punto}>
      <strong>{s.snapshot.tipo === 'herramienta' ? 'Punto exacto de recojo' : 'Ubicación del proveedor'}</strong>
      <Mapa puntos={[{ ...contacto.ubicacion, precision: 'exacta', titulo: s.snapshot.titulo }]} etiqueta={'Mapa del punto exacto de ' + s.snapshot.titulo} alto={200} zoom={17}/>
      <p className="q-mapa-enlaces"><a href={enGoogleMaps(contacto.ubicacion)} target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a><a href={enOpenStreetMap(contacto.ubicacion)} target="_blank" rel="noopener noreferrer">Ver en OpenStreetMap</a></p>
    </div>}
    <p className={styles.hint}>Coordina por WhatsApp, pero confirma en Qatu los cambios de fecha, la entrega y el pago: lo que solo se acuerde por chat no cuenta para un reclamo.</p>
  </div>;
}
