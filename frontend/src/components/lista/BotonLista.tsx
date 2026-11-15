'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icono from '@/components/descubrimiento/Icono';
import { apiJson } from '@/lib/api/http';

/** Bolsa del encabezado con el número de ítems guardados. Sin sesión se muestra sin número. */
export default function BotonLista() {
  const [total, setTotal] = useState(0);
  const ruta = usePathname();
  useEffect(() => {
    let vigente = true;
    const leer = () => apiJson<{ total: number }>('/lista/resumen').then(r => { if (vigente) setTotal(r.total); }).catch(() => { if (vigente) setTotal(0); });
    void leer();
    window.addEventListener('qatu:lista', leer);
    return () => { vigente = false; window.removeEventListener('qatu:lista', leer); };
  }, [ruta]);
  const nombre = total ? `Mi lista, ${total} ${total === 1 ? 'ítem' : 'ítems'}` : 'Mi lista';
  return <Link href="/lista" className="q-campana" aria-label={nombre} title="Mi lista" aria-current={ruta === '/lista' ? 'page' : undefined}>
    <Icono nombre="lista" size={20}/>
    {total > 0 && <span className="q-campana-cuenta" aria-hidden="true">{total > 20 ? '20+' : total}</span>}
  </Link>;
}
