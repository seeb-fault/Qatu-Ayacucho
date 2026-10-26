import assert from 'node:assert/strict';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {execFile,execFileSync,fork} from 'node:child_process';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {parseArgs,promisify} from 'node:util';
import os from 'node:os';
import {performance,monitorEventLoopDelay} from 'node:perf_hooks';
import {setTimeout as sleep} from 'node:timers/promises';
import net from 'node:net';
import pg from 'pg';
const {Pool}=pg;
const require=createRequire(import.meta.url),execute=promisify(execFile);
const backend=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(backend,'..'),frontend=resolve(repo,'frontend');
const {values}=parseArgs({options:{'warmup-seconds':{type:'string',default:'300'},'stage-seconds':{type:'string',default:'300'},'output':{type:'string',default:'../specs/004-catalogo-publicaciones/evidencias/carga-local.json'},'label':{type:'string',default:'catalogo-004'}}});
const warmup=Number(values['warmup-seconds']),duration=Number(values['stage-seconds']);
assert(Number.isInteger(warmup)&&warmup>=1&&warmup<=3600&&Number.isInteger(duration)&&duration>=1&&duration<=3600,'Duraciones inválidas.');
const database=new URL(process.env.BENCH_DATABASE_URL??'postgresql://invalid/');
assert(['127.0.0.1','localhost'].includes(database.hostname)&&/^\/qatu_[a-z0-9_]*load_test$/.test(database.pathname),'BENCH_DATABASE_URL debe señalar una base Qatu local exclusiva terminada en load_test.');
const output=resolve(backend,values.output),reportPath=relative(repo,output).replaceAll('\\','/');assert(!isAbsolute(reportPath)&&!reportPath.startsWith('..')&&(reportPath.startsWith('.local-reconstruccion/')||reportPath.startsWith('specs/004-catalogo-publicaciones/evidencias/'))&&reportPath.endsWith('.json'),'Usa una ruta JSON de evidencias de 004 o .local-reconstruccion.');
const apiPort=3301,webPort=3310,apiUrl='http://127.0.0.1:'+apiPort,webUrl='http://127.0.0.1:'+webPort;
const monitor=resolve(backend,'scripts/carga/metricas.cjs');
const pool=new Pool({connectionString:database.href,max:2,connectionTimeoutMillis:5000});
const children=[],stderr=[],metrics={api:[],web:[],database:[],docker:[]};
let sampling=false,dockerSampling=false;
const report={protocol:'catalogo-local-escalonado-v1',label:values.label,kind:warmup>=300&&duration>=300?'carga-local':'diagnostico-corto',startedAt:new Date().toISOString(),status:'preparando',environment:{},fixture:{},stages:[],metrics,limitations:['Ensayo local compartiendo host; no VPS','Sin Reservas, sin 5000 reservas y sin mezcla global 70/20/10','No acredita EQ-06 con cinco participantes'],source:{}};
function git(...args){return execFileSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true}).trim();}
async function fingerprint(){
 const names=git('ls-files','--cached','--others','--exclude-standard','backend/src','backend/migrations','frontend/src','frontend/next.config.ts','backend/scripts/carga-catalogo.mjs','backend/scripts/carga/metricas.cjs').split(/\r?\n/).filter(Boolean).sort();
 const hash=createHash('sha256');for(const name of names){hash.update(name+'\0');hash.update(await readFile(resolve(repo,name)));}return {sha256:hash.digest('hex'),files:names.length};
}
async function save(){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');}
async function freePort(port){await new Promise((ok,bad)=>{const server=net.createServer();server.once('error',bad);server.listen(port,'127.0.0.1',()=>server.close(ok));});}
function launch(name,path,env){
 const child=fork(path,name==='web'?['start','--hostname','127.0.0.1','--port',String(webPort)]:[],{cwd:name==='web'?frontend:backend,execArgv:['--require',monitor],env:{...process.env,...env},silent:true,windowsHide:true});
 children.push(child);child.on('message',message=>{if(message?.type==='qatu-carga-metricas')metrics[name].push(message);});
 child.stderr.on('data',buffer=>{const message=String(buffer).replaceAll(database.href,'[DATABASE_URL]');stderr.push({process:name,message:message.slice(-600)});if(stderr.length>30)stderr.shift();});
 return child;
}
async function ready(url,child){const start=performance.now();while(performance.now()-start<120000){if(child.exitCode!==null)throw new Error('Servidor de carga terminó antes de estar disponible.');try{const r=await fetch(url,{signal:AbortSignal.timeout(2000)});await r.arrayBuffer();if(r.ok)return;}catch{}await sleep(300);}throw new Error('Servidor no disponible en 120 segundos.');}
async function fixture(){
 const existing=await pool.query('SELECT (SELECT count(*)::int FROM usuarios) AS total,(SELECT count(*)::int FROM proveedores) AS proveedores,(SELECT count(*)::int FROM catalogo_publicaciones) AS publicaciones');
 if(existing.rows[0].total===0){
  assert.equal(existing.rows[0].proveedores,0,'La base contiene proveedores ajenos al fixture.');assert.equal(existing.rows[0].publicaciones,0,'La base contiene publicaciones ajenas al fixture.');
  const {ScryptPasswords}=require('../dist/modules/usuarios/infraestructura/passwords.js');
  const hash=await new ScryptPasswords().crear(randomBytes(24).toString('base64url'));
  const c=await pool.connect();
  try{await c.query('BEGIN');
   for(let i=0;i<100;i++){
    const user=randomUUID(),provider=randomUUID();
    await c.query('INSERT INTO usuarios(id,email_normalizado,nombre,password_hash) VALUES($1,$2,$3,$4)',[user,'proveedor-'+i+'@carga.invalid','Proveedor sintético '+i,hash]);
    await c.query("INSERT INTO roles_usuario(usuario_id,rol) VALUES($1,'cliente'),($1,'proveedor')",[user]);
    await c.query("INSERT INTO proveedores(id,usuario_id,nombre_publico,descripcion,zona_id,visible_publicamente,estado_verificacion) VALUES($1,$2,$3,$4,$5,true,'aprobada')",[provider,user,'Taller sintético '+i,'Actividad sintética exclusiva para evaluar búsquedas del catálogo.',['ayacucho','san-juan-bautista','carmen-alto','jesus-nazareno'][i%4]]);
    for(let n=0;n<10;n++){
     const id=randomUUID(),tool=n<5,category=['perforacion','corte','pintura','jardineria','limpieza','gasfiteria','electricidad','carpinteria','pintor','jardinero'][n];
     const title=['Taladro eléctrico','Sierra circular','Equipo de pintura','Podadora de jardín','Hidrolavadora de presión','Gasfitería del hogar','Electricista local','Carpintería a medida','Pintura de paredes','Jardinería local'][n]+' '+String(i).padStart(3,'0');
     await c.query('INSERT INTO catalogo_publicaciones(id,proveedor_id,tipo,categoria_id,zona_id,titulo,descripcion,incluye,condiciones,activa,estado_moderacion) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[id,provider,tool?'herramienta':'servicio',category,['ayacucho','san-juan-bautista','carmen-alto','jesus-nazareno'][i%4],title,'Solución para proyectos de mantenimiento, reparación y mejora del hogar en Ayacucho. Datos sintéticos para pruebas de búsqueda y filtros. Taladro y herramientas cuando corresponde al tipo de oferta.',JSON.stringify(['Recurso indicado en la oferta','Orientación sobre el alcance']),JSON.stringify(['Coordinación previa con proveedor','Tarifa explícita, sin disponibilidad confirmada']),(i+n)%10!==0,(i+n)%10===1?'retirada':'permitida']);
     const variable=!tool&&n%2===1;
     await c.query('INSERT INTO catalogo_tarifas(publicacion_id,modalidad,monto_centimos,unidad) VALUES($1,$2,$3,$4)',[id,variable?'cotizacion':'fija',variable?null:1500+i*35+n*100,variable?null:tool?'día':'servicio']);
     for(let r=0;r<(tool?2:1);r++)await c.query('INSERT INTO catalogo_recursos(id,publicacion_id,clase,identificador,activo) VALUES($1,$2,$3,$4,true)',[randomUUID(),id,tool?'unidad_fisica':'agenda',tool?'Unidad '+(r+1):'Agenda principal']);
    }
   }
   await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
 const counts=(await pool.query(`SELECT (SELECT count(*)::int FROM usuarios) AS usuarios,(SELECT count(*)::int FROM usuarios WHERE email_normalizado LIKE '%@carga.invalid') AS sinteticos,(SELECT count(*)::int FROM proveedores) AS proveedores,(SELECT count(*)::int FROM catalogo_publicaciones) AS publicaciones,(SELECT count(*)::int FROM catalogo_recursos) AS recursos,(SELECT count(*)::int FROM catalogo_publicaciones WHERE activa AND estado_moderacion='permitida') AS publicas`)).rows[0];
 assert.deepEqual(counts,{usuarios:100,sinteticos:100,proveedores:100,publicaciones:1000,recursos:1500,publicas:800},'La base no coincide con el fixture exclusivo; no se modifica ni borra.');
 const distribution=await pool.query("SELECT categoria_id,count(*)::int AS total FROM catalogo_publicaciones WHERE activa AND estado_moderacion='permitida' GROUP BY categoria_id");
 assert.equal(distribution.rows.length,10);assert(distribution.rows.every(r=>r.total===80),'El fixture debe distribuir 80 ofertas públicas por categoría.');
 await pool.query('ANALYZE');
 return {...counts,ids:(await pool.query("SELECT id FROM catalogo_publicaciones WHERE activa AND estado_moderacion='permitida' ORDER BY id")).rows.map(row=>row.id)};
}
function histogram(){const buckets=new Uint32Array(60001);let count=0,sum=0,max=0;return {record(ms){const n=Math.min(60000,Math.ceil(ms));buckets[n]++;count++;sum+=ms;max=Math.max(max,ms);},summary(){function p(q){let seen=0;for(let i=0;i<buckets.length;i++){seen+=buckets[i];if(seen>=Math.ceil(count*q))return i;}return 0;}return {count,p50Ms:p(.5),p95Ms:p(.95),p99Ms:p(.99),meanMs:count?Math.round(sum/count*100)/100:0,maxMs:Math.round(max*100)/100};}};}
function checkOffer(item){assert(item?.id&&publicIds.has(item.id)&&item.proveedor?.estadoVerificacion==='aprobada');assert.equal(item.moneda,'PEN');assert(!Object.hasOwn(item,'usuarioId')&&!Object.hasOwn(item,'version')&&!Object.hasOwn(item,'estadoModeracion')&&!Object.hasOwn(item.proveedor,'email'));assert(Array.isArray(item.recursos)&&item.recursos.length>0&&item.recursos.every(r=>r.id&&r.activo));if(item.modalidadPrecio==='cotizacion'){assert.equal(item.tipo,'servicio');assert.equal(item.tarifaCentimos,null);assert.equal(item.unidad,null);}else{assert(Number.isInteger(item.tarifaCentimos)&&item.tarifaCentimos>0);assert.equal(item.unidad,item.tipo==='herramienta'?'día':'servicio');}}
let requestIndex=0;
let publicIds=new Set();
const searches=['?limit=20','?q=electrico&limit=20','?tipo=herramienta&categoriaId=pintura&zonaId=ayacucho&limit=20','?precioMaximoCentimos=6000&orden=precio&limit=20','?tipo=servicio&orden=nombre&limit=20','?page=2&limit=20','?q=mantenimiento&zonaId=carmen-alto&limit=20'];
async function phase(name,users,seconds,measured){
 const all=histogram(),successful=histogram(),byType={search:histogram(),detail:histogram()},statuses={},errors={technical:0,contract:0,unexpectedStatus:0},examples=[];
 const startedAt=new Date().toISOString(),hostBefore=os.cpus().reduce((a,c)=>({idle:a.idle+c.times.idle,total:a.total+Object.values(c.times).reduce((x,y)=>x+y,0)}),{idle:0,total:0});
 const start=performance.now(),deadline=start+seconds*1000,initialCpu=process.cpuUsage(),loop=monitorEventLoopDelay({resolution:20});loop.enable();
 let count=0,searchCount=0,detailCount=0,lastProgress=start;
 const progress=setInterval(()=>{void sampleDocker();console.log(JSON.stringify({event:'progreso',phase:name,users,elapsedSeconds:Math.round((performance.now()-start)/1000),requests:count,technicalErrors:errors.technical,contractErrors:errors.contract}));},30000);
 const statsTimer=setInterval(()=>void sample(),5000);
 async function worker(){while(performance.now()<deadline){
  const index=requestIndex++,isSearch=index%10<7,type=isSearch?'search':'detail',path=isSearch?'/api/v1/publicaciones'+searches[index%searches.length]:'/api/v1/publicaciones/'+report.fixture.ids[index%report.fixture.ids.length];
  const t=performance.now();let code='network';
  try{const response=await fetch(webUrl+path,{signal:AbortSignal.timeout(10000)});code=String(response.status);const body=await response.text();
   if(response.status>=500)errors.technical++;else if(response.status!==200)errors.unexpectedStatus++;
   if(response.status===200){try{const data=JSON.parse(body);if(isSearch){assert.equal(data.limit,20);assert(data.items.length<=20);data.items.forEach(checkOffer);}else checkOffer(data);successful.record(performance.now()-t);}catch{errors.contract++;if(examples.length<5)examples.push({type,status:200,error:'Contrato público inválido'});}}
  }catch(e){errors.technical++;code=e.name==='TimeoutError'?'timeout':'network';if(examples.length<5)examples.push({type,status:code,error:e.name});}
  const elapsed=performance.now()-t;all.record(elapsed);byType[type].record(elapsed);statuses[code]=(statuses[code]??0)+1;count++;if(isSearch)searchCount++;else detailCount++;
  if(performance.now()<deadline)await sleep(Math.min(250,Math.max(0,deadline-performance.now())));
 }}
 try{await Promise.all(Array.from({length:users},worker));}finally{clearInterval(progress);clearInterval(statsTimer);loop.disable();}
 const elapsed=(performance.now()-start)/1000,cpu=process.cpuUsage(initialCpu),latency=all.summary();
 const hostAfter=os.cpus().reduce((a,c)=>({idle:a.idle+c.times.idle,total:a.total+Object.values(c.times).reduce((x,y)=>x+y,0)}),{idle:0,total:0});
 const result={name,startedAt,measured,users,host:{cpuPercent:Math.round((1-(hostAfter.idle-hostBefore.idle)/(hostAfter.total-hostBefore.total))*10000)/100,freeRamBytes:os.freemem()},plannedSeconds:seconds,elapsedSeconds:Math.round(elapsed*100)/100,requests:count,searchCount,detailCount,requestsPerSecond:Math.round(count/elapsed*100)/100,latency,successful:successful.summary(),search:byType.search.summary(),detail:byType.detail.summary(),statuses,errors,technicalErrorPercent:Math.round(errors.technical/Math.max(1,count)*100000)/1000,generator:{cpuCorePercent:Math.round((cpu.user+cpu.system)/(elapsed*10000)*100)/100,eventLoopP95Ms:Math.round(loop.percentile(95)/1e4)/100,rssBytes:process.memoryUsage().rss},examples};
 result.objective={p95LimitMs:users<=30?1000:2000,pass:latency.p95Ms<=(users<=30?1000:2000)&&result.technicalErrorPercent<1&&errors.contract===0&&errors.unexpectedStatus===0};
 report.stages.push(result);console.log(JSON.stringify({event:'fase-completa',...result}));await save();return result;
}
async function sample(){if(sampling)return;sampling=true;try{const r=await pool.query("SELECT count(*)::int AS connections,count(*) FILTER(WHERE state='active')::int AS active,count(*) FILTER(WHERE wait_event_type='Lock')::int AS waitingLocks FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid()");metrics.database.push({at:new Date().toISOString(),...r.rows[0]});}catch{metrics.database.push({at:new Date().toISOString(),unavailable:true});}finally{sampling=false;}}
async function sampleDocker(){
 if(dockerSampling)return;dockerSampling=true;
 try{const {stdout}=await execute('docker',['stats','--no-stream','--format','{{json .}}','qatu-local-db-1'],{timeout:10000,windowsHide:true});const d=JSON.parse(stdout.trim());metrics.docker.push({at:new Date().toISOString(),cpuPercent:d.CPUPerc,memory:d.MemUsage,memoryPercent:d.MemPerc,blockIO:d.BlockIO,pids:d.PIDs});}
 catch{metrics.docker.push({at:new Date().toISOString(),unavailable:true});}
 finally{dockerSampling=false;}
}
async function main(){
 await freePort(apiPort);await freePort(webPort);await stat(resolve(backend,'dist/main.js'));
 const manifest=JSON.parse(await readFile(resolve(frontend,'.next-carga/routes-manifest.json'),'utf8'));
 assert(JSON.stringify(manifest.rewrites).includes(apiUrl+'/api/v1/:path*'),'El build .next-carga no apunta a la API aislada 3301.');
 const buildId=(await readFile(resolve(frontend,'.next-carga/BUILD_ID'),'utf8')).trim();
 report.source={head:git('rev-parse','HEAD'),dirty:git('status','--porcelain').length>0,...await fingerprint(),frontendBuildId:buildId};
 report.environment={node:process.version,platform:os.platform(),release:os.release(),arch:os.arch(),cpuModel:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalRamBytes:os.totalmem(),freeRamAtStartBytes:os.freemem(),database:database.pathname.slice(1),apiPort,proxyPort:webPort,thinkTimeMs:250,warmupSeconds:warmup,stageSeconds:duration,postgres:(await pool.query("SELECT version(),current_setting('max_connections') AS max_connections,current_setting('shared_buffers') AS shared_buffers,current_setting('work_mem') AS work_mem,current_setting('effective_cache_size') AS effective_cache_size")).rows[0]};
 report.fixture=await fixture();publicIds=new Set(report.fixture.ids);await sampleDocker();await save();
 const api=launch('api',resolve(backend,'dist/main.js'),{DATABASE_URL:database.href,JWT_SECRET:randomBytes(32).toString('hex'),DOCUMENTOS_KEY:randomBytes(32).toString('hex'),APP_ORIGIN:webUrl,NODE_ENV:'test',PORT:String(apiPort)});await ready(apiUrl+'/api/v1/publicaciones/opciones',api);
 const web=launch('web',resolve(frontend,'node_modules/next/dist/bin/next'),{QATU_NEXT_DIST_DIR:'.next-carga',QATU_API_URL:apiUrl,QATU_CATALOGO:'persistido',NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1'});await ready(webUrl+'/api/v1/publicaciones?limit=20',web);
 const control=await (await fetch(webUrl+'/api/v1/publicaciones?limit=20')).json();assert.equal(control.total,800);assert.equal(control.items.length,20);control.items.forEach(checkOffer);
 report.status='ejecutando';console.log(JSON.stringify({event:'inicio',output,fixture:{proveedores:100,publicaciones:1000,publicas:800},warmupSeconds:warmup,stageSeconds:duration}));
 await phase('calentamiento',30,warmup,false);
 for(const users of [10,30,60])await phase('usuarios-'+users,users,duration,true);
 const end=await fingerprint();report.source.endHead=git('rev-parse','HEAD');report.source.unchanged=end.sha256===report.source.sha256;
 report.status=report.source.unchanged?'completado':'invalidado-codigo-modificado';report.finishedAt=new Date().toISOString();report.pass=report.source.unchanged&&report.stages.filter(s=>s.measured).every(s=>s.objective.pass);
 report.serverDiagnostics=stderr;await save();console.log(JSON.stringify({event:'resultado',pass:report.pass,status:report.status,output}));
 if(!report.pass)process.exitCode=2;
}
try{await main();}catch(e){report.status='fallido';report.failure=e.message;report.serverDiagnostics=stderr;await save();console.error('Carga no completada: '+e.message);process.exitCode=1;}finally{for(const child of children){if(child.exitCode===null){child.kill('SIGTERM');await Promise.race([new Promise(ok=>child.once('exit',ok)),sleep(5000)]);if(child.exitCode===null)child.kill('SIGKILL');}}await pool.end();}
