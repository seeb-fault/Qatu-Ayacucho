'use client';
import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {Button} from 'primereact/button';
import {apiJson,ErrorApi} from '@/lib/api/http';
import type {PaginaOfertas,PublicacionPropia} from '@/lib/api/catalogo';
import styles from './catalogo.module.css';
interface Auditoria {estadoAnterior:string;estadoNuevo:string;motivo:string;version:number;creadoEn:string}
function Revision({oferta,onCambio}:{oferta:PublicacionPropia;onCambio:()=>void}){
 const [motivo,setMotivo]=useState(''),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false),[historial,setHistorial]=useState<Auditoria[]|null>(null);
 async function guardar(e:FormEvent){e.preventDefault();setOcupado(true);setError('');try{await apiJson('/admin/publicaciones/'+oferta.id+'/moderacion','PATCH',{estado:oferta.estadoModeracion==='permitida'?'retirada':'permitida',motivo,versionActual:oferta.version});setMotivo('');setHistorial(null);onCambio();}catch(e){setError(e instanceof Error?e.message:'No se pudo moderar.');}finally{setOcupado(false);}}
 async function consultar(){setOcupado(true);setError('');try{setHistorial(await apiJson<Auditoria[]>('/admin/publicaciones/'+oferta.id+'/auditoria'));}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar el historial.');}finally{setOcupado(false);}}
 return <article className={styles.item} aria-label={oferta.titulo}><h3>{oferta.titulo}</h3><p>{oferta.tipo} · {oferta.activa?'Activa por el proveedor':'Inactiva por el proveedor'} · {oferta.estadoModeracion==='permitida'?'Permitida':'Retirada por moderación'}</p>
 {error&&<p role="alert" className={styles.error}>{error}</p>}<form onSubmit={guardar}><label>Motivo de moderación<textarea value={motivo} onChange={e=>setMotivo(e.target.value)} required minLength={10} maxLength={500} rows={2}/></label><div className={styles.actions}><Button type="submit" disabled={ocupado} className="button primary">{oferta.estadoModeracion==='permitida'?'Retirar publicación':'Levantar retirada'}</Button><Button type="button" disabled={ocupado} className="button outline" onClick={consultar}>Ver historial de moderación</Button></div></form>
 {historial&&<div className={styles.audit} aria-label="Historial de moderación">{historial.length===0?<p>Sin decisiones registradas.</p>:historial.map(a=><div key={a.version}><strong>{a.estadoAnterior} → {a.estadoNuevo}</strong><p>{a.motivo}</p><time dateTime={a.creadoEn}>{new Date(a.creadoEn).toLocaleString('es-PE',{timeZone:'America/Lima'})}</time></div>)}</div>}</article>;
}
export default function ModeracionOfertas(){
 const [datos,setDatos]=useState<PaginaOfertas|null>(null),[pagina,setPagina]=useState(1),[cargando,setCargando]=useState(true),[error,setError]=useState(''),[sinSesion,setSinSesion]=useState(false);
 async function cargar(page=pagina){setCargando(true);setError('');try{setDatos(await apiJson<PaginaOfertas>('/admin/publicaciones?page='+page));setPagina(page);setSinSesion(false);}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar.');setDatos(null);setSinSesion(e instanceof ErrorApi&&e.status===401);}finally{setCargando(false);}}
 useEffect(()=>{void cargar(1);},[]);
 return <section className={styles.panel} aria-labelledby="titulo-moderacion"><span className="eyebrow">ADMINISTRACIÓN</span><h1 id="titulo-moderacion">Moderar publicaciones</h1><p>Retira ofertas con motivo y conserva el historial de decisiones.</p>{cargando&&<p role="status">Cargando publicaciones…</p>}{error&&<p role="alert" className={styles.error}>{error}</p>}{sinSesion&&<Link href="/ingresar">Ingresar para moderar publicaciones</Link>}<Button className="button outline" type="button" disabled={cargando} onClick={()=>void cargar()}>Recargar moderación</Button>{datos&&<div className={styles.list}>{datos.total===0&&<p>No hay publicaciones.</p>}{datos.items.map(p=><Revision key={p.id+':'+p.version} oferta={p} onCambio={()=>void cargar()}/>)}<div className={styles.toolbar}><Button className="button outline" disabled={pagina<=1||cargando} onClick={()=>void cargar(pagina-1)}>Anterior</Button><span>Página {pagina} de {Math.max(1,Math.ceil(datos.total/20))}</span><Button className="button outline" disabled={pagina*20>=datos.total||cargando} onClick={()=>void cargar(pagina+1)}>Siguiente</Button></div></div>}<p><Link href="/cuenta">Volver a mi cuenta</Link></p></section>;
}
