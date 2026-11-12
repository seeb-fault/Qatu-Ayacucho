import MenuPanel from '@/components/proveedores/panel/MenuPanel';
import styles from '@/components/proveedores/panel/panel.module.css';

/** Panel del proveedor a pantalla completa; MarcoSitio oculta aquí la cabecera y el pie de la tienda. */
export default function PanelProveedorLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}><MenuPanel/><div className={styles.contenido}>{children}</div></div>;
}
