# Evidencias de la investigación Hygglo

REA ejecutó escenarios públicos en un navegador temporal. Cada PNG se extrajo del registro original y se verificó contra su SHA-256. Las imágenes son evidencia de análisis de terceros, no recursos gráficos para publicar como interfaz Qatu.

| Referencia | Captura | Evidence ID |
|---|---|---|
| E01 | [01-inicio-escritorio](../capturas/01-inicio-escritorio.png) | ev_924b3abcc8679107a9d2648e09bd398ef232340cd7b2db929637fd8cadad459f |
| E02 | [02-busqueda-ubicacion](../capturas/02-busqueda-ubicacion.png) | ev_205a36c55cdece377d040a22ffeeeb46f258d6e9d543d44152d39d285bed65dc |
| E03 | [03-detalle-herramienta](../capturas/03-detalle-herramienta.png) | ev_aca8eaf9e4dccf65ad98edb2a5d7f2d329ec6eecd073d76cdd15722d77cea6e9 |
| E04 | [04-calendario-cotizacion](../capturas/04-calendario-cotizacion.png) | ev_9c7ebb2194c2621b855daa26b16181bec7c4e3763b411580f0cc4a2039c2e4e9 |
| E05 | [05-inicio-movil-inicial](../capturas/05-inicio-movil-inicial.png) | ev_b2580d86dc600665d128a0484b15b78cc6399f63066bf3cd81b7594e07f7219e |
| E06 | [06-resultados-busqueda](../capturas/06-resultados-busqueda.png) | ev_a18652f3cd4532688eb15c87d082f0006c46e058221068dde5a43e4f3e86ccb6 |
| E07 | [07-inicio-movil](../capturas/07-inicio-movil.png) | ev_fbbe544dd042d0165419d777404ef1b1abbc50b3a623da93a3a7e848cd06129f |

## Registros completos

Los paquetes JSON son copias saneadas para publicación: los tokens Mapbox capturados de las páginas se sustituyen por `[REDACTED_MAPBOX_TOKEN]`. Los PNG no se modifican y mantienen sus hashes; los JSON saneados ya no son copias byte a byte de las exportaciones originales. Desde la raíz, `node specs/scripts/sanitizar-evidencias.mjs` comprueba los archivos versionados sin imprimir tokens; añadir `--write` regenera las copias saneadas.

- [Manifiesto de escenarios y hashes](./rea/manifest.json).
- [Paquete saneado exportado por REA](./rea/hygglo-2026-10-15.bundle.json), siete registros; conserva parámetros, DOM, accesibilidad, capturas y limitaciones, con tokens redactados.

La captura E05 muestra un estado transitorio con oscurecimiento; E07 registra la portada tras continuar en la web. No se eliminó evidencia de ese estado inicial. E02 muestra el diálogo de ubicación; E06 registra resultados después de cerrarlo.

Las capturas no equivalen a navegación completa de todos los flujos. La cantidad de unknowns técnicos del paquete no elimina las preguntas funcionales pendientes del informe. No se observaron backend, pago real ni autorización entre usuarios.

## Segunda etapa: Taskrabbit

Cinco escenarios públicos adicionales; capturas extraídas del registro y verificadas con SHA-256.

| Referencia | Captura | Evidence ID |
|---|---|---|
| T01 | [08-taskrabbit-inicio.png](../capturas/08-taskrabbit-inicio.png) | ev_5df75c5cc807f7dfc9d32fe39274d65b1d52e30c1dee25d0361142650eb22496 |
| T02 | [09-taskrabbit-solicitud.png](../capturas/09-taskrabbit-solicitud.png) | ev_2f80fbda24de5c0fda38b7df51ad41f877366fc954af5ca02118cc56848061a1 |
| T03 | [10-taskrabbit-categorias.png](../capturas/10-taskrabbit-categorias.png) | ev_8721cb673f53d49369853519158b40a57e177c4d320d82e711a52821b94b3e4c |
| T04 | [11-taskrabbit-oficio-movil.png](../capturas/11-taskrabbit-oficio-movil.png) | ev_d57d4895907b7085544f865c966650752ac843e5c398826afd94c93296ed7ac2 |
| T05 | [12-taskrabbit-profesionales.png](../capturas/12-taskrabbit-profesionales.png) | ev_86ef36f6f60a1a83c56f6af8843cb820921d99c7aa4326d204e1ce6adc519776 |

[Manifiesto Taskrabbit](./rea/taskrabbit-manifest.json) · [Paquete exportado de sesión](./rea/taskrabbit-2026-10-15.bundle.json). El paquete contiene 12 registros: los siete previos de Hygglo y cinco de Taskrabbit. El manifiesto selecciona exactamente los cinco de esta etapa. Los cinco navegadores temporales se cerraron; no se enviaron solicitudes ni pagos.
