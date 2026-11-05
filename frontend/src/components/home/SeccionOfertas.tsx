import Link from 'next/link';
import Icono from '@/components/descubrimiento/Icono';

export default function SeccionOfertas({ id, eyebrow, titulo, icono, enlace, textoEnlace, destacada = false, children }: { id: string; eyebrow: string; titulo: string; icono: string; enlace: string; textoEnlace: string; destacada?: boolean; children: React.ReactNode }) {
  return <section className={'q-offers' + (destacada ? ' q-offers--featured' : '')} aria-labelledby={id}>
    <div className="section-heading"><div className="section-heading-title"><span className="section-icon" aria-hidden="true"><Icono nombre={icono} size={20}/></span><div><span className="eyebrow">{eyebrow}</span><h2 id={id}>{titulo}</h2></div></div><Link href={enlace} className="text-link">{textoEnlace} <Icono nombre="arrow" size={17}/></Link></div>
    {children}
  </section>;
}
