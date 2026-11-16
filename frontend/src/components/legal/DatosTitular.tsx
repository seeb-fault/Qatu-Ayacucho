import type { Titular } from '@/lib/api/legal';
import styles from './legal.module.css';

const valor = (v: string | null) => v ?? <span className={styles.pendiente}>Por definir</span>;

/** Identificación de Qatu como proveedor. Los datos vienen de la configuración del backend (QATU_TITULAR_*). */
export default function DatosTitular({ titular, etiqueta = 'Datos del titular' }: { titular: Titular; etiqueta?: string }) {
  return <dl className={styles.titular} aria-label={etiqueta}>
    <dt>Razón social</dt><dd>{valor(titular.razonSocial)}</dd>
    <dt>RUC</dt><dd>{valor(titular.ruc)}</dd>
    <dt>Dirección</dt><dd>{valor(titular.direccion)}</dd>
    <dt>Correo</dt><dd>{titular.correo ? <a href={`mailto:${titular.correo}`}>{titular.correo}</a> : valor(null)}</dd>
    <dt>Teléfono</dt><dd>{titular.telefono ? <a href={`tel:${titular.telefono.replace(/\s/g, '')}`}>{titular.telefono}</a> : valor(null)}</dd>
  </dl>;
}
