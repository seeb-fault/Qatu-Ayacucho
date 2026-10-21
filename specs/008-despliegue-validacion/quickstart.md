# Validación — VPS

Sin despliegue todavía. Completar comandos reales de construcción, migración y arranque una vez implementados.

1. Registrar commit, versiones y recursos; preparar dataset EQ (1000 publicaciones,100 proveedores,5000 reservas sintéticas).
2. Verificar configuración y smoke de web/API/PostgreSQL privado.
3. Ejecutar 5 min de calentamiento y 15 de carga a 10/30/60 usuarios con mezcla EQ.
4. Probar reinicio de proceso sin perder volúmenes.
5. Restaurar copias DB/archivos en entorno vacío; medir RPO/RTO y verificar referencias/conciliación.
6. Ejecutar recorrido público → autenticación → solicitud → aceptación → pago sandbox → cierre → reseña.

Resultados: pendientes. Registrar p50/p95/p99, errores, recursos y costos. No confundir simulación de tercero con integración real ni reinicio de proceso con recuperación de host.
