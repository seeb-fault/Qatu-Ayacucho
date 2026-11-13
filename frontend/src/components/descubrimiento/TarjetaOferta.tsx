import Link from 'next/link';
import Image from 'next/image';
import { soles, type Oferta } from '@/lib/catalogo';
import Icono from './Icono';

export default function TarjetaOferta({ oferta: o, volver = '/buscar' }: { oferta: Oferta; volver?: string }) {
  const detalle = '/publicaciones/' + o.id + '?volver=' + encodeURIComponent(volver);
  const servicio = o.tipo === 'servicio';
  return <article className={'offer-card offer-card--' + o.tipo}>
    <Link className="card-image" href={detalle} tabIndex={-1} aria-hidden="true">
      {o.imagen ? <Image src={o.imagen} alt="" width={600} height={440} sizes="(max-width: 767px) 45vw, (max-width: 1100px) 30vw, 260px"/> : <span className="no-photo"><Icono nombre="tool" size={44}/>Imagen no disponible</span>}
      <span className={'offer-type ' + (servicio ? 'service' : '')}>{servicio ? 'Oficio' : 'Herramienta'}</span><span className="card-go"><Icono nombre="arrow" size={17}/></span>
    </Link>
    <div className="card-body">
      <div className="card-meta"><span><Icono nombre="pin" size={14}/>{o.distrito}</span>{o.puntuacion !== null ? <span className="rating"><Icono nombre="star" size={13}/>{o.puntuacion.toFixed(1)} <small>({o.resenas})</small></span> : <span className="new-label">Sin reseñas</span>}</div>
      <h3><Link href={detalle}>{o.titulo}</Link></h3>
      <div className="card-price">{o.precio !== null ? <><strong>{soles(o.precio)}</strong>{o.unidad && <span> / {o.unidad}</span>}</> : <><strong>A cotizar</strong><span> según tu proyecto</span></>}</div>
      <div className="card-footer"><span className="card-owner"><span className="mini-avatar" aria-hidden="true">{o.proveedor.iniciales}</span><span>Por {o.proveedor.nombre}</span></span><span className="type-chip"><Icono nombre={servicio ? 'hammer' : 'drill'} size={14}/>{servicio ? 'Contratar' : 'Alquilar'}</span></div>
    </div>
  </article>;
}
