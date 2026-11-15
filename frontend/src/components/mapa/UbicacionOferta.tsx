'use client';

import dynamic from 'next/dynamic';
import Icono from '@/components/descubrimiento/Icono';
import { enGoogleMaps } from './Mapa';

// Leaflet solo funciona en el navegador.
const Mapa = dynamic(() => import('./Mapa'), { ssr: false, loading: () => <div className="q-mapa" style={{ height: 260 }} aria-hidden="true"/> });

/** Mapa público de una oferta (011): punto exacto si es un local, o zona de 100 m si el proveedor lo prefirió. */
export default function UbicacionOferta({ ubicacion, distrito, titulo }: { ubicacion: { lat: number; lng: number; precision: 'exacta' | 'aproximada' }; distrito: string; titulo: string }) {
  const exacta = ubicacion.precision === 'exacta';
  return <section className="detail-section" aria-labelledby="titulo-ubicacion">
    <h2 id="titulo-ubicacion">Ubicación</h2>
    <Mapa puntos={[{ ...ubicacion, titulo }]} etiqueta={`Mapa de la ubicación en ${distrito}`} alto={260}/>
    <p className="q-mapa-nota"><Icono nombre="pin" size={16}/>{exacta
      ? `Ubicación exacta del local en ${distrito}.`
      : `Ubicación casi exacta en ${distrito}: el punto está a menos de 100 m. Verás el lugar exacto cuando el proveedor acepte tu solicitud.`}</p>
    {exacta && <p className="q-mapa-enlaces"><a href={enGoogleMaps(ubicacion)} target="_blank" rel="noopener noreferrer">Cómo llegar en Google Maps</a></p>}
  </section>;
}
