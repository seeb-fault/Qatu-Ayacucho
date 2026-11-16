'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Icono from '@/components/descubrimiento/Icono';
import type { Oferta } from '@/lib/catalogo';

const Mapa = dynamic(() => import('./Mapa'), { ssr: false, loading: () => <div className="q-mapa" style={{ height: 380 }} aria-hidden="true"/> });

/** «Ver en el mapa» en los resultados (011): solo ofertas con ubicación, con su punto público. */
export default function MapaResultados({ ofertas }: { ofertas: Oferta[] }) {
  const [abierto, setAbierto] = useState(false);
  const conUbicacion = ofertas.filter(o => o.ubicacion);
  if (!conUbicacion.length) return null;
  return <div className="q-mapa-resultados">
    <button type="button" className="button outline small" aria-expanded={abierto} aria-controls="mapa-resultados" onClick={() => setAbierto(a => !a)}>
      <Icono nombre="pin" size={16}/>{abierto ? 'Ocultar mapa' : `Ver en el mapa (${conUbicacion.length})`}
    </button>
    {abierto && <div id="mapa-resultados">
      <Mapa puntos={conUbicacion.map(o => ({ ...o.ubicacion!, titulo: o.titulo, href: '/publicaciones/' + o.id }))} etiqueta="Mapa de los resultados de la búsqueda" alto={380} zoom={15}/>
      <p className="q-mapa-nota"><Icono nombre="info" size={16}/>Los círculos marcan ubicaciones casi exactas (a menos de 100 m); los pines, locales con ubicación exacta.</p>
    </div>}
  </div>;
}
