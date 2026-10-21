import { crearApp } from './app';

async function main() {
  const app = await crearApp();
  await app.listen(Number(process.env.PORT ?? 3001), '127.0.0.1');
  console.log('API Qatu disponible en loopback.');
}

main().catch(() => { console.error('No se pudo iniciar Qatu. Revisa la configuración del backend.'); process.exitCode = 1; });
