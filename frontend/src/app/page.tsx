import Link from 'next/link';
import TarjetaOferta from '@/components/descubrimiento/TarjetaOferta';
import Icono from '@/components/descubrimiento/Icono';
import Testimonios from '@/components/home/Testimonios';
import SeccionOfertas from '@/components/home/SeccionOfertas';
import HeroImagen from '@/components/home/HeroImagen';
import ComoFunciona from '@/components/home/ComoFunciona';
import { categorias, ofertas, leerFiltros, urlBusqueda, type Oferta } from '@/lib/catalogo';
import { consultarPublicaciones, fuenteCatalogo } from '@/lib/api/publicaciones';

export default async function Home() {
  const demo=fuenteCatalogo==='demostracion';
  let errorCatalogo=false;
  const catalogo=await consultarPublicaciones(leerFiltros({})).catch(()=>{errorCatalogo=true;return {items:[] as Oferta[],total:0};});
  const destacadas:Oferta[]=demo?[...ofertas.slice(0,3),...ofertas.slice(6,8)]:catalogo.items.slice(0,5);
  const mostradas=new Set(destacadas.map(o=>o.id));
  const herramientas=catalogo.items.filter(o=>o.tipo==='herramienta'&&!mostradas.has(o.id)).slice(0,4);
  // Precio más bajo de un taladro publicado: la etiqueta del hero muestra un dato real o no aparece.
  const precios=[...catalogo.items,...destacadas].filter(o=>o.tipo==='herramienta'&&o.categoria==='perforacion'&&o.precio!==null).map(o=>o.precio as number);
  const taladrosDesde=precios.length?Math.min(...precios):null;
  const oficios=catalogo.items.filter(o=>o.tipo==='servicio'&&!mostradas.has(o.id)).slice(0,4);
  return <div className="market-home container">
    <section className="q-hero" aria-labelledby="home-title">
      <div className="q-hero-copy">
        <span className="q-hero-badge"><Icono nombre="pin" size={16}/>Tu marketplace local en Ayacucho</span>
        <h1 id="home-title">Encuentra, alquila<br/> y contrata <span className="q-accent">en un solo lugar</span></h1>
        <p>Descubre herramientas en alquiler y oficios cerca de ti. Conecta con personas y negocios de Ayacucho.</p>
        <div className="q-hero-actions"><Link href="/buscar" className="button primary hero-cta">Explorar publicaciones <Icono nombre="arrow" size={18}/></Link><Link href="/#como-funciona" className="button outline">Cómo funciona</Link></div>
      </div>
      <HeroImagen taladrosDesde={taladrosDesde}/>
    </section>
    <section className="q-categories" aria-labelledby="categorias-titulo">
      <div className="section-heading"><div><h2 id="categorias-titulo">Explora por categoría</h2></div><Link className="text-link" href="/buscar">Ver todo <Icono nombre="arrow" size={17}/></Link></div>
      <ul className="q-category-grid">{categorias.map(c=><li key={c.id}><Link href={urlBusqueda({tipo:c.tipo,categoria:c.id})} className={'q-category q-category--'+c.tipo}><span className="q-category-icon"><Icono nombre={c.icono} size={22}/></span><span><strong>{c.nombre}</strong><small>{c.tipo==='herramienta'?'Herramientas':'Oficios'}</small></span><span className="q-category-go"><Icono nombre="arrow" size={18}/></span></Link></li>)}</ul>
    </section>
    <SeccionOfertas id="destacadas-titulo" titulo="Publicaciones destacadas" icono="spark" enlace="/buscar" textoEnlace="Ver todas" destacada>
      <div className="offer-grid offer-grid--5">{destacadas.map(o=><TarjetaOferta key={o.id} oferta={o}/>)}</div>
      <p className="market-note">{demo?'Catálogo de demostración · Tarifas, personas y valoraciones ficticias.':'Ofertas publicadas por proveedores verificados · Ilustraciones de referencia.'}</p>
      {errorCatalogo&&<p role="alert" className="inline-alert">No pudimos cargar las ofertas. <Link href="/buscar">Reintentar en el catálogo</Link></p>}
      {!errorCatalogo&&destacadas.length===0&&<p className="inline-empty">Aún no hay ofertas publicadas. <Link href="/publicar">Publica la primera oferta de tu comunidad.</Link></p>}
    </SeccionOfertas>
    <section className="q-banners" aria-label="Explora las posibilidades">
      <Link className="q-banner q-banner--talent" href="/buscar?tipo=servicio"><div><span className="q-banner-tag"><Icono nombre="heart" size={14}/> Talento de Ayacucho</span><h2>Oficios que hacen<br/><span className="q-accent">la diferencia</span></h2><p>Gasfitería, electricidad, carpintería, pintura y jardinería cerca de ti.</p><span className="q-banner-cta">Encontrar un oficio <Icono nombre="arrow" size={17}/></span></div><span className="q-banner-icons" aria-hidden="true"><span><Icono nombre="bolt" size={26}/></span><span><Icono nombre="hammer" size={26}/></span><span><Icono nombre="drop" size={26}/></span></span></Link>
      <Link className="q-banner q-banner--publish" href="/publicar"><div><span className="q-banner-tag"><Icono nombre="plus" size={14}/> Para proveedores</span><h2>¿Tienes herramientas<br/>o un oficio?</h2><p>Crea tu perfil de proveedor, verifícalo y publica tus ofertas para llegar a más personas en Ayacucho.</p><span className="q-banner-cta">Publicar ahora <Icono nombre="arrow" size={17}/></span></div><span className="q-banner-icons" aria-hidden="true"><span><Icono nombre="drill" size={26}/></span><span><Icono nombre="hammer" size={26}/></span><span><Icono nombre="paint" size={26}/></span></span></Link>
    </section>
    {herramientas.length>0&&<SeccionOfertas id="herramientas-titulo" titulo="Herramientas en alquiler" icono="drill" enlace="/buscar?tipo=herramienta" textoEnlace="Ver herramientas"><div className="offer-grid">{herramientas.map(o=><TarjetaOferta key={o.id} oferta={o}/>)}</div></SeccionOfertas>}
    {oficios.length>0&&<SeccionOfertas id="oficios-titulo" titulo="Oficios cerca de ti" icono="hammer" enlace="/buscar?tipo=servicio" textoEnlace="Ver oficios"><div className="offer-grid">{oficios.map(o=><TarjetaOferta key={o.id} oferta={o}/>)}</div></SeccionOfertas>}
    <ComoFunciona muestras={destacadas.slice(0,2).map(o=>({id:o.id,titulo:o.titulo,distrito:o.distrito,precio:o.precio,unidad:o.unidad,imagen:o.imagen,proveedor:{nombre:o.proveedor.nombre,iniciales:o.proveedor.iniciales,verificado:o.proveedor.verificado}}))}/>
    <Testimonios/>
  </div>;
}
