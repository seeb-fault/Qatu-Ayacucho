import Link from 'next/link';
import DatosTitular from '@/components/legal/DatosTitular';
import { FECHA_LEGAL, titular } from '@/lib/api/legal';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from '@/components/legal/legal.module.css';

export const metadata = { title: 'Términos y condiciones', description: 'Condiciones de uso de Qatu para clientes y proveedores de herramientas y oficios en Ayacucho.' };

export default async function TerminosPage() {
  const datos = await titular();
  return <div className="container"><article className={`${catalogo.panel} ${styles.documento}`} aria-labelledby="titulo-terminos">
    <h1 id="titulo-terminos">Términos y condiciones</h1>
    <p className={styles.actualizado}>Última actualización: {FECHA_LEGAL}.</p>

    <h2>1. Quiénes somos</h2>
    <p>Qatu es una plataforma web que conecta a personas de Ayacucho que necesitan alquilar una herramienta o contratar un oficio con proveedores locales que los ofrecen. El titular de Qatu es:</p>
    <DatosTitular titular={datos}/>
    <p>Al crear una cuenta o usar Qatu aceptas estos términos. Si no estás de acuerdo, no uses la plataforma.</p>

    <h2>2. Qué hace Qatu y qué no</h2>
    <ul>
      <li>Qatu publica las ofertas de los proveedores, gestiona las solicitudes de reserva, muestra la disponibilidad y procesa los pagos en línea a través de Culqi.</li>
      <li>Las herramientas y los servicios los ofrece cada proveedor. El proveedor es responsable del estado de su herramienta, de la calidad de su trabajo y de la información de su oferta.</li>
      <li>Qatu verifica la identidad de los proveedores que lo solicitan revisando sus documentos, pero no garantiza el resultado de cada trabajo.</li>
    </ul>

    <h2>3. Cuentas</h2>
    <ul>
      <li>Para reservar o publicar necesitas una cuenta con datos reales. Eres responsable de mantener tu contraseña en reserva.</li>
      <li>Por seguridad, la sesión se cierra sola tras un periodo sin uso y los intentos fallidos de ingreso se limitan.</li>
      <li>Podemos suspender una cuenta que publique información falsa, incumpla reservas de forma reiterada o use Qatu para fines ilícitos. La decisión queda registrada con su motivo.</li>
    </ul>

    <h2>4. Publicaciones</h2>
    <ul>
      <li>Para publicar, el perfil del proveedor debe estar aprobado y registrar un número de WhatsApp.</li>
      <li>Cada oferta debe describir con claridad la herramienta o el servicio, con su precio y condiciones. Está prohibido publicar bienes ajenos, robados o peligrosos.</li>
      <li>Qatu puede ocultar publicaciones que incumplan estas reglas.</li>
    </ul>

    <h2>5. Reservas</h2>
    <ul>
      <li>El cliente envía una solicitud con sus fechas; el proveedor la acepta o la rechaza. Una solicitud no es una reserva hasta que el proveedor la acepta.</li>
      <li>En los alquileres, al aceptar se aparta la herramienta durante 60 minutos para que el cliente pague o coordine la entrega.</li>
      <li>En los oficios, el proveedor envía una cotización con alcance, importe y vigencia; el cliente la acepta o la rechaza.</li>
      <li>Desde que hay un compromiso (visita acordada, cotización enviada o reserva aceptada) cada parte ve el WhatsApp de la otra y el punto exacto de la ubicación. Antes de eso, el público solo ve una ubicación aproximada.</li>
      <li>Las cancelaciones, cambios y devoluciones se rigen por la <Link href="/devoluciones">política de cancelaciones, cambios y devoluciones</Link>.</li>
    </ul>

    <h2>6. Precios y pagos</h2>
    <ul>
      <li>Los precios se muestran en soles (S/) e incluyen lo que el proveedor cobra por su herramienta o servicio. Qatu no cobra un cargo adicional al cliente.</li>
      <li>Puedes pagar en línea con tarjeta o Yape, procesado por Culqi, o en efectivo directamente al proveedor.</li>
      <li>Los datos de tu tarjeta o de Yape se ingresan en la ventana segura de Culqi. Qatu nunca los ve ni los guarda.</li>
      <li>Un pago en línea solo se considera hecho cuando Culqi lo confirma. Si el resultado es incierto, Qatu lo verifica antes de pedir otro pago, para que no se cobre dos veces.</li>
    </ul>

    <h2>7. Entrega, devolución y problemas</h2>
    <ul>
      <li>El proveedor registra el estado de la herramienta antes de entregarla y el cliente confirma al recibirla. Ambos pueden subir fotos de evidencia, que solo ven los participantes y la administración y que se borran 90 días después del cierre.</li>
      <li>Si hay un daño, un faltante o un trabajo incompleto, cualquiera de las partes puede reportar una incidencia desde la reserva hasta 48 horas después del cierre. Un administrador ajeno a la operación la revisa y registra su decisión.</li>
    </ul>

    <h2>8. Reseñas</h2>
    <p>El cliente puede calificar una operación cerrada hasta 14 días después. Las reseñas deben ser verdaderas y respetuosas; la administración puede ocultar las que no lo sean, con un motivo registrado.</p>

    <h2>9. Reclamos</h2>
    <p>Puedes presentar un reclamo o una queja en nuestro <Link href="/libro-de-reclamaciones">Libro de Reclamaciones</Link> virtual, con o sin cuenta. Te responderemos en un plazo máximo de 15 días hábiles.</p>

    <h2>10. Datos personales</h2>
    <p>Tratamos tus datos según nuestra <Link href="/privacidad">política de privacidad</Link> y la Ley N.º 29733, Ley de Protección de Datos Personales.</p>

    <h2>11. Cambios y ley aplicable</h2>
    <p>Podemos actualizar estos términos; la fecha de la última versión figura al inicio. Estos términos se rigen por las leyes del Perú, incluido el Código de Protección y Defensa del Consumidor (Ley N.º 29571).</p>
  </article></div>;
}
