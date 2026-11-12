'use client';

import { usePathname } from 'next/navigation';

/** Pantallas de acceso y panel del proveedor: no llevan la cabecera ni el pie de la tienda. */
const SIN_MARCO = new Set(['/ingresar', '/registro']);
const esPanelProveedor = (ruta: string) => ruta === '/proveedor' || ruta.startsWith('/proveedor/');

export default function MarcoSitio({ cabecera, pie, children }: { cabecera: React.ReactNode; pie: React.ReactNode; children: React.ReactNode }) {
  const ruta = usePathname();
  const soloContenido = SIN_MARCO.has(ruta) || esPanelProveedor(ruta);
  return <>
    {!soloContenido && cabecera}
    <main id="contenido">{children}</main>
    {!soloContenido && pie}
  </>;
}
