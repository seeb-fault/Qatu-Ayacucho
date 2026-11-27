'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { urlBusqueda } from '@/lib/catalogo';
import Icono from './Icono';

// Resultados ya tiene su propio buscador en el panel de filtros; se evita duplicar el campo.
const rutasConBuscador = ['/buscar'];

// En computadora el campo se ve siempre. En celular (≤ 767 px) se muestra solo una lupa junto a la cuenta;
// al tocarla, el campo cubre la fila del encabezado y se cierra con la X, con Escape o al buscar.
export default function BuscadorCabecera() {
  const router = useRouter();
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const lupa = useRef<HTMLButtonElement>(null);

  useEffect(() => { setAbierto(false); }, [pathname]);
  useEffect(() => { if (abierto) campo.current?.focus(); }, [abierto]);

  if (rutasConBuscador.includes(pathname)) return <div className="header-search-spacer" aria-hidden="true"/>;

  const cerrar = () => { setAbierto(false); lupa.current?.focus(); };

  return <>
    <button ref={lupa} type="button" className="header-search-toggle" aria-label="Buscar en Qatu" aria-expanded={abierto} aria-controls="buscador-cabecera" onClick={() => setAbierto(true)}>
      <Icono nombre="search" size={19}/>
    </button>
    <form id="buscador-cabecera" className={abierto ? 'header-search is-abierto' : 'header-search'} role="search" aria-label="Buscar en Qatu"
      onKeyDown={event => { if (event.key === 'Escape' && abierto) cerrar(); }}
      onSubmit={event => {
        event.preventDefault();
        const q = String(new FormData(event.currentTarget).get('q') ?? '').trim();
        setAbierto(false);
        router.push(urlBusqueda({ q }));
      }}>
      <input ref={campo} name="q" type="search" placeholder="Busca herramientas u oficios en Ayacucho…" aria-label="Qué estás buscando" maxLength={200}/>
      <button type="submit" aria-label="Buscar"><Icono nombre="search" size={17}/></button>
      <button type="button" className="header-search-close" aria-label="Cerrar el buscador" onClick={cerrar}><Icono nombre="close" size={18}/></button>
    </form>
  </>;
}
