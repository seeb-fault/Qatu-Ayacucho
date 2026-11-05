import { existsSync } from 'node:fs';
import path from 'node:path';
import Image from 'next/image';

// Fotografía definitiva del hero. Basta con colocar el archivo en public/images/ para que se muestre;
// mientras no exista se usa la ilustración original como respaldo.
const FOTO = '/images/ayacucho-catedral-hero.webp';
const ILUSTRACION = '/ilustraciones/ayacucho.svg';

export default function HeroImagen() {
  const hayFoto = existsSync(path.join(process.cwd(), 'public', FOTO));
  return <figure className={'q-hero-media' + (hayFoto ? '' : ' q-hero-media--ilustracion')}>
    <Image
      src={hayFoto ? FOTO : ILUSTRACION}
      alt={hayFoto ? 'Catedral de Ayacucho frente a la Plaza de Armas de Huamanga' : 'Ilustración de la catedral y la plaza de Ayacucho al atardecer'}
      fill
      priority
      sizes="(max-width: 900px) 100vw, 65vw"
    />
  </figure>;
}
