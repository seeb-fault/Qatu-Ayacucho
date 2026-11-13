import Image from 'next/image';
import Link from 'next/link';
import Icono from '@/components/descubrimiento/Icono';
import { soles } from '@/lib/catalogo';

// Herramientas con fondo transparente: se apoyan sobre la forma roja y la desbordan hacia la izquierda.
const FOTO = '/images/herramientas-hero.webp';

export default function HeroImagen({ taladrosDesde }: { taladrosDesde: number | null }) {
  return <div className="q-hero-media">
    <span className="q-hero-forma" aria-hidden="true"/>
    <span className="q-hero-objetos"><Image src={FOTO} alt="Taladro, martillo, rodillo de pintura, llave inglesa, casco de seguridad y caja de herramientas" fill priority sizes="(max-width: 900px) 100vw, 55vw"/></span>
    <span className="q-hero-sello" aria-hidden="true">Hecho en<br/><strong>Ayacucho</strong></span>
    {taladrosDesde !== null && <Link href="/buscar?tipo=herramienta&categoria=perforacion" className="q-hero-chip q-hero-chip--precio"><Icono nombre="calendar" size={16}/>Taladros desde {soles(taladrosDesde)} / día</Link>}
    <Link href="/buscar?tipo=servicio" className="q-hero-chip q-hero-chip--oscuro"><Icono nombre="hammer" size={15}/>Oficios cerca de ti</Link>
  </div>;
}
