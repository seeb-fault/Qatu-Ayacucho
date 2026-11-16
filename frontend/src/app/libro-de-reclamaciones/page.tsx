import Link from 'next/link';
import DatosTitular from '@/components/legal/DatosTitular';
import LibroReclamaciones, { ConsultaHoja } from '@/components/legal/LibroReclamaciones';
import { titular } from '@/lib/api/legal';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from '@/components/legal/legal.module.css';

export const metadata = { title: 'Libro de Reclamaciones', description: 'Libro de Reclamaciones virtual de Qatu. Presenta un reclamo o una queja y consulta su respuesta.' };

export default async function LibroReclamacionesPage() {
  const datos = await titular();
  return <div className="container">
    <section className={catalogo.panel} aria-labelledby="titulo-libro">
      <h1 id="titulo-libro">Libro de Reclamaciones</h1>
      <p>Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, Qatu cuenta con un Libro de Reclamaciones virtual a tu disposición. Puedes presentar tu hoja <strong>sin crear una cuenta</strong>. Al enviarla verás tu constancia con su número, que puedes imprimir o guardar.</p>
      <DatosTitular titular={datos} etiqueta="Datos del proveedor"/>
      <p className={catalogo.hint}>Si tu problema es con una reserva en curso, también puedes <Link href="/reservas">reportar una incidencia</Link> desde la reserva para que la revisemos con las fotos de evidencia.</p>
      <LibroReclamaciones/>
    </section>
    <section className={`${catalogo.panel} ${styles.noImprimir}`} aria-labelledby="titulo-consulta">
      <h2 id="titulo-consulta">Consultar una hoja</h2>
      <p>Escribe el número de tu hoja y el código de consulta que recibiste en la constancia.</p>
      <ConsultaHoja/>
    </section>
  </div>;
}
