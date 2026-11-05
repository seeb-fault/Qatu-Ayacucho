import Icono from '@/components/descubrimiento/Icono';
export default function Confianza() {
  return <section className="trust-strip" aria-label="Lo que encontrarás en Qatu">{[
    { icon: 'pin', title: 'Cerca de ti', text: 'Busca en los distritos de Ayacucho' },
    { icon: 'shield', title: 'Perfiles con información', text: 'Consulta el estado de cada proveedor' },
    { icon: 'calendar', title: 'Tarifas claras', text: 'Por día o según cotización' },
    { icon: 'send', title: 'Publica fácil', text: 'Ofrece tus herramientas u oficios' },
  ].map(item => <div className="trust-item" key={item.title}><span className="trust-icon"><Icono nombre={item.icon} size={22}/></span><div><strong>{item.title}</strong><p>{item.text}</p></div></div>)}</section>;
}
