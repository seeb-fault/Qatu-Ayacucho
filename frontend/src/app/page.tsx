import Link from 'next/link';
import Image from 'next/image';
import Buscador from '@/components/descubrimiento/Buscador';
import TarjetaOferta from '@/components/descubrimiento/TarjetaOferta';
import Icono from '@/components/descubrimiento/Icono';
import Confianza from '@/components/home/Confianza';
import Testimonios from '@/components/home/Testimonios';
import { categorias, ofertas, leerFiltros, type Oferta } from '@/lib/catalogo';
import { consultarPublicaciones, fuenteCatalogo } from '@/lib/api/publicaciones';

export default async function Home() {
  const demo=fuenteCatalogo==='demostracion';
  let errorCatalogo=false;
  const destacadas:Oferta[]=demo?[...ofertas.slice(0,3),...ofertas.slice(6,8)]:(await consultarPublicaciones(leerFiltros({})).catch(()=>{errorCatalogo=true;return {items:[]};})).items.slice(0,5);
  return <div className="market-home container">
    <section className="market-hero" aria-labelledby="home-title">
      <div className="market-hero-content"><span className="hero-kicker"><span/> HECHO PARA AYACUCHO</span>
        <h1 id="home-title">Tu próxima idea.<br/><span>Manos a la obra.</span></h1>
        <p>Alquila lo que necesitas.<br/>Encuentra a quien sabe hacerlo.</p>
        <Link href="/buscar" className="button primary hero-cta">Explorar ofertas <Icono nombre="arrow" size={18}/></Link>
        <div className="hero-benefits"><span><Icono nombre="pin" size={17}/> Talento local</span><span><Icono nombre="leaf" size={17}/> Alquila y aprovecha</span></div>
      </div>
      <div className="market-hero-art"><span className="hero-orbit"/><Image src="/ilustraciones/taller.svg" alt="Herramientas y materiales de un taller para tus proyectos" width={760} height={610} priority/>
        <div className="hero-floating"><span className="floating-icon"><Icono nombre="hammer" size={24}/></span><span><strong>Grandes proyectos.</strong><small>Empiezan cerca de ti.</small></span></div>
        <span className="hero-stamp">ALQUILA.<br/>CREA.<br/><strong>REPITE.</strong><Icono nombre="arrow" size={20}/></span>
      </div>
    </section>
    <section className="market-search" aria-label="Encuentra herramientas y servicios"><Buscador/><p className="market-note"><Icono nombre="pin" size={14}/> Ayacucho, San Juan Bautista, Carmen Alto y Jesús Nazareno.</p></section>
    <section className="market-categories" aria-labelledby="categorias-titulo"><div className="section-heading"><div><span className="eyebrow">¿QUÉ TIENES EN MENTE?</span><h2 id="categorias-titulo">Encuentra por categoría</h2></div><Link className="text-link" href="/buscar">Ver todo <Icono nombre="arrow" size={17}/></Link></div>
      <div className="market-category-grid">{categorias.filter(c => ['perforacion','corte','pintura','jardineria','gasfiteria','electricidad','carpinteria'].includes(c.id)).map(c => <Link href={'/buscar?tipo='+c.tipo+'&categoria='+c.id} key={c.id} className="market-category"><span className="market-category-icon"><Icono nombre={c.icono} size={27}/></span><strong>{c.nombre}</strong></Link>)}<Link href="/buscar" className="market-category"><span className="market-category-icon"><Icono nombre="menu" size={27}/></span><strong>Ver todas</strong></Link></div>
    </section>
    <section className="market-featured" aria-labelledby="destacadas-titulo"><div className="section-heading"><div><span className="eyebrow">ENCUENTRA CON QUÉ Y CON QUIÉN</span><h2 id="destacadas-titulo">Ideas grandes, soluciones cerca<span className="orange-dot">.</span></h2></div><Link href="/buscar" className="text-link">Todas las ofertas <Icono nombre="arrow" size={17}/></Link></div>
      <div className="offer-grid">{destacadas.map(o => <TarjetaOferta key={o.id} oferta={o}/>)}</div><p className="market-note">{demo?"Catálogo de demostración · Tarifas, personas y valoraciones ficticias.":"Ofertas publicadas por proveedores verificados · Ilustraciones de referencia."}</p>{errorCatalogo&&<p role="alert">No pudimos cargar las ofertas. <Link href="/buscar">Reintentar en el catálogo</Link></p>}{!errorCatalogo&&destacadas.length===0&&<p>Aún no hay ofertas publicadas. <Link href="/publicar">Publica la primera oferta de tu comunidad.</Link></p>}
    </section>
    <section className="market-promos grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Explora las posibilidades">
      <Link className="promo-card promo-tools" href="/buscar?tipo=herramienta"><div><span className="eyebrow">PARA HACERLO TÚ</span><h3>La herramienta<br/>que te faltaba.</h3><span className="promo-link">Alquilar equipo <Icono nombre="arrow" size={17}/></span></div><Image src="/ilustraciones/drill.svg" alt="" width={240} height={200}/></Link>
      <Link className="promo-card promo-services" href="/buscar?tipo=servicio"><div><span className="eyebrow">DÉJALO EN SUS MANOS</span><h3>Talento local.<br/>Buenas soluciones.</h3><span className="promo-link">Encontrar un oficio <Icono nombre="arrow" size={17}/></span></div><Image src="/ilustraciones/carpenter.svg" alt="" width={240} height={200}/></Link>
      <Link className="promo-card promo-garden" href="/buscar?tipo=herramienta&categoria=jardineria"><div><span className="eyebrow">DALE VIDA A TU ESPACIO</span><h3>Un nuevo aire<br/>para tu jardín.</h3><span className="promo-link">Explorar jardinería <Icono nombre="arrow" size={17}/></span></div><Image src="/ilustraciones/mower.svg" alt="" width={240} height={200}/></Link>
    </section>
    <section className="market-how" id="como-funciona"><div className="section-heading"><div><span className="eyebrow">DE LA IDEA A LA ACCIÓN</span><h2>Tu proyecto empieza en tres pasos</h2></div><p>Menos vueltas. Más manos a la obra.</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-3">{[
      {n:'01',icon:'search',title:'Encuentra tu solución',text:'Explora herramientas y servicios por categoría, distrito y presupuesto.'},
      {n:'02',icon:'user',title:'Conoce los detalles',text:'Revisa el perfil, la tarifa y las condiciones de cada oferta.'},
      {n:'03',icon:'hammer',title:'Prepara tu proyecto',text:'Publica tus herramientas y oficios. Las solicitudes, reservas y pagos llegarán en próximas entregas.'},
    ].map(s => <div className="market-step" key={s.n}><div className="step-top"><span><Icono nombre={s.icon} size={24}/></span><small>{s.n}</small></div><h3>{s.title}</h3><p>{s.text}</p></div>)}</div></section>
    <Testimonios/>
    <section className="market-community"><span className="community-icon"><Icono nombre="leaf" size={42}/></span><div><span className="eyebrow">LO BUENO ESTÁ CERCA</span><h2>Tu proyecto también hace<br/>crecer a tu comunidad.</h2><p>Descubre las herramientas y el talento de Ayacucho.</p></div><Link href="/buscar?tipo=servicio" className="community-button">Conoce los oficios <Icono nombre="arrow" size={18}/></Link></section>
    <Confianza/>
  </div>;
}
