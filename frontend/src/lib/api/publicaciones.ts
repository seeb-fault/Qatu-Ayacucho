import {filtrarOfertas, ofertas, ofertaInactiva, type Filtros} from '@/lib/catalogo';
export async function consultarPublicaciones(filtros:Filtros){ await new Promise(resolve=>setTimeout(resolve,180)); return filtrarOfertas(filtros); }
export async function consultarPublicacion(id:string){ return [ ...ofertas, ofertaInactiva ].find(o=>o.id===id&&o.activa)??null; }
export const fuenteCatalogo = 'demostracion' as const;
