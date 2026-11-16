import Link from 'next/link';
import DatosTitular from '@/components/legal/DatosTitular';
import { titular } from '@/lib/api/legal';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from '@/components/legal/legal.module.css';

export const metadata = { title: 'Contacto', description: 'Datos de contacto de Qatu: correo, teléfono y dirección en Ayacucho.' };

export default async function ContactoPage() {
  const datos = await titular();
  return <div className="container"><article className={`${catalogo.panel} ${styles.documento}`} aria-labelledby="titulo-contacto">
    <h1 id="titulo-contacto">Contacto</h1>
    <p>Qatu conecta a personas de Ayacucho que necesitan una herramienta o un oficio con proveedores locales que los alquilan o los ofrecen. Si tienes una consulta sobre la plataforma, tu cuenta o un pago, escríbenos.</p>
    <DatosTitular titular={datos}/>
    <h2>Antes de escribirnos</h2>
    <ul>
      <li>Para coordinar la entrega de una herramienta o el horario de un trabajo, usa el botón de WhatsApp de tu reserva: llega directo a la otra persona.</li>
      <li>Si hubo un problema con una reserva (daño, faltante o un trabajo incompleto), repórtalo desde la misma reserva hasta 48 horas después del cierre.</li>
      <li>Para un reclamo o una queja formal, usa el <Link href="/libro-de-reclamaciones">Libro de Reclamaciones</Link>.</li>
    </ul>
    <h2>Información</h2>
    <ul>
      <li><Link href="/terminos">Términos y condiciones</Link></li>
      <li><Link href="/devoluciones">Política de cancelaciones, cambios y devoluciones</Link></li>
      <li><Link href="/privacidad">Política de privacidad</Link></li>
    </ul>
  </article></div>;
}
