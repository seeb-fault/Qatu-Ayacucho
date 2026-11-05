'use client';

import { usePathname, useRouter } from 'next/navigation';
import { urlBusqueda } from '@/lib/catalogo';
import Icono from './Icono';

// Resultados ya tiene su propio buscador en el panel de filtros; se evita duplicar el campo.
const rutasConBuscador = ['/buscar'];

export default function BuscadorCabecera() {
  const router = useRouter();
  const pathname = usePathname();
  if (rutasConBuscador.includes(pathname)) return <div className="header-search-spacer" aria-hidden="true"/>;
  return <form className="header-search" role="search" aria-label="Buscar en Qatu" onSubmit={event => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    router.push(urlBusqueda({ q }));
  }}>
    <Icono nombre="search" size={19}/>
    <input name="q" type="search" placeholder="Busca herramientas u oficios en Ayacucho…" aria-label="Qué estás buscando" maxLength={200}/>
    <button type="submit" aria-label="Buscar en Qatu"><Icono nombre="arrow" size={17}/></button>
  </form>;
}
