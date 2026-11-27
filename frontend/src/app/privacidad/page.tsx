import Link from 'next/link';
import DatosTitular from '@/components/legal/DatosTitular';
import { FECHA_LEGAL, titular } from '@/lib/api/legal';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from '@/components/legal/legal.module.css';

export const metadata = { title: 'Política de privacidad', description: 'Qué datos personales trata Qatu, para qué, cuánto tiempo y cómo ejercer tus derechos.' };

export default async function PrivacidadPage() {
  const datos = await titular();
  return <div className="container"><article className={`${catalogo.panel} ${styles.documento}`} aria-labelledby="titulo-privacidad">
    <h1 id="titulo-privacidad">Política de privacidad</h1>
    <p className={styles.actualizado}>Última actualización: {FECHA_LEGAL}.</p>
    <p>Esta política explica cómo Qatu trata tus datos personales conforme a la Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento. El responsable del tratamiento es:</p>
    <DatosTitular titular={datos}/>

    <h2>1. Qué datos tratamos y para qué</h2>
    <ul>
      <li><strong>Cuenta:</strong> nombre, correo y contraseña (guardada solo como huella cifrada). Para identificarte y darte acceso.</li>
      <li><strong>WhatsApp:</strong> solo si lo registras y aceptas mostrarlo. Se muestra a la otra parte de una reserva desde que hay un compromiso y hasta el cierre.</li>
      <li><strong>Perfil y documentos de proveedor:</strong> para verificar tu identidad. Los documentos se guardan cifrados y solo los revisa la administración.</li>
      <li><strong>Ubicación de las ofertas:</strong> el público ve una ubicación aproximada, salvo que elijas mostrar la exacta; el punto exacto solo lo ve la otra parte de una reserva con compromiso.</li>
      <li><strong>Reservas, reseñas, incidencias y fotos de evidencia:</strong> para operar el servicio y resolver problemas. Las fotos se borran 90 días después del cierre de la reserva.</li>
      <li><strong>Pagos:</strong> Qatu guarda el importe, el estado y la referencia del cargo. Los datos de tarjeta o Yape los trata Culqi; Qatu no los ve ni los guarda.</li>
      <li><strong>Libro de Reclamaciones:</strong> los datos de la hoja (nombre, documento, domicilio, correo y detalle) para atender tu reclamo o queja, como exige el Código de Protección y Defensa del Consumidor.</li>
    </ul>

    <h2>2. Con quién los compartimos</h2>
    <ul>
      <li>Con la otra parte de tu reserva, solo lo necesario para coordinarla (nombre, WhatsApp y ubicación exacta desde el compromiso).</li>
      <li>Con Culqi, para procesar los pagos en línea.</li>
      <li>Con Cloudflare, que almacena los documentos de proveedores y las fotos de evidencia en servidores fuera del Perú. Qatu los cifra antes de enviarlos y conserva la clave, por lo que Cloudflare no puede leerlos. Esto constituye una transferencia internacional de datos personales, que realizamos solo para prestar el servicio.</li>
      <li>Con autoridades, cuando una norma o un mandato lo exija.</li>
    </ul>
    <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>

    <h2>3. Seguridad</h2>
    <p>Usamos conexiones cifradas, contraseñas guardadas con huella salada, sesiones que vencen, documentos y fotos cifrados por Qatu antes de almacenarlos (también los que guarda Cloudflare), y controles para que cada persona vea solo lo que le corresponde.</p>

    <h2>4. Tus derechos</h2>
    <p>Puedes pedir acceso, rectificación, cancelación u oposición al tratamiento de tus datos (derechos ARCO) escribiendo al correo del titular indicado arriba. Algunos datos, como las hojas del Libro de Reclamaciones y los registros de pagos, deben conservarse por obligación legal aunque cierres tu cuenta. Si no estás conforme con la respuesta, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.</p>

    <h2>5. Más información</h2>
    <p>Consulta también los <Link href="/terminos">términos y condiciones</Link> y la página de <Link href="/contacto">contacto</Link>.</p>
  </article></div>;
}
