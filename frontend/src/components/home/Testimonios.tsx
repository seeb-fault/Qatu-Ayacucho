import Icono from '@/components/descubrimiento/Icono';
const testimonios = [
  { nombre: 'María H.', iniciales: 'MH', distrito: 'Ayacucho', texto: 'Encontrar la herramienta para un arreglo de casa debería ser así de sencillo. Todo cerca y con la tarifa clara.' },
  { nombre: 'Carlos Q.', iniciales: 'CQ', distrito: 'San Juan Bautista', texto: 'Me gusta poder explorar herramientas y oficios en un mismo lugar antes de decidir qué necesito.' },
  { nombre: 'Elena R.', iniciales: 'ER', distrito: 'Jesús Nazareno', texto: 'Una buena forma de descubrir el talento de nuestra ciudad y darle vida a los proyectos pendientes.' },
];
export default function Testimonios() {
  return <section className="testimonials-section" aria-labelledby="testimonios-titulo"><div className="section-heading"><div><span className="eyebrow">PROYECTOS QUE NOS CONECTAN</span><h2 id="testimonios-titulo">Una comunidad que hace posible más<span className="orange-dot">.</span></h2></div><span className="demo-pill">Testimonios ilustrativos</span></div><div className="grid grid-cols-1 gap-4 md:grid-cols-3">{testimonios.map(t => <figure className="testimonial" key={t.nombre}><div className="testimonial-stars" aria-label="Valoración ficticia: 5 de 5">{Array.from({length:5},(_,i)=><Icono nombre="star" size={15} key={i}/>)}</div><blockquote>“{t.texto}”</blockquote><figcaption><span className="testimonial-avatar">{t.iniciales}</span><span><strong>{t.nombre}</strong><span>{t.distrito}</span></span><Icono nombre="spark" size={20}/></figcaption></figure>)}</div><p className="market-note">Opiniones ficticias para mostrar el diseño del prototipo; no corresponden a contrataciones reales.</p></section>;
}
