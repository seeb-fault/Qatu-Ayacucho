import BandejaReservas from '@/components/reservas/BandejaReservas';
export const metadata = { title: 'Mis solicitudes | Qatu' };
export default async function ReservasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { vista } = await searchParams;
  return <div className="container"><BandejaReservas vistaInicial={vista === 'proveedor' ? 'proveedor' : 'cliente'}/></div>;
}
