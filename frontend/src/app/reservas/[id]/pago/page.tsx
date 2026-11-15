import CheckoutReserva from '@/components/pagos/CheckoutReserva';

export const metadata = { title: 'Pagar reserva | Qatu' };

export default async function PagoReservaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CheckoutReserva id={id}/>;
}
