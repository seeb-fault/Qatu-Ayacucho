import { crearApp } from './app';
import { direccionEscucha } from './shared/infraestructura/proxies';

async function main() {
  const host = direccionEscucha(process.env.QATU_HOST);
  const app = await crearApp();
  await app.listen(Number(process.env.PORT ?? 3001), host);
  console.log(host === '127.0.0.1' ? 'API Qatu disponible en loopback.' : `API Qatu escuchando en ${host} (red interna).`);
}

main().catch(() => { console.error('No se pudo iniciar Qatu. Revisa la configuración del backend.'); process.exitCode = 1; });
