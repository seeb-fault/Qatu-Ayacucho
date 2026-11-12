import BandejaReservas from '@/components/reservas/BandejaReservas';

export const metadata = { title: 'Solicitudes recibidas' };

export default function SolicitudesProveedorPage() { return <BandejaReservas vistaInicial="proveedor" soloRecibidas/>; }
