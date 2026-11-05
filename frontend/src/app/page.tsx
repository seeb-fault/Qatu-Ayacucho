import Link from 'next/link';
import Image from 'next/image';
import TarjetaOferta from '@/components/descubrimiento/TarjetaOferta';
import Icono from '@/components/descubrimiento/Icono';
import Confianza from '@/components/home/Confianza';
import Testimonios from '@/components/home/Testimonios';
import SeccionOfertas from '@/components/home/SeccionOfertas';
import HeroImagen from '@/components/home/HeroImagen';
import { categorias, distritos, ofertas, leerFiltros, urlBusqueda, type Oferta } from '@/lib/catalogo';
import { consultarPublicaciones, fuenteCatalogo } from '@/lib/api/publicaciones';

export default async function Home() {
  const demo=fuenteCatalogo==='demostracion';
  let errorCatalogo=false;
  const catalogo=await consultarPublicaciones(leerFiltros({})).catch(()=>{errorCatalogo=true;return {items:[] as Oferta[],total:0};});
  const destacadas:Oferta[]=demo?[...ofertas.slice(0,3),...ofertas.slice(6,8)]:catalogo.items.slice(0,5);
  const mostradas=new Set(destacadas.map(o=>o.id));
  const herramientas=catalogo.items.filter(o=>o.tipo==='herramienta'&&!mostradas.has(o.id)).slice(0,4);
  const oficios=catalogo.items.filter(o=>o.tipo==='servicio'&&!mostradas.has(o.id)).slice(0,4);
  return <div className="market-home container">
    <section className="q-hero" aria-labelledby="home-title">
      <div className="q-hero-copy">
        <span className="q-hero-badge"><Icono nombre="pin" size={15}/>Tu marketplace local en Ayacucho</span>
        <h1 id="home-title">Encuentra, alquila y contrata <span className="q-accent">en un solo lugar</span></h1>
        <p>Descubre herramientas en alquiler y oficios cerca de ti. Conecta con personas y negocios de Ayacucho.</p>
        <div className="q-hero-actions"><Link href="/buscar" className="button primary hero-cta">Explorar publicaciones <Icono nombre="arrow" size={18}/></Link><Link href="/#como-funciona" className="button outline">Cómo funciona</Link></div>
        <ul className="q-hero-facts" aria-label="Qatu en cifras">
          {!errorCatalogo&&catalogo.total>0&&<li><strong>{catalogo.total}</strong><span>{catalogo.total===1?'oferta':'ofertas'}{demo?' de ejemplo':' publicadas'}</span></li>}
          <li><strong>{categorias.length}</strong><span>categorías</span></li>
          <li><strong>{distritos.length}</strong><span>distritos</span></li>
        </ul>
      </div>
      <HeroImagen/>
    </section>
    <Confianza/>
    <section className="q-categories" aria-labelledby="categorias-titulo">
      <div className="section-heading"><div><span className="eyebrow">¿QUÉ TIENES EN MENTE?</span><h2 id="categorias-titulo">Explora por categoría</h2></div><Link className="text-link" href="/buscar">Ver todo <Icono nombre="arrow" size={17}/></Link></div>
      <ul className="q-category-grid">{categorias.map(c=><li key={c.id}><Link href={urlBusqueda({tipo:c.tipo,categoria:c.id})} className={'q-category q-category--'+c.tipo}><span className="q-category-icon"><Icono nombre={c.icono} size={24}/></span><span><strong>{c.nombre}</strong><small>{c.tipo==='herramienta'?'Herramientas':'Oficios'}</small></span></Link></li>)}</ul>
    </section>
    <SeccionOfertas id="destacadas-titulo" eyebrow="ENCUENTRA CON QUÉ Y CON QUIÉN" titulo="Publicaciones destacadas" icono="spark" enlace="/buscar" textoEnlace="Ver todas" destacada>
      <div className="offer-grid offer-grid--5">{destacadas.map(o=><TarjetaOferta key={o.id} oferta={o}/>)}</div>
      <p className="market-note">{demo?'Catálogo de demostración · Tarifas, personas y valoraciones ficticias.':'Ofertas publicadas por proveedores verificados · Ilustraciones de referencia.'}</p>
      {errorCatalogo&&<p role="alert" className="inline-alert">No pudimos cargar las ofertas. <Link href="/buscar">Reintentar en el catálogo</Link></p>}
      {!errorCatalogo&&destacadas.length===0&&<p className="inline-empty">Aún no hay ofertas publicadas. <Link href="/publicar">Publica la primera oferta de tu comunidad.</Link></p>}
    </SeccionOfertas>
    <section className="q-banners" aria-label="Explora las posibilidades">
      <Link className="q-banner q-banner--talent" href="/buscar?tipo=servicio"><div><span className="q-banner-tag"><Icono nombre="heart" size={14}/> Talento de Ayacucho</span><h2>Oficios que hacen<br/>la diferencia</h2><p>Gasfitería, electricidad, carpintería, pintura y jardinería cerca de ti.</p><span className="q-banner-cta">Encontrar un oficio <Icono nombre="arrow" size={17}/></span></div><Image src="/ilustraciones/carpenter.svg" alt="" width={260} height={220}/></Link>
      <Link className="q-banner q-banner--publish" href="/publicar"><div><span className="q-banner-tag"><Icono nombre="plus" size={14}/> Para proveedores</span><h2>¿Tienes herramientas<br/>o un oficio?</h2><p>Crea tu perfil de proveedor, verifícalo y publica tus ofertas para llegar a más personas en Ayacucho.</p><span className="q-banner-cta">Publicar ahora <Icono nombre="arrow" size={17}/></span></div><span className="q-banner-icons" aria-hidden="true"><span><Icono nombre="drill" size={26}/></span><span><Icono nombre="hammer" size={26}/></span><span><Icono nombre="paint" size={26}/></span></span></Link>
    </section>
    {herramientas.length>0&&<SeccionOfertas id="herramientas-titulo" eyebrow="PARA HACERLO TÚ" titulo="Herramientas en alquiler" icono="drill" enlace="/buscar?tipo=herramienta" textoEnlace="Ver herramientas"><div className="offer-grid">{herramientas.map(o=><TarjetaOferta key={o.id} oferta={o}/>)}</div></SeccionOfertas>}
    {oficios.length>0&&<SeccionOfertas id="oficios-titulo" eyebrow="DÉJALO EN BUENAS MANOS" titulo="Oficios cerca de ti" icono="hammer" enlace="/buscar?tipo=servicio" textoEnlace="Ver oficios"><div className="offer-grid">{oficios.map(o=><TarjetaOferta key={o.id} oferta={o}/>)}</div></SeccionOfertas>}
    <section className="market-how" id="como-funciona" aria-labelledby="como-titulo"><div className="section-heading"><div><span className="eyebrow">DE LA IDEA A LA ACCIÓN</span><h2 id="como-titulo">Tu proyecto empieza en tres pasos</h2></div><p>Menos vueltas. Más manos a la obra.</p></div><ol className="q-steps">{[
      {n:'01',icon:'search',title:'Encuentra tu solución',text:'Explora herramientas y oficios por categoría, distrito y presupuesto.'},
      {n:'02',icon:'user',title:'Conoce los detalles',text:'Revisa el perfil del proveedor, la tarifa y las condiciones de cada oferta.'},
      {n:'03',icon:'calendar',title:'Envía tu solicitud',text:'Solicita una reserva o una cotización y coordina directamente con el proveedor.'},
    ].map(s=><li className="market-step" key={s.n}><div className="step-top"><span><Icono nombre={s.icon} size={24}/></span><small aria-hidden="true">{s.n}</small></div><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol></section>
    <Testimonios/>
  </div>;
}
