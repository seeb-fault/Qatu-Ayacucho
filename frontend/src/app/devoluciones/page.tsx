import Link from 'next/link';
import { FECHA_LEGAL } from '@/lib/api/legal';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from '@/components/legal/legal.module.css';

export const metadata = { title: 'Cancelaciones, cambios y devoluciones', description: 'Cómo cancelar una reserva en Qatu, cuándo procede un reembolso y qué hacer si hay un problema con una herramienta o un servicio.' };

export default function DevolucionesPage() {
  return <div className="container"><article className={`${catalogo.panel} ${styles.documento}`} aria-labelledby="titulo-devoluciones">
    <h1 id="titulo-devoluciones">Política de cancelaciones, cambios y devoluciones</h1>
    <p className={styles.actualizado}>Última actualización: {FECHA_LEGAL}.</p>
    <p>En Qatu se alquilan herramientas y se contratan oficios: son servicios, no venta de productos. Por eso esta política explica cuándo puedes cancelar una reserva, cuándo se devuelve tu dinero y qué hacer si algo sale mal.</p>

    <h2>1. Cancelar una reserva</h2>
    <ul>
      <li>El cliente o el proveedor pueden cancelar una reserva <strong>antes de la entrega de la herramienta o del inicio del trabajo</strong>: cuando la solicitud está pendiente, la visita está acordada, la reserva está aceptada, el servicio está confirmado o el apartado está pagado.</li>
      <li>Se cancela desde «Mis solicitudes», con un motivo. La otra persona recibe un aviso.</li>
      <li>Una vez entregada la herramienta o iniciado el trabajo, ya no se puede cancelar. Si hay un problema, se reporta una incidencia (punto 4).</li>
    </ul>

    <h2>2. Reembolsos de pagos en línea</h2>
    <ul>
      <li>Si cancelas, o te cancelan, una reserva que ya pagaste en línea, <strong>se te devuelve el importe completo</strong>. La reserva queda marcada con el reembolso pendiente y recibes un aviso.</li>
      <li>Si un pago llega cuando la reserva ya no está vigente (por ejemplo, venció el apartado), no se reactiva la reserva y el pago se devuelve completo.</li>
      <li>El reembolso se hace al mismo medio de pago, a través de Culqi. El tiempo en que el dinero aparece en tu tarjeta depende de tu banco.</li>
      <li>Qatu no cobra penalidades por cancelar antes de la entrega o del inicio del trabajo.</li>
    </ul>

    <h2>3. Pagos en efectivo</h2>
    <p>El pago en efectivo se hace directamente al proveedor, que lo registra en Qatu. Qatu no recibe ese dinero, por lo que su devolución se acuerda entre el cliente y el proveedor. Si no llegan a un acuerdo, reporta una incidencia o presenta un reclamo.</p>

    <h2>4. Problemas con la herramienta o el servicio</h2>
    <ul>
      <li>Si la herramienta llegó dañada o incompleta, o el trabajo no se hizo como se acordó, repórtalo desde la reserva como <strong>incidencia</strong> hasta 48 horas después del cierre.</li>
      <li>Antes de la entrega, el proveedor documenta el estado de la herramienta y el cliente da su conformidad al recibirla. Esas fotos y registros sirven para revisar el caso.</li>
      <li>Un administrador ajeno a la operación revisa la incidencia y registra su decisión con un motivo.</li>
    </ul>

    <h2>5. Cambios</h2>
    <p>Como no se venden productos, no hay cambios de mercadería. Si necesitas otras fechas u otra herramienta, cancela la reserva antes de la entrega (punto 1) y envía una nueva solicitud.</p>

    <h2>6. Reclamos</h2>
    <p>Si no estás conforme con una cancelación, un reembolso o la solución de una incidencia, puedes presentar un reclamo en el <Link href="/libro-de-reclamaciones">Libro de Reclamaciones</Link>. Te responderemos en un plazo máximo de 15 días hábiles.</p>
  </article></div>;
}
