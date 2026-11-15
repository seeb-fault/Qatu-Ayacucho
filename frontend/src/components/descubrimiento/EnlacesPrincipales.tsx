'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

/** Inicio, Herramientas y Oficios; el actual se subraya en rojo. */
export default function EnlacesPrincipales() {
  const ruta = usePathname(), tipo = useSearchParams().get('tipo');
  const enlaces = [
    { href: '/', nombre: 'Inicio', actual: ruta === '/' },
    { href: '/buscar?tipo=herramienta', nombre: 'Herramientas', actual: ruta === '/buscar' && tipo === 'herramienta' },
    { href: '/buscar?tipo=servicio', nombre: 'Oficios', actual: ruta === '/buscar' && tipo === 'servicio' },
  ];
  return <>{enlaces.map(e => <Link key={e.nombre} href={e.href} className="nav-link" aria-current={e.actual ? 'page' : undefined}>{e.nombre}</Link>)}</>;
}
