# Despliegue de Qatu en AWS EC2 con Dokploy

Guía paso a paso (008). Resultado: Qatu en `https://qatu.devpe.tech`, en un servidor propio, **separado del VPS del CRM**.

```
Visitante ──HTTPS──► EC2 (AWS) ── Dokploy ── Traefik ──► web (Next.js) ──► api (NestJS) ──► db (PostgreSQL)
                                                                              └──► Cloudflare R2 (archivos cifrados)
DNS: Cloudflare, cuenta del dominio devpe.tech        Copias diarias de la base: R2
```

| Pieza | Para qué |
|---|---|
| AWS EC2 | La máquina (CPU, RAM, disco, IP). Se usa al crearla y para revisar créditos |
| Dokploy | Despliega, pone HTTPS, guarda variables, muestra logs y CPU/RAM, hace copias |
| Cloudflare | DNS de `devpe.tech` (registro `qatu`) y R2 (archivos y copias) |

> **Secretos:** nada de esta guía se guarda en Git ni se pega en chats. Las llaves van en el gestor de contraseñas y en la pestaña Environment de Dokploy.

---

## 1. Cuenta de AWS

1. Crea la cuenta en `aws.amazon.com` y elige el **plan gratuito** (Free plan). Las cuentas creadas desde el 15 de julio de 2025 reciben créditos por un tiempo limitado; revisa el saldo y la fecha en **Billing → Free Tier**.
2. Activa **MFA** en el usuario raíz: menú de la cuenta → **Security credentials** → **Assign MFA device**.
3. Crea una **alerta de presupuesto**: **Billing → Budgets → Create budget**, de US$ 1, con aviso a tu correo.

## 2. Crear el servidor (EC2)

**EC2 → Launch instance**. Elige la región arriba a la derecha antes de empezar: `us-east-1` (Virginia) es la más barata; `sa-east-1` (São Paulo) es la más cercana al Perú, pero cuesta más.

| Campo | Valor |
|---|---|
| Name | `qatu` |
| AMI | **Ubuntu Server 24.04 LTS** (64-bit x86) |
| Instance type | **`m7i-flex.large`** (2 vCPU, 8 GB). Debe decir *Free tier eligible*; si no aparece, usa `c7i-flex.large` (4 GB) |
| Key pair | **Create new key pair** → `qatu`, tipo ED25519, formato `.pem`. Se descarga una vez: guárdalo fuera del proyecto |
| Network → Security group | **Create security group** con las reglas de abajo |
| Storage | **30 GiB**, gp3 |

Reglas del grupo de seguridad:

| Tipo | Puerto | Origen |
|---|---|---|
| SSH | 22 | **My IP** |
| HTTP | 80 | Anywhere (0.0.0.0/0) |
| HTTPS | 443 | Anywhere (0.0.0.0/0) |
| Custom TCP | 3000 | **My IP** (solo para la instalación; se cierra en el paso 8) |

**Launch instance**.

## 3. IP fija (Elastic IP)

**EC2 → Elastic IPs → Allocate Elastic IP address → Allocate**. Luego **Actions → Associate** → instancia `qatu`. Anota esa IP: la llamaremos `IP_QATU`.

Una IP pública consume créditos (unos US$ 3–4 al mes). Si borras la instancia, libera también la IP.

## 4. Entrar al servidor por SSH (desde PowerShell)

```powershell
# Solo la primera vez: que el .pem lo pueda leer únicamente tu usuario
icacls "$HOME\Downloads\qatu.pem" /inheritance:r /grant:r "$($env:USERNAME):R"
ssh -i "$HOME\Downloads\qatu.pem" ubuntu@IP_QATU
```

Ya dentro del servidor:

```bash
sudo apt update && sudo apt upgrade -y
# 2 GB de swap: evita que la compilación de las imágenes se quede sin memoria
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 5. Instalar Dokploy

```bash
curl -sSL https://dokploy.com/install.sh | sudo sh
```

Requisitos de Dokploy: al menos 2 GB de RAM y 30 GB de disco, y los puertos 80, 443 y 3000 libres.

## 6. Crear el administrador de Dokploy

Abre `http://IP_QATU:3000`, crea tu usuario con una contraseña larga y guárdala en tu gestor de contraseñas. Si tu versión de Dokploy ofrece verificación en dos pasos (en el perfil), actívala.

## 7. DNS en Cloudflare (cuenta del dominio `devpe.tech`)

**devpe.tech → DNS → Records → Add record**, dos veces, con el proxy **en gris (DNS only)**:

| Type | Name | IPv4 |
|---|---|---|
| A | `qatu` | `IP_QATU` |
| A | `panel-qatu` | `IP_QATU` |

No cambies nada más del dominio (SSL, reglas): afecta a conecta360 y al CRM. Comprueba desde PowerShell:

```powershell
nslookup qatu.devpe.tech
nslookup panel-qatu.devpe.tech
```

## 8. Panel de Dokploy con HTTPS

1. Dokploy → **Settings → Web Server** → dominio `panel-qatu.devpe.tech`, certificado **Let's Encrypt** → guardar.
2. Entra por `https://panel-qatu.devpe.tech`.
3. En AWS, **borra la regla del puerto 3000** del grupo de seguridad.

## 9. Conectar el repositorio

Dokploy → **Settings → Git → GitHub** → crea la GitHub App y dale acceso **solo** al repositorio `Qatu-Ayacucho`.

## 10. Destinos y almacenamiento en R2 (cuenta de Cloudflare de Qatu)

Para producción conviene separar los datos de desarrollo:

1. **R2 → Create bucket**: `qatu-privado-prod` y `qatu-respaldos`.
2. **R2 → Manage API Tokens → Create Account API token** `qatu-produccion`: **Object Read & Write**, solo sobre esos dos buckets. Guarda el Access Key ID, el Secret Access Key y el endpoint.
3. Dokploy → **Settings → S3 Destinations** (o *Destinations*) → nuevo destino `r2-respaldos`:
   - Access Key / Secret Key: las del token;
   - Bucket: `qatu-respaldos`;
   - Region: `auto`;
   - Endpoint: `https://<id-de-cuenta>.r2.cloudflarestorage.com`.

   Usa **Test connection** si está disponible. La documentación de Dokploy no menciona R2 de forma explícita, pero R2 es compatible con S3; si no conecta, avisa antes de seguir.

## 11. Crear Qatu en Dokploy

**Projects → Create project** `Qatu` → **Create service → Docker Compose**:

| Campo | Valor |
|---|---|
| Provider | GitHub → repositorio `Qatu-Ayacucho`, rama `main` |
| Compose path | `infra/compose.production.yml` |
| Tipo | **Docker Compose** (no *Stack*: Stack no permite `build`) |

### Variables (pestaña Environment)

Genera los secretos en tu PowerShell local, cada uno distinto:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```
POSTGRES_PASSWORD=<secreto 1>
JWT_SECRET=<secreto 2>
DOCUMENTOS_KEY=<secreto 3>
APP_ORIGIN=https://qatu.devpe.tech
QATU_PROXIES_CONFIABLES=uniquelocal
QATU_ALMACEN=r2
QATU_R2_ENDPOINT=https://<id-de-cuenta>.r2.cloudflarestorage.com
QATU_R2_ACCESS_KEY_ID=<del token qatu-produccion>
QATU_R2_SECRET_ACCESS_KEY=<del token qatu-produccion>
QATU_R2_BUCKET_PRIVADO=qatu-privado-prod
QATU_R2_BUCKET_PUBLICO=
QATU_TITULAR_RAZON_SOCIAL=
QATU_TITULAR_RUC=
QATU_TITULAR_DIRECCION=
QATU_TITULAR_CORREO=
QATU_TITULAR_TELEFONO=
CULQI_PUBLIC_KEY=
CULQI_SECRET_KEY=
```

- **`DOCUMENTOS_KEY` es irrecuperable:** sin ella, los documentos y fotos cifrados no se pueden leer, ni siquiera con las copias. Guárdala en tu gestor de contraseñas **además** de en Dokploy.
- Los secretos son hexadecimales a propósito: así no rompen la URL de la base.
- Culqi: solo llaves `pk_test_` / `sk_test_`; vacías desactivan el pago en línea.
- Swagger (`/api/v1/docs`) está apagado en producción. Para mostrarlo en una revisión, agrega `QATU_DOCS=1` y vuelve a desplegar; quítalo al terminar.

### Dominio (pestaña Domains)

**Add Domain**: servicio **`web`**, host `qatu.devpe.tech`, path `/`, **container port 3000**, **HTTPS activado**, certificado **Let's Encrypt**. Guarda.

### Desplegar

**Deploy**. La primera vez tarda varios minutos: compila la API y la web. En **Logs** verás `Migraciones de Qatu al día.` en `api`.

## 12. Comprobar

1. `https://qatu.devpe.tech` abre la portada con candado (HTTPS).
2. `https://qatu.devpe.tech/api/v1/salud` responde `{"estado":"ok","base":"ok",...,"almacen":"r2"}`.
3. Crea una cuenta, inicia sesión y abre `/libro-de-reclamaciones`.

## 13. Primer administrador

Dokploy → proyecto → servicio **api** → **Terminal** (o por SSH, `docker exec -it <contenedor api> sh`):

```sh
QATU_ADMIN_EMAIL='tu-correo' QATU_ADMIN_NOMBRE='Tu nombre' QATU_ADMIN_MOTIVO='Administrador inicial del despliegue' \
QATU_ADMIN_PASSWORD='una frase larga de al menos 12 caracteres' node dist/scripts/aprovisionar-admin.js
```

Debe responder `Administrador creado y auditado`. Luego, en tu terminal, borra esa línea del historial, porque contiene la contraseña.

## 14. Copias diarias de la base

Dokploy → servicio compose → pestaña **Backups → Create**:

| Campo | Valor |
|---|---|
| Database type | PostgreSQL |
| Service name | `db` |
| Database | `qatu` |
| Destination | `r2-respaldos` |
| Schedule | `0 8 * * *` (todos los días a las 03:00 de Lima, 08:00 UTC) |
| Keep the latest | `14` |

Pulsa **Run Manual Backup** y comprueba en R2 → `qatu-respaldos` que apareció el archivo. Restaurar exige esa copia **y** la `DOCUMENTOS_KEY`. El simulacro de restauración (AC09) está en la spec 008.

## 15. Operación diaria

- **Desplegar una versión nueva:** fusiona en `main` y pulsa **Deploy**, o activa el despliegue automático en Dokploy.
- **Rendimiento:** pestaña **Monitoring** (CPU, RAM, red por servicio) y **Logs**.
- **Créditos de AWS:** revísalos cada semana. Antes de que se acaben, ejecuta una copia manual y decide adónde mudarte; con las copias en R2 y este compose, mudarse es repetir esta guía en otro servidor.

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| La compilación se corta o el servidor se congela | Falta memoria: revisa el swap del paso 4 |
| `502 Bad Gateway` | La API aún no está sana: revisa los logs de `api` y `/api/v1/salud` |
| Ingresar o enviar formularios da «Solicitud no permitida» | `APP_ORIGIN` no coincide exactamente con `https://qatu.devpe.tech` |
| El certificado no se emite | El registro DNS no apunta a `IP_QATU` o el proxy de Cloudflare está en naranja |
| `/api/v1/salud` dice `"almacen":"postgres"` | Falta `QATU_ALMACEN=r2` o una variable `QATU_R2_*` |
