import {filtrarOfertas,ofertas,ofertaInactiva,type Filtros,type Oferta} from '@/lib/catalogo';
import type {PublicacionPublica} from './catalogo';
export const fuenteCatalogo = process.env.QATU_CATALOGO === 'demo' ? 'demostracion' : 'persistido';
const zonaIds:Record<string,string>={'Ayacucho':'ayacucho','San Juan Bautista':'san-juan-bautista','Carmen Alto':'carmen-alto','Jesús Nazareno':'jesus-nazareno'};
async function consultar(ruta:string) {
 const response=await fetch(`${process.env.QATU_API_URL??'http://127.0.0.1:3001'}/api/v1${ruta}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
 if (response.status===404 || response.status===400) return null;
 if (!response.ok) throw new Error('No pudimos consultar el catálogo. Intenta nuevamente.');
 return response.json();
}
function oferta(p:PublicacionPublica):Oferta {
 return {id:p.id,titulo:p.titulo,tipo:p.tipo,categoria:p.categoriaId,distrito:p.zona.nombre,precio:p.tarifaCentimos,unidad:p.unidad??'',imagen:p.imagen,fondo:p.tipo==='herramienta'?'#e5eef3':'#f3e9e0',descripcion:p.descripcion,incluye:p.incluye,condiciones:p.condiciones,proveedor:{nombre:p.proveedor.nombrePublico,iniciales:p.proveedor.nombrePublico.split(/\s+/).slice(0,2).map(s=>s[0]).join(''),verificado:p.proveedor.estadoVerificacion==='aprobada',experiencia:'Consulta el perfil público del proveedor.',id:p.proveedor.id},puntuacion:null,resenas:0,activa:true};
}
export async function consultarPublicaciones(f:Filtros):Promise<{items:Oferta[];total:number;pagina:number;paginas:number}> {
 if (fuenteCatalogo==='demostracion') return filtrarOfertas(f);
 const q=new URLSearchParams({page:String(f.pagina),limit:'20',orden:f.orden});
 if(f.q)q.set('q',f.q);if(f.tipo)q.set('tipo',f.tipo);if(f.categoria)q.set('categoriaId',f.categoria);if(f.distrito)q.set('zonaId',zonaIds[f.distrito]);if(f.precio)q.set('precioMaximoCentimos',String(Number(f.precio)*100));
 const datos=await consultar('/publicaciones?'+q) as {items:PublicacionPublica[];page:number;total:number}|null;
 if (!datos) throw new Error('Los filtros del catálogo no son válidos.');
 const paginas=Math.max(1,Math.ceil(datos.total/20));
 if(f.pagina>paginas)return consultarPublicaciones({...f,pagina:paginas});
 return {items:datos.items.map(oferta),total:datos.total,pagina:datos.page,paginas};
}
export async function consultarPublicacion(id:string):Promise<Oferta|null> {
 if(fuenteCatalogo==='demostracion')return [...ofertas,ofertaInactiva].find(o=>o.id===id&&o.activa)??null;
 const datos=await consultar('/publicaciones/'+encodeURIComponent(id)) as PublicacionPublica|null;
 return datos?oferta(datos):null;
}
