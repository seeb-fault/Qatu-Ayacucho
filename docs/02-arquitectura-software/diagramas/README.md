# Diagramas de estilo y enfoque — Qatu Ayacucho

Adaptación del material de clase al proyecto, con contenido basado en la implementación hasta la entrega 003 y la arquitectura objetivo documentada. No se modifica la funcionalidad del sistema.

## Abrir y presentar

| Vista | PNG para exposición | SVG ampliable | Fuente editable |
|---|---|---|---|
| Paso 4: estilo global | [PNG](./png/estilo-arquitectonico-qatu.png) | [SVG](./svg/estilo-arquitectonico-qatu.svg) | [diagrams.net](./fuentes/estilo-arquitectonico-qatu.drawio) |
| Paso 5: enfoque interno | [PNG](./png/enfoque-arquitectonico-qatu.png) | [SVG](./svg/enfoque-arquitectonico-qatu.svg) | [diagrams.net](./fuentes/enfoque-arquitectonico-qatu.drawio) |

En diagrams.net: Archivo → Abrir desde → Dispositivo. Los elementos, textos y conectores son editables; no se trata de una imagen pegada.

## Orden de explicación

1. Estilo: actores → web Next.js → API NestJS → módulos → PostgreSQL e integraciones. Seis módulos diseñados, solo Usuarios y Proveedores implementados en la API. Pagos pertenece a Reservas. Consumo de una API externa no equivale a microservicios.
2. Enfoque: abrir Usuarios como ejemplo real. Presentación invoca Aplicación; Aplicación depende de reglas y contratos; Infraestructura implementa esos contratos; Composición selecciona los adaptadores.
3. Diferencia: la primera vista muestra ejecución y estructura global; la segunda muestra dependencias de código e inversión de dependencias. No interpretar las flechas como si ambas vistas fueran iguales.

Las integraciones de IA/pasarela/mapas/mensajería y cuatro módulos restantes siguen pendientes. PostGIS disponible no implica mapas integrados. Redis no está implementado. Docker local ejecuta la base de datos, no necesariamente toda la aplicación.

## Regeneración

La fuente reproducible es `scripts/generar-estilo-enfoque.mjs`: contiene layout, textos y relaciones de ambas vistas. Genera JSON de geometría, SVG y XML diagrams.net desde el mismo modelo, evitando ediciones inconsistentes entre formatos. Para conservar cambios al regenerar, modificar el script; las ediciones manuales del `.drawio` no se importan automáticamente.

Desde la raíz de `Qatu-Ayacucho`, con Node.js:

```powershell
node docs/02-arquitectura-software/diagramas/scripts/generar-estilo-enfoque.mjs
```

Para exportar también PNG se utiliza el Chromium de Playwright ya empleado por las pruebas del frontend. Si no está preparado, ejecutar una vez:

```powershell
npm --prefix frontend ci
npm --prefix frontend exec -- playwright install chromium
```

Después:

```powershell
node docs/02-arquitectura-software/diagramas/scripts/generar-estilo-enfoque.mjs --png
```

Si ya se dispone de otro Chromium local compatible, se puede indicar su ejecutable con `--browser-executable "C:\ruta\chrome.exe"`, sin descargar otro navegador. La apariencia puede variar con las fuentes y el navegador; revisar el resultado exportado.

La exportación comprueba IDs únicos, geometría dentro del lienzo, conectores ortogonales, ancho real del texto en Chromium y XML editable válido. Para comprobar que los artefactos de texto siguen sincronizados sin escribir archivos:

```powershell
node docs/02-arquitectura-software/diagramas/scripts/generar-estilo-enfoque.mjs --check
```

`--check --png` añade la comprobación visual de anchos y XML y verifica la firma del PNG existente; no compara píxeles ni sustituye la revisión visual. Las verificaciones del generador no son pruebas de rendimiento ni aceptación funcional del sistema.

El renderizador `scripts/render-arquitectura.ps1` conserva la generación de arquitectura inicial y delega estas dos vistas al nuevo generador. Los diagramas de componentes y C4 no se reemplazan en este cambio.
