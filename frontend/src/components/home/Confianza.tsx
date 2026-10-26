import Icono from '@/components/descubrimiento/Icono';
export default function Confianza() {
  return <section className="trust-strip" aria-label="Lo que encontrarás en Qatu">{[
    { icon: 'pin', title: 'Cerca de ti', text: 'Busca en los distritos de Ayacucho' },
    { icon: 'shield', title: 'Perfiles con información', text: 'Consulta el estado de cada proveedor' },
    { icon: 'calendar', title: 'Tarifas claras', text: 'Por día o según cotización' },
    { icon: 'leaf', title: 'Más uso, menos compras', text: 'Alquila para tu próximo proyecto' },
  ].map(item => <div className="trust-item" key={item.title}><Icono nombre={item.icon} size={27}/><div><strong>{item.title}</strong><p>{item.text}</p></div></div>)}</section>;
}
