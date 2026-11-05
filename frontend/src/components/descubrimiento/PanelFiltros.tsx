'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icono from './Icono';

// En escritorio es una columna fija; en móvil se abre como drawer lateral.
export default function PanelFiltros({ children, activos, criterios }: { children: React.ReactNode; activos: number; criterios: string }) {
  const [abierto, setAbierto] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => { setAbierto(false); }, [criterios]);

  useEffect(() => {
    if (!abierto) return;
    document.body.classList.add('drawer-open');
    panel.current?.querySelector<HTMLElement>('.filter-close')?.focus();
    const alPulsar = (event: KeyboardEvent) => { if (event.key === 'Escape') { setAbierto(false); boton.current?.focus(); } };
    document.addEventListener('keydown', alPulsar);
    return () => { document.body.classList.remove('drawer-open'); document.removeEventListener('keydown', alPulsar); };
  }, [abierto]);

  return <>
    <button ref={boton} type="button" className="filter-toggle" aria-expanded={abierto} aria-controls="panel-filtros" onClick={() => setAbierto(true)}>
      <Icono nombre="sliders" size={18}/>Buscar y filtrar{activos > 0 && <span className="filter-count" aria-label={activos + ' filtros activos'}>{activos}</span>}
    </button>
    <div className={'filter-backdrop' + (abierto ? ' open' : '')} onClick={() => setAbierto(false)} aria-hidden="true"/>
    <aside ref={panel} id="panel-filtros" className={'filter-panel' + (abierto ? ' open' : '')} aria-label="Filtros de búsqueda">
      <div className="filter-title"><strong><Icono nombre="sliders" size={18}/> Afina tu búsqueda</strong><Link href="/buscar">Limpiar</Link><button type="button" className="icon-button filter-close" aria-label="Cerrar filtros" onClick={() => { setAbierto(false); boton.current?.focus(); }}><Icono nombre="close" size={20}/></button></div>
      {children}
    </aside>
  </>;
}
