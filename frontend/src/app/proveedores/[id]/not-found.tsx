import Link from 'next/link';

export default function ProveedorNoDisponible() {
  return <section className="container empty-state"><h1>Este perfil no está disponible</h1><p>Puede ser privado o no estar disponible para consulta pública.</p><Link className="button primary" href="/buscar">Explorar ofertas</Link></section>;
}
