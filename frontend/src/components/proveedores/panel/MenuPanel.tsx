'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icono from '@/components/descubrimiento/Icono';
import Marca from '@/components/descubrimiento/Marca';
import { EVENTO_AVISOS } from '@/lib/api/avisos';
import { apiJson } from '@/lib/api/http';
import styles from './panel.module.css';

const SECCIONES = [
  { href: '/proveedor', texto: 'Resumen', corto: 'Resumen', icono: 'grid' },
  { href: '/proveedor/solicitudes', texto: 'Solicitudes', corto: 'Solicitudes', icono: 'send' },
  { href: '/proveedor/ofertas', texto: 'Mis ofertas', corto: 'Ofertas', icono: 'box' },
  { href: '/proveedor/perfil', texto: 'Perfil y verificación', corto: 'Perfil', icono: 'shield' },
  { href: '/proveedor/avisos', texto: 'Avisos', corto: 'Avisos', icono: 'bell' },
];

export default function MenuPanel() {
  const ruta = usePathname();
  const [noLeidos, setNoLeidos] = useState(0);
  useEffect(() => {
    let vigente = true;
    const leer = () => apiJson<{ noLeidos: number }>('/avisos/resumen').then(r => { if (vigente) setNoLeidos(r.noLeidos); }).catch(() => { if (vigente) setNoLeidos(0); });
    void leer();
    window.addEventListener(EVENTO_AVISOS, leer);
    return () => { vigente = false; window.removeEventListener(EVENTO_AVISOS, leer); };
  }, [ruta]);

  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <div className={styles.barraMovil}><Marca/><Link href="/">Ver la tienda</Link></div>
    <nav className={styles.menu} aria-label="Panel del proveedor">
      <Marca/>
      <p className={styles.menuTitulo}>Panel del proveedor</p>
      <ul className={styles.enlaces}>
        {SECCIONES.map(s => <li key={s.href}>
          <Link className={styles.enlace} href={s.href} aria-current={ruta === s.href ? 'page' : undefined} aria-label={s.icono === 'bell' && noLeidos > 0 ? `${s.texto}, ${noLeidos} sin leer` : s.texto}>
            <Icono nombre={s.icono} size={20}/>
            <span aria-hidden="true" className={styles.textoLargo}>{s.texto}</span><span aria-hidden="true" className={styles.textoCorto}>{s.corto}</span>
            {s.icono === 'bell' && noLeidos > 0 && <span className={styles.contador} aria-hidden="true">{noLeidos}</span>}
          </Link>
        </li>)}
      </ul>
      <div className={styles.menuPie}>
        <Link className={styles.enlace} href="/"><Icono nombre="search" size={20}/>Ver la tienda</Link>
        <Link className={styles.enlace} href="/cuenta"><Icono nombre="user" size={20}/>Mi cuenta</Link>
      </div>
    </nav>
  </>;
}
