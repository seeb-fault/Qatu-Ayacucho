'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { distritos, urlBusqueda } from '@/lib/catalogo';
import Icono from './Icono';

export default function MenuUbicacion() {
  const menu = useRef<HTMLDetailsElement>(null);
  const actual = useSearchParams().get('distrito');
  const distrito = actual && distritos.includes(actual) ? actual : '';

  useEffect(() => {
    function cerrar(event: MouseEvent | KeyboardEvent) {
      const detalles = menu.current;
      if (!detalles?.open) return;
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !detalles.contains(event.target as Node)) {
        detalles.open = false;
        if (event instanceof KeyboardEvent) detalles.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('click', cerrar);
    document.addEventListener('keydown', cerrar);
    return () => { document.removeEventListener('click', cerrar); document.removeEventListener('keydown', cerrar); };
  }, []);

  const cerrarMenu = () => { if (menu.current) menu.current.open = false; };
  return <details className="location-menu" ref={menu}>
    <summary aria-label={'Distrito: ' + (distrito || 'todo Ayacucho') + '. Cambiar distrito'}><Icono nombre="pin" size={18}/><span>{distrito || 'Ayacucho'}</span><Icono nombre="down" size={15}/></summary>
    <div className="location-options">
      <span className="location-options-title">Explorar por distrito</span>
      <Link href={urlBusqueda()} onClick={cerrarMenu} aria-current={!distrito ? 'true' : undefined}>Todo Ayacucho</Link>
      {distritos.map(d => <Link key={d} href={urlBusqueda({ distrito: d })} onClick={cerrarMenu} aria-current={d === distrito ? 'true' : undefined}>{d}</Link>)}
    </div>
  </details>;
}
