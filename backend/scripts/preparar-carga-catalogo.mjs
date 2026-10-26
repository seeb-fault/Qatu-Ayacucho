import {readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),backend=resolve(dirname(fileURLToPath(import.meta.url)),'..'),frontend=resolve(backend,'../frontend');
const files=['tsconfig.json','next-env.d.ts'];
const originals=await Promise.all(files.map(name=>readFile(resolve(frontend,name))));
function run(script,args,cwd,env=process.env){return new Promise((ok,bad)=>{const child=spawn(process.execPath,[script,...args],{cwd,env,stdio:'inherit',windowsHide:true});child.once('error',bad);child.once('exit',code=>code===0?ok():bad(new Error('La compilación terminó con código '+code)));});}
try{
 await run(require.resolve('typescript/bin/tsc'),['-p','tsconfig.json'],backend);
 await run(resolve(frontend,'node_modules/next/dist/bin/next'),['build'],frontend,{...process.env,QATU_NEXT_DIST_DIR:'.next-carga',QATU_API_URL:'http://127.0.0.1:3301',QATU_CATALOGO:'persistido',NEXT_TELEMETRY_DISABLED:'1'});
}finally{await Promise.all(files.map((name,i)=>writeFile(resolve(frontend,name),originals[i])));}
console.log('API compilada y build .next-carga listo para la base aislada; archivos TypeScript originales conservados.');
