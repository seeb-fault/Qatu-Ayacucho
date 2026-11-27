# Investigación — Operación

Decisión: un VPS Compose conforme ADR-010. Motivo: presupuesto y tamaño del equipo. Alternativa descartada inicialmente: cluster Kubernetes, por carga operativa.

Decisión: copias externas de DB y archivos, conforme ADR-012. Motivo: un volumen en el mismo host no protege su pérdida. Retención propuesta: 7 diarias/4 semanales, confirmar costo/política antes de operar.

Pendiente: host/dominio/presupuesto, repositorio de copias, cifrado, custodia de claves y alertas. Registrar elección con precio/fecha y ensayo, sin declarar disponibilidad mensual por una prueba breve.

## Decisiones de la etapa 1 (2026-11-16, Santiago Noe)

- **Host: AWS EC2 `m7i-flex.large`** (2 vCPU, 8 GB, Ubuntu 24.04), cubierto por el plan gratuito de cuentas nuevas: créditos limitados en monto y tiempo. Se registra como entorno de prueba con usuarios reales pocos; antes de agotar los créditos se saca una copia final y se decide el host definitivo.
- **Separado del CRM.** El VPS de Hostinger aloja el CRM de un cliente (Círculo de Abogados) con su propio Dokploy; Qatu no comparte máquina, panel ni accesos con él.
- **Dokploy** como plataforma: Docker Compose desde el repositorio (`infra/compose.production.yml`), Traefik con Let's Encrypt, variables en su UI, monitoreo por servicio y copias programadas de la base del compose hacia un destino S3. Sustituye a `infra/proxy/` del plan inicial.
- **Dominio `qatu.devpe.tech`** en la cuenta de Cloudflare que gestiona `devpe.tech`, en modo «DNS only»: no se tocan los ajustes del dominio, que comparte conecta360. El proxy de Cloudflare (013, etapa 3) queda opcional.
- **PostgreSQL oficial sin PostGIS**: ninguna migración lo usa.
- **Copias a Cloudflare R2** (`qatu-respaldos`), diarias a las 03:00 de Lima, conservando 14. La documentación de Dokploy no menciona R2 de forma explícita; se valida con la primera copia manual.
- **Imágenes** con Node 24: la API compila servidor y scripts operativos (migraciones al arrancar, administrador inicial, restauración); la web usa la salida *standalone* de Next solo dentro de Docker.
