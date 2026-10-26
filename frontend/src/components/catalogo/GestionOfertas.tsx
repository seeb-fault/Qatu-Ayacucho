'use client';
import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {Button} from 'primereact/button';
import {InputText} from 'primereact/inputtext';
import {apiJson,ErrorApi} from '@/lib/api/http';
import type {Proveedor} from '@/lib/api/proveedores';
import type {DatosPublicacion,PublicacionPropia,OpcionesCatalogo,PaginaOfertas} from '@/lib/api/catalogo';
import styles from './catalogo.module.css';
const inicial:DatosPublicacion={tipo:'herramienta',categoriaId:'perforacion',zonaId:'ayacucho',titulo:'',descripcion:'',incluye:['Equipo y accesorios indicados'],condiciones:['Coordinar retiro y devolución con el proveedor'],modalidadPrecio:'fija',tarifaCentimos:3500,unidad:'día',activa:true,recursos:[{identificador:'Unidad 1',activo:true}]};
export default function GestionOfertas(){
 const [perfil,setPerfil]=useState<Proveedor|null>(null),[opciones,setOpciones]=useState<OpcionesCatalogo|null>(null),[datos,setDatos]=useState<DatosPublicacion>(inicial),[editando,setEditando]=useState<PublicacionPropia|null>(null);
 const [pagina,setPagina]=useState(1),[listado,setListado]=useState<PaginaOfertas|null>(null),[cargando,setCargando]=useState(true),[guardando,setGuardando]=useState(false),[error,setError]=useState(''),[mensaje,setMensaje]=useState(''),[sinSesion,setSinSesion]=useState(false),[precio,setPrecio]=useState('35.00');
 const [incluye,setIncluye]=useState(inicial.incluye.join('\n')),[condiciones,setCondiciones]=useState(inicial.condiciones.join('\n'));
 const habilitado=perfil?.estadoVerificacion==='aprobada'&&perfil.visiblePublicamente;
 function fallo(e:unknown){setError(e instanceof Error?e.message:'No se pudo completar la operación.');if(e instanceof ErrorApi&&e.status===401){setSinSesion(true);setPerfil(null);setListado(null);}}
 async function cargar(page=pagina){setCargando(true);setError('');try{
   const [op,p]=await Promise.all([apiJson<OpcionesCatalogo>('/publicaciones/opciones'),apiJson<Proveedor>('/proveedores/me').catch(e=>{if(e instanceof ErrorApi&&e.status===404)return null;throw e;})]);
   setOpciones(op);setPerfil(p);setSinSesion(false);
   if(p){const lista=await apiJson<PaginaOfertas>('/publicaciones/mias?page='+page);setListado(lista);setPagina(page);}else setListado(null);
 }catch(e){fallo(e);}finally{setCargando(false);}}
 useEffect(()=>{void cargar(1);},[]);
 function nueva(){setEditando(null);setDatos(inicial);setPrecio('35.00');setIncluye(inicial.incluye.join('\n'));setCondiciones(inicial.condiciones.join('\n'));setMensaje('');}
 function editar(p:PublicacionPropia){setEditando(p);setDatos({tipo:p.tipo,categoriaId:p.categoriaId,zonaId:p.zonaId,titulo:p.titulo,descripcion:p.descripcion,incluye:p.incluye,condiciones:p.condiciones,modalidadPrecio:p.modalidadPrecio,tarifaCentimos:p.tarifaCentimos,unidad:p.unidad,activa:p.activa,recursos:p.recursos});setPrecio(p.tarifaCentimos===null?'':(p.tarifaCentimos/100).toFixed(2));setIncluye(p.incluye.join('\n'));setCondiciones(p.condiciones.join('\n'));setMensaje('');document.getElementById('editor-oferta')?.scrollIntoView({block:'start',behavior:'smooth'});}
 async function guardar(e:FormEvent){e.preventDefault();setGuardando(true);setError('');setMensaje('');try{
  const monetario=/^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(precio);
  if(datos.modalidadPrecio==='fija'&&!monetario)throw new Error('Indica un precio válido con hasta dos decimales.');
  const centimos=datos.modalidadPrecio==='cotizacion'?null:Number(monetario![1])*100+Number((monetario![2]??'').padEnd(2,'0'));
  const body={...datos,tarifaCentimos:centimos,unidad:datos.modalidadPrecio==='cotizacion'?null:datos.tipo==='herramienta'?'día':'servicio',incluye:incluye.split('\n').map(s=>s.trim()).filter(Boolean),condiciones:condiciones.split('\n').map(s=>s.trim()).filter(Boolean),...(editando?{versionActual:editando.version}:{})};
  const guardada=await apiJson<PublicacionPropia>('/publicaciones'+(editando?'/'+editando.id:''),editando?'PATCH':'POST',body);
  editar(guardada);await cargar(1);setMensaje('Tu oferta se guardó correctamente.');
 }catch(e){fallo(e);}finally{setGuardando(false);}}
 return <section className={styles.panel} aria-labelledby="titulo-ofertas"><span className="eyebrow">COMPARTE LO QUE TIENES Y LO QUE SABES</span><h1 id="titulo-ofertas">Publicar una oferta</h1><p>Ofrece herramientas de alquiler o tus servicios en Ayacucho.</p>
 {cargando&&<p role="status">Cargando tus publicaciones…</p>}{error&&<p role="alert" className={styles.error}>{error}</p>}{mensaje&&<p role="status" className={styles.success}>{mensaje}</p>}
 {sinSesion&&<p><Link href="/ingresar">Ingresar para publicar una oferta</Link></p>}
 {!cargando&&!sinSesion&&!habilitado&&<div className={styles.notice}><h2>Prepara tu perfil para publicar</h2><p>Necesitas un perfil de proveedor con verificación documental aprobada y la opción de mostrarlo públicamente activada.</p><Link href="/proveedor" className="button primary">Completar mi perfil de proveedor</Link></div>}
 {!cargando&&habilitado&&opciones&&<form id="editor-oferta" className={styles.form} onSubmit={guardar} aria-label="Editor de oferta"><div className={styles.toolbar}><h2>{editando?'Editar oferta':'Nueva oferta'}</h2>{editando&&<Button type="button" className="button outline" onClick={nueva}>Crear otra oferta</Button>}</div>
 <fieldset disabled={guardando} className={styles.fields}>
 <div className={styles.columns}><label>Tipo<select value={datos.tipo} disabled={!!editando} onChange={e=>{const tipo=e.target.value as DatosPublicacion['tipo'];setDatos({...datos,tipo,categoriaId:tipo==='herramienta'?'perforacion':'gasfiteria',modalidadPrecio:tipo==='herramienta'?'fija':'cotizacion',recursos:[{identificador:tipo==='herramienta'?'Unidad 1':'Agenda principal',activo:true}]});}}><option value="herramienta">Herramienta de alquiler</option><option value="servicio">Servicio u oficio</option></select></label>
 <label>Categoría<select value={datos.categoriaId} onChange={e=>setDatos({...datos,categoriaId:e.target.value})}>{opciones.categorias.filter(c=>c.tipo===datos.tipo).map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label></div>
 <label>Título<InputText value={datos.titulo} onChange={e=>setDatos({...datos,titulo:e.target.value})} required minLength={5} maxLength={120}/></label>
 <label>Descripción<textarea value={datos.descripcion} onChange={e=>setDatos({...datos,descripcion:e.target.value})} required minLength={20} maxLength={3000} rows={4}/></label>
 <label>Distrito<select value={datos.zonaId} onChange={e=>setDatos({...datos,zonaId:e.target.value})}>{opciones.zonas.map(z=><option value={z.id} key={z.id}>{z.nombre}</option>)}</select></label>
 <div className={styles.columns}><label>Modalidad de precio<select value={datos.modalidadPrecio} onChange={e=>setDatos({...datos,modalidadPrecio:e.target.value as 'fija'|'cotizacion'})}><option value="fija">Tarifa fija</option>{datos.tipo==='servicio'&&<option value="cotizacion">A cotizar</option>}</select></label>{datos.modalidadPrecio==='fija'&&<label>Tarifa en soles ({datos.tipo==='herramienta'?'por día':'por servicio'})<input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} min="0.01" max="999999.99" step="0.01" required/></label>}</div>
 <div className={styles.columns}><label>Qué incluye (un punto por línea)<textarea value={incluye} onChange={e=>setIncluye(e.target.value)} required rows={3}/></label><label>Condiciones (un punto por línea)<textarea value={condiciones} onChange={e=>setCondiciones(e.target.value)} required rows={3}/></label></div>
 <div><h3>{datos.tipo==='herramienta'?'Unidades físicas':'Agenda del servicio'}</h3><p className={styles.hint}>Cada unidad conserva su identidad. Puedes desactivarla; no es una confirmación de disponibilidad.</p>{datos.recursos.map((r,i)=><div className={styles.resource} key={r.id??i}><label>Identificador {i+1}<InputText value={r.identificador} required maxLength={80} onChange={e=>setDatos({...datos,recursos:datos.recursos.map((v,j)=>j===i?{...v,identificador:e.target.value}:v)})}/></label><label className={styles.check}><input type="checkbox" checked={r.activo} onChange={e=>setDatos({...datos,recursos:datos.recursos.map((v,j)=>j===i?{...v,activo:e.target.checked}:v)})}/>Unidad activa {i+1}</label></div>)}{datos.tipo==='herramienta'&&datos.recursos.length<20&&<Button type="button" className="button outline" onClick={()=>setDatos({...datos,recursos:[...datos.recursos,{identificador:'Unidad '+(datos.recursos.length+1),activo:true}]})}>Añadir unidad</Button>}</div>
 {editando?.estadoModeracion==='retirada'&&<p className={styles.notice}>Esta oferta está retirada por moderación. Desmarca «Oferta activa» para guardar correcciones; solo administración puede levantar la retirada.</p>}
 <label className={styles.check}><input type="checkbox" checked={datos.activa} onChange={e=>setDatos({...datos,activa:e.target.checked})}/>Oferta activa</label><p className={styles.hint}>La categoría asigna una ilustración de referencia. La tarifa y las condiciones se mostrarán públicamente. Reservas y pagos aún no están habilitados.</p>
 <Button type="submit" className="button primary">{guardando?'Guardando…':editando?'Guardar cambios de la oferta':'Publicar oferta'}</Button>
 </fieldset></form>}
 {listado&&<section className={styles.list} aria-label="Mis publicaciones"><div className={styles.toolbar}><h2>Mis publicaciones ({listado.total})</h2><Button type="button" className="button outline" disabled={guardando||cargando} onClick={()=>{nueva();void cargar();}}>Recargar publicaciones</Button></div>{listado.total===0&&<p>Aún no has publicado ofertas. Empieza con la herramienta o el oficio que quieras compartir.</p>}{listado.items.map(p=><article className={styles.item} key={p.id} aria-label={p.titulo}><div><h3>{p.titulo}</h3><p>{p.estadoModeracion==='retirada'?'Retirada por moderación':p.activa?'Activa':'Inactiva'} · {p.tipo==='herramienta'?'Herramienta':'Servicio'}</p></div><div className={styles.actions}>{habilitado&&<Button type="button" className="button outline" onClick={()=>editar(p)}>Editar {p.titulo}</Button>}{p.activa&&p.estadoModeracion==='permitida'&&habilitado&&<Link href={'/publicaciones/'+p.id}>Ver publicación</Link>}</div></article>)}<div className={styles.toolbar}><Button type="button" className="button outline" disabled={pagina<=1||cargando} onClick={()=>void cargar(pagina-1)}>Anterior</Button><span>Página {pagina} de {Math.max(1,Math.ceil(listado.total/20))}</span><Button type="button" className="button outline" disabled={pagina*20>=listado.total||cargando} onClick={()=>void cargar(pagina+1)}>Siguiente</Button></div></section>}
 <p><Link href="/cuenta">Volver a mi cuenta</Link> · <Link href="/buscar">Explorar catálogo</Link></p>
 </section>;
}
