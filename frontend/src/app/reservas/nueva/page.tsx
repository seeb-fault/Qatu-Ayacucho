import Link from 'next/link';
import NuevaSolicitud from '@/components/reservas/NuevaSolicitud';
import Icono from '@/components/descubrimiento/Icono';
export const metadata = { title: 'Solicitar una reserva | Qatu' };
export default async function NuevaReservaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const id = (await searchParams).publicacion;
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return <div className="container empty-state"><span className="empty-icon"><Icono nombre="search" size={34}/></span><h1>Elige una oferta para solicitar</h1><p>Busca la herramienta u oficio que necesitas y pulsa «Solicitar reserva» desde su página.</p><Link className="button primary" href="/buscar">Explorar ofertas disponibles</Link></div>;
  }
  return <div className="container"><NuevaSolicitud publicacionId={id}/></div>;
}
