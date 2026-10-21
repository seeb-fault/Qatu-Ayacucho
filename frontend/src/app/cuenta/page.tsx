import Link from 'next/link';

export const metadata = { title: 'Tu cuenta, próximamente' };

export default function CuentaPage() {
  return <section className="container empty-state">
    <span className="eyebrow">ENTREGA 001 · PROTOTIPO</span>
    <h1>Tu cuenta, en una próxima entrega</h1>
    <p>Por ahora puedes explorar herramientas y oficios de demostración. El registro y el inicio de sesión se incorporan en la entrega 002.</p>
    <Link href="/buscar" className="button primary">Explorar ofertas</Link>
  </section>;
}
