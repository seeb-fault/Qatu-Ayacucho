import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const source=resolve(process.argv[2]??'../specs/004-catalogo-publicaciones/evidencias/carga-local.json');
const data=JSON.parse(await readFile(source,'utf8'));
const mib=n=>Math.round(n/1048576*10)/10;
function resources(name){const a=data.metrics[name]??[];let peakCpu=0;for(let i=1;i<a.length;i++){const elapsed=Date.parse(a[i].at)-Date.parse(a[i-1].at);if(elapsed>0){const cpu=(a[i].cpu.user+a[i].cpu.system)-(a[i-1].cpu.user+a[i-1].cpu.system);peakCpu=Math.max(peakCpu,cpu/(elapsed*10));}}return {samples:a.length,peakCpu:Math.round(peakCpu*10)/10,peakRss:mib(Math.max(0,...a.map(v=>v.memory.rss)))};}
const api=resources('api'),web=resources('web');
const stages=data.stages.filter(s=>s.measured);
const lines=[
 '# Resultado de carga local — Catálogo 004','',
 `- Tipo: **${data.kind}**. Estado: **${data.status}**. Objetivos locales: **${data.pass?'cumplidos':'no cumplidos / ejecución incompleta'}**.`,
 `- Inicio: ${data.startedAt}; fin: ${data.finishedAt??'no registrado'}.`,
 `- Commit inicial: ${data.source.head}; código con cambios locales al inicio: ${data.source.dirty?'sí':'no'}.`,
 `- SHA-256 de fuentes: ${data.source.sha256}; sin modificaciones durante la medición: ${data.source.unchanged?'sí':'no verificado'}.`,
 `- Build Next.js: ${data.source.frontendBuildId}.`,
 '',
 '## Condiciones','',
 `Host ${data.environment.platform} ${data.environment.release}, ${data.environment.cpuModel}, ${data.environment.logicalCpus} procesadores lógicos, ${mib(data.environment.totalRamBytes)} MiB RAM. Node ${data.environment.node}.`,
 '',
 `PostgreSQL: ${data.environment.postgres?.version}. max_connections=${data.environment.postgres?.max_connections}; shared_buffers=${data.environment.postgres?.shared_buffers}; work_mem=${data.environment.postgres?.work_mem}; effective_cache_size=${data.environment.postgres?.effective_cache_size}.`,
 '',
 `Base aislada: ${data.environment.database}. ${data.fixture.proveedores} proveedores, ${data.fixture.publicaciones} publicaciones, ${data.fixture.recursos} recursos; ${data.fixture.publicas} ofertas públicas.`,
 '',
 `Tráfico por proxy Next.js ${data.environment.proxyPort} hacia API ${data.environment.apiPort}. Calentamiento: ${data.environment.warmupSeconds}s; cada escalón: ${data.environment.stageSeconds}s; espera entre peticiones por usuario: ${data.environment.thinkTimeMs}ms. Mezcla 70% búsqueda y 30% detalle; límite 20 resultados.`,
 '',
 '## Medidas desde el proxy','',
 '| Usuarios | Peticiones | req/s | p50 ms | p95 ms | p99 ms | Errores técnicos | Fallos contrato | Objetivo local |',
 '|---:|---:|---:|---:|---:|---:|---:|---:|---|',
 ...stages.map(s=>`| ${s.users} | ${s.requests} | ${s.requestsPerSecond} | ${s.latency.p50Ms} | ${s.latency.p95Ms} | ${s.latency.p99Ms} | ${s.errors.technical} (${s.technicalErrorPercent}%) | ${s.errors.contract+s.errors.unexpectedStatus} | ${s.objective.pass?'PASS':'FAIL'} |`),
 '',
 '## Recursos y límites','',
 `- API: ${api.samples} muestras; pico RSS ${api.peakRss} MiB; pico CPU ${api.peakCpu}% de un núcleo.`,
 `- Next.js: ${web.samples} muestras; pico RSS ${web.peakRss} MiB; pico CPU ${web.peakCpu}% de un núcleo.`,
 `- PostgreSQL: máximo ${Math.max(0,...data.metrics.database.map(v=>v.connections??0))} conexiones en la base aislada; máximo ${Math.max(0,...data.metrics.database.map(v=>v.waitingLocks??0))} conexiones esperando locks.`,
 ...stages.map(s=>`- ${s.users} usuarios: CPU total del host ${s.host.cpuPercent}%; p95 del event loop del generador ${s.generator.eventLoopP95Ms}ms; CPU del generador ${s.generator.cpuCorePercent}% de un núcleo.`),
 '',
 ...data.limitations.map(l=>'- '+l),
 '- Los escalones son cinco minutos cada uno en el protocolo completo; no equivalen a quince minutos independientes por nivel.',
 '- EQ-01/EQ-03 globales, mezcla con Reservas, infraestructura VPS y aceptación humana de EQ-06 siguen pendientes.',
 '- No se prueba disponibilidad para alquiler ni se ejecutan cobros.',
 '',
 'El JSON adyacente conserva histogramas resumidos, muestras de recursos, distribución de estados y huella del código. Un diagnóstico corto no es aceptación de rendimiento.','',
];
const target=source.replace(/\.json$/,'.md');if(target===source)throw new Error('El informe de entrada debe terminar en .json');await writeFile(target,lines.join('\n'));console.log(target);
