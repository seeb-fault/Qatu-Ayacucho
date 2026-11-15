# Especificaciones Qatu

La entrega [001 — Descubrimiento de ofertas](001-descubrimiento-ofertas/spec.md) incorpora el prototipo web con datos sintéticos. [002 — Usuarios y acceso](002-usuarios-acceso/spec.md) añade cuentas y administración con persistencia real. [003 — Proveedores y verificación](003-proveedores-verificacion/spec.md) añade perfiles, documentos cifrados y revisión administrativa; mantiene pendientes D02 y mapas externos. [004 — Catálogo y publicaciones](004-catalogo-publicaciones/spec.md) implementa ofertas persistidas, editor y moderación; ensayo local de carga aprobado, con aceptación global pendiente en 005/008. Las especificaciones futuras no se consideran implementadas por aparecer en la arquitectura.

El incremento **005.1** inicia [solicitudes de reserva](005-reservas-contratacion-pagos/quickstart.md): envío, bandejas participantes y rechazo persistidos. No confirma fechas ni importes y no habilita pagos. 005 conserva su aceptación global pendiente.

El incremento **006.1** añade [reseñas](006-reputacion-confianza/quickstart.md): el cliente califica una operación cerrada hasta 14 días después, la reputación aparece en el perfil público y en las tarjetas del catálogo, y un administrador ajeno a la operación puede ocultar o restablecer reseñas con motivo registrado.

El incremento **006.2** añade [evidencias privadas](006-reputacion-confianza/quickstart.md): fotos de entrega, devolución o trabajo, cifradas, visibles solo para los participantes y la administración, y borradas 90 días después del cierre.

El incremento **006.3** añade [incidencias y garantía documental](006-reputacion-confianza/quickstart.md): un participante reporta un problema hasta 48 h después del cierre y un administrador ajeno lo resuelve sin mover dinero; el proveedor documenta el estado de la herramienta y el cliente da conformidad al recibirla.

El incremento **009.1** añade [Mi lista](009-mi-lista/quickstart.md): el cliente guarda herramientas y oficios con sus fechas, los revisa (tarifa cambiada, fechas vencidas, unidad ocupada) y envía todas las solicitudes en un paso. Guardar exige sesión; quien no la tiene vuelve a la publicación con el ítem agregado tras ingresar.

El incremento **010.1** añade [coordinación por WhatsApp](010-coordinacion-whatsapp/quickstart.md): cada usuario registra su WhatsApp con consentimiento y, desde que hay un compromiso (visita acordada, cotización enviada o reserva aceptada) hasta el cierre, la reserva muestra «Escribir a … por WhatsApp» con el mensaje ya escrito. Publicar exige un WhatsApp visible.

El incremento **011.1** añade [mapas y ubicación](011-mapas-ubicacion/quickstart.md) con Leaflet y OpenStreetMap, gratis y sin claves: el proveedor marca su punto y elige mostrarlo exacto (un local) o casi exacto a menos de 100 m (su casa); el detalle y los resultados muestran el mapa y, desde que hay compromiso, la contraparte ve el punto exacto con «Abrir en Google Maps».

## Evolución pendiente

- [005 — Reservas, contratación y pagos](005-reservas-contratacion-pagos/spec.md)
- [006 — Reputación y confianza](006-reputacion-confianza/spec.md)
- [007 — Búsqueda inteligente](007-busqueda-inteligente/spec.md)
- [008 — Despliegue y validación](008-despliegue-validacion/spec.md)
- [011 — Mapas y ubicación](011-mapas-ubicacion/spec.md): etapa 2, lugar del trabajo marcado por el cliente y «Cerca de ti».
- [010 — Coordinación por WhatsApp](010-coordinacion-whatsapp/spec.md): etapa 2, avisos automáticos por WhatsApp Business (con costo, D08).
- [009 — Mi lista](009-mi-lista/spec.md): guardar herramientas y oficios con sus fechas y enviar todas las solicitudes en un paso; exige sesión.

## Guías

- [Uso de Spec Kit](uso-spec-kit.md)
- [Decisiones pendientes](decisiones-pendientes.md)
- [Trazabilidad](trazabilidad.md)
- [Análisis de consistencia](analisis-consistencia.md)
- [Procedencia de los snapshots](../docs/RECONSTRUCCION.md)

El CI valida los artefactos presentes. Los resultados históricos de quickstarts no sustituyen las ejecuciones nuevas de cada PR.
