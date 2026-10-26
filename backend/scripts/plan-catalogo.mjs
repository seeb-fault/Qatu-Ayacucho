import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import pg from 'pg';
const require=createRequire(import.meta.url),{PostgresCatalogo}=require('../dist/modules/catalogo/infraestructura/postgres.js');
const database=new URL(process.env.BENCH_DATABASE_URL??'postgresql://invalid/');
assert(['127.0.0.1','localhost'].includes(database.hostname)&&/^\/qatu_[a-z0-9_]*load_test$/.test(database.pathname),'Usa exclusivamente la base local de carga.');
const root=resolve('..'),out=resolve(process.argv[2]??'../.local-reconstruccion/catalogo-plan.json'),rel=relative(root,out).replaceAll('\\','/');
assert(!isAbsolute(rel)&&!rel.startsWith('..')&&(rel.startsWith('.local-reconstruccion/')||rel.startsWith('specs/004-catalogo-publicaciones/evidencias/'))&&rel.endsWith('.json'),'Ruta de informe inválida.');
const pool=new pg.Pool({connectionString:database.href,max:2});
try{
 let captured;
 const observed={query:async(text,args)=>{captured={text,args};return pool.query(text,args);}};
 const repo=new PostgresCatalogo(observed),providers=(await pool.query('SELECT id FROM proveedores ORDER BY id')).rows.map(r=>r.id);
 const result=await repo.listar({q:'',tipo:'',categoriaId:'',zonaId:'',page:1,limit:20,orden:'recomendados'},{habilitados:providers});
 assert.equal(result.total,800);assert.equal(result.items.length,20);
 const plan=(await pool.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+captured.text,captured.args)).rows[0]['QUERY PLAN'];
 const nodes=[];function walk(n){nodes.push({node:n['Node Type'],relation:n['Relation Name'],index:n['Index Name'],rows:n['Actual Rows'],loops:n['Actual Loops'],timeMs:n['Actual Total Time']});for(const c of n.Plans??[])walk(c);}walk(plan[0].Plan);
 const data={measuredAt:new Date().toISOString(),dataset:{providers:100,publications:1000,public:800},page:20,sourceSha256:createHash('sha256').update(await readFile('src/modules/catalogo/infraestructura/postgres.ts')).digest('hex'),compiledSha256:createHash('sha256').update(await readFile('dist/modules/catalogo/infraestructura/postgres.js')).digest('hex'),executionTimeMs:plan[0]['Execution Time'],planningTimeMs:plan[0]['Planning Time'],nodes,plan};
 await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({out,executionTimeMs:data.executionTimeMs,resources:nodes.filter(n=>n.relation==='catalogo_recursos')}));
}finally{await pool.end();}
