import Link from 'next/link';
import Image from 'next/image';
import { soles, type Oferta } from '@/lib/catalogo';
import Icono from './Icono';

export default function TarjetaOferta({ oferta: o, volver = '/buscar' }: { oferta: Oferta; volver?: string }) {
  const detalle = '/publicaciones/' + o.id + '?volver=' + encodeURIComponent(volver);
  return <article className="offer-card">
    <Link className="card-image" href={detalle} style={{ background: o.fondo }} aria-label={'Ver ' + o.titulo}>
      {o.imagen ? <Image src={o.imagen} alt="" width={600} height={440} sizes="(max-width: 767px) 45vw, (max-width: 1100px) 30vw, 260px"/> : <span className="no-photo"><Icono nombre="tool" size={48}/>Imagen no disponible</span>}
      <span className={'offer-type ' + (o.tipo === 'servicio' ? 'service' : '')}>{o.tipo === 'herramienta' ? 'Herramienta' : 'Oficio'}</span><span className="card-go"><Icono nombre="arrow" size={18}/></span>
    </Link>
    <div className="card-meta"><span><Icono nombre="pin" size={13}/>{o.distrito}</span>{o.puntuacion !== null ? <span className="rating"><Icono nombre="star" size={13}/>{o.puntuacion.toFixed(1)} <small>({o.resenas})</small></span> : <span className="new-label">Sin reseñas</span>}</div>
    <h3><Link href={detalle}>{o.titulo}</Link></h3><p className="card-owner">Por {o.proveedor.nombre}</p>
    <div className="card-price">{o.precio !== null ? <><strong>{soles(o.precio)}</strong><span> / {o.unidad}</span></> : <><strong>A cotizar</strong><span> según tu proyecto</span></>}<span className="card-price-icon"><Icono nombre={o.tipo === 'herramienta' ? 'drill' : 'hammer'} size={17}/></span></div>
  </article>;
}
