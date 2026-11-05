'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icono from '@/components/descubrimiento/Icono';
import { EVENTO_AVISOS } from '@/lib/api/avisos';
import { apiJson } from '@/lib/api/http';

const CADA_MS = 60000;

/** Sin sesión o sin servicio no muestra nada: la consulta falla en silencio y la cabecera sigue igual. */
export default function CampanaAvisos() {
  const [noLeidos, setNoLeidos] = useState<number | null>(null);
  const ruta = usePathname();
  useEffect(() => {
    let vigente = true;
    const consultar = () => {
      if (document.hidden) return;
      apiJson<{ noLeidos: number }>('/avisos/resumen').then(r => { if (vigente) setNoLeidos(r.noLeidos); }).catch(() => { if (vigente) setNoLeidos(null); });
    };
    consultar();
    const reloj = setInterval(consultar, CADA_MS);
    window.addEventListener(EVENTO_AVISOS, consultar);
    document.addEventListener('visibilitychange', consultar);
    return () => { vigente = false; clearInterval(reloj); window.removeEventListener(EVENTO_AVISOS, consultar); document.removeEventListener('visibilitychange', consultar); };
  }, [ruta]);
  if (noLeidos === null) return null;
  return <Link className="q-campana" href="/avisos" aria-label={noLeidos ? `Avisos, ${noLeidos} sin leer` : 'Avisos'}>
    <Icono nombre="bell" size={20}/>
    {noLeidos > 0 && <span className="q-campana-cuenta" aria-hidden="true">{noLeidos > 99 ? '99+' : noLeidos}</span>}
  </Link>;
}
