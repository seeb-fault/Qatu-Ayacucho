export type TipoOferta = 'herramienta' | 'servicio';
export type Oferta = { id: string; titulo: string; tipo: TipoOferta; categoria: string; distrito: string; precio: number | null; unidad: string; imagen: string | null; fondo: string; descripcion: string; incluye: string[]; condiciones: string[]; proveedor: { nombre: string; iniciales: string; verificado: boolean; experiencia: string }; puntuacion: number | null; resenas: number; activa: boolean };
export type Filtros = { q: string; tipo: string; categoria: string; distrito: string; precio: string; pagina: number; orden: string };
export const distritos = ['Ayacucho', 'San Juan Bautista', 'Carmen Alto', 'Jesús Nazareno'];
export const categorias = [ {id:'perforacion',nombre:'Perforación',tipo:'herramienta',icono:'drill'}, {id:'corte',nombre:'Corte y lijado',tipo:'herramienta',icono:'saw'}, {id:'pintura',nombre:'Pintura',tipo:'herramienta',icono:'paint'}, {id:'jardineria',nombre:'Jardinería',tipo:'herramienta',icono:'leaf'}, {id:'limpieza',nombre:'Limpieza',tipo:'herramienta',icono:'spark'}, {id:'gasfiteria',nombre:'Gasfitería',tipo:'servicio',icono:'drop'}, {id:'electricidad',nombre:'Electricidad',tipo:'servicio',icono:'bolt'}, {id:'carpinteria',nombre:'Carpintería',tipo:'servicio',icono:'hammer'}, {id:'pintor',nombre:'Pintores',tipo:'servicio',icono:'paint'}, {id:'jardinero',nombre:'Jardineros',tipo:'servicio',icono:'leaf'} ];
const proveedores = [{nombre:'Taller Quispe',iniciales:'TQ',verificado:true,experiencia:'Herramientas para proyectos de casa y obra.'},{nombre:'María Huamán',iniciales:'MH',verificado:true,experiencia:'Experiencia declarada: 6 años en trabajos de mantenimiento.'},{nombre:'Luis Palomino',iniciales:'LP',verificado:false,experiencia:'Especialista independiente. Perfil de demostración.'},{nombre:'Elena Rojas',iniciales:'ER',verificado:true,experiencia:'Experiencia declarada: 4 años atendiendo proyectos locales.'}];
const registros: [string,TipoOferta,string,string,number|null,string,string|null][] = [
 ['Taladro percutor Bosch 750 W','herramienta','perforacion','Ayacucho',3500,'día','drill'],
 ['Sierra circular de precisión','herramienta','corte','San Juan Bautista',4500,'día','saw'],
 ['Kit de pintura para tu proyecto','herramienta','pintura','Ayacucho',1800,'día','paint'],
 ['Hidrolavadora de alta presión','herramienta','limpieza','Carmen Alto',5500,'día','washer'],
 ['Rotomartillo para concreto','herramienta','perforacion','Jesús Nazareno',6000,'día','drill'],
 ['Podadora eléctrica de jardín','herramienta','jardineria','Ayacucho',4000,'día','mower'],
 ['Reparaciones de gasfitería','servicio','gasfiteria','Ayacucho',null,'','plumber'],
 ['Instalaciones eléctricas en casa','servicio','electricidad','San Juan Bautista',null,'','electrician'],
 ['Carpintería y reparación de muebles','servicio','carpinteria','Carmen Alto',null,'','carpenter'],
 ['Pintura de interiores y acabados','servicio','pintor','Jesús Nazareno',null,'','painter'],
 ['Lijadora orbital para madera','herramienta','corte','Ayacucho',2500,'día','sander'],
 ['Atornillador inalámbrico 18 V','herramienta','perforacion','San Juan Bautista',3000,'día','drill'],
 ['Mantenimiento de jardines','servicio','jardinero','Ayacucho',null,'','gardener'],
 ['Pistola de pintura eléctrica','herramienta','pintura','Carmen Alto',3500,'día','paint'],
 ['Aspiradora para taller','herramienta','limpieza','Ayacucho',2800,'día','washer'],
 ['Cortasetos eléctrico','herramienta','jardineria','Jesús Nazareno',3200,'día','mower'],
 ['Instalación de luminarias','servicio','electricidad','Ayacucho',null,'','electrician'],
 ['Reparación de puertas y ventanas','servicio','carpinteria','San Juan Bautista',null,'','carpenter'],
 ['Cambio de grifería y conexiones','servicio','gasfiteria','Carmen Alto',null,'','plumber'],
 ['Acabados de paredes','servicio','pintor','Ayacucho',null,'','painter'],
 ['Taladro compacto para casa','herramienta','perforacion','Carmen Alto',2200,'día','drill'],
 ['Sierra caladora para madera','herramienta','corte','Ayacucho',3000,'día','saw'],
 ['Servicio de poda y cuidado de plantas','servicio','jardinero','Jesús Nazareno',null,'','gardener'],
 ['Herramienta sin fotografía de ejemplo','herramienta','corte','Ayacucho',1500,'día',null]
];
const fondos=['#ecede7','#f0e6db','#e9e7df','#e3ebe7','#ece6df','#e6e9d9'];
export const ofertas: Oferta[] = registros.map((r,i)=>({ id: 'qatu-'+String(i+1).padStart(2,'0'), titulo:r[0],tipo:r[1],categoria:r[2],distrito:r[3],precio:r[4],unidad:r[5],imagen:r[6] ? '/ilustraciones/'+r[6]+'.svg':null,fondo:fondos[i%fondos.length],descripcion:r[1]==='herramienta'?'Lo que necesitas para darle forma a tu próximo proyecto. Equipo de ejemplo para uso doméstico y trabajos de mantenimiento; consulta sus características y condiciones antes de solicitar.':'Una solución local para tu hogar. El alcance, los materiales y el precio final se acuerdan mediante una cotización antes de contratar.',incluye:r[1]==='herramienta'?['Equipo y accesorios descritos en la publicación','Explicación de uso al momento de la entrega','Recojo coordinado en el distrito del proveedor']:['Evaluación del trabajo según la descripción','Alcance y materiales definidos en la cotización','Horario acordado antes de la contratación'],condiciones:r[1]==='herramienta'?['La tarifa publicada es por día; no es un total de reserva.','Disponibilidad y fechas por confirmar al habilitar reservas.','El retiro y la devolución se coordinan con el proveedor.']:['La visita y los materiales no están incluidos automáticamente.','El precio se confirma con una cotización aceptada.','La fecha preferida no asegura una atención confirmada.'],proveedor:proveedores[i%4],puntuacion:i===2||i===23?null:[4.9,4.8,4.7,5][i%4],resenas:i===2||i===23?0:[24,18,12,31][i%4],activa:true}));
export const ofertaInactiva: Oferta = {...ofertas[0],id:'no-disponible',activa:false};
export const normalizar = (s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function leerFiltros(params: Record<string,string|string[]|undefined>): Filtros { const get=(k:string)=>typeof params[k]==='string'?String(params[k]):'';const tipo=['herramienta','servicio'].includes(get('tipo'))?get('tipo'):'';const categoria=categorias.find(c=>c.id===get('categoria')&&(!tipo||c.tipo===tipo))?.id??'';const precio=/^\d{1,6}$/.test(get('precio'))?get('precio'):'';return {q:get('q').slice(0,200),tipo,categoria,distrito:distritos.includes(get('distrito'))?get('distrito'):'',precio,pagina:Math.min(10000,Math.max(1,Number.parseInt(get('pagina'))||1)),orden:['precio','nombre'].includes(get('orden'))?get('orden'):'recomendados'}; }
export function filtrarOfertas(f:Filtros){const tokens=normalizar(f.q).split(/\s+/).filter(Boolean);let items=ofertas.filter(o=>o.activa&&(!f.tipo||o.tipo===f.tipo)&&(!f.categoria||o.categoria===f.categoria)&&(!f.distrito||o.distrito===f.distrito)&&(!f.precio||(o.precio!==null&&o.precio<=Number(f.precio)*100))&&tokens.every(t=>normalizar(o.titulo+' '+o.categoria+' '+o.distrito).includes(t)));if(f.orden==='precio')items=items.sort((a,b)=>(a.precio??Infinity)-(b.precio??Infinity)||a.id.localeCompare(b.id));else if(f.orden==='nombre')items=items.sort((a,b)=>a.titulo.localeCompare(b.titulo,'es'));const total=items.length;const paginas=Math.max(1,Math.ceil(total/20));const pagina=Math.min(f.pagina,paginas);return {items:items.slice((pagina-1)*20,pagina*20),total,pagina,paginas};}
export function urlBusqueda(f: Partial<Filtros>={},extra:Record<string,string>={}){const p=new URLSearchParams();for(const [k,v] of Object.entries({...f,...extra})){if(v!==''&&v!==undefined&&!(k==='pagina'&&v===1)&&!(k==='orden'&&v==='recomendados'))p.set(k,String(v));}return '/buscar'+(p.size?'?'+p.toString():'');}
export const soles=(centimos:number)=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',maximumFractionDigits:centimos%100?2:0}).format(centimos/100);
