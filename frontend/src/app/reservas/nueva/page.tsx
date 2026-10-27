import Link from 'next/link';
import NuevaSolicitud from '@/components/reservas/NuevaSolicitud';
export const metadata = { title: 'Solicitar una reserva | Qatu' };
export default async function NuevaReservaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const id = (await searchParams).publicacion;
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return <div className="container"><h1>Elige una oferta para solicitar</h1><p><Link href="/buscar">Explorar ofertas disponibles</Link></p></div>;
  }
  return <div className="container"><NuevaSolicitud publicacionId={id}/></div>;
}
