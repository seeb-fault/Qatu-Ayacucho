# Validación del diseño de Qatu

## Estado

Plan de pruebas de implementación futura. Esta revisión documental no ejecuta reservas, cobros ni pruebas de carga. Cada evidencia debe incluir fecha, commit, infraestructura, datos sintéticos, herramienta, resultado y archivo de salida.

| Escenario | Tipo de prueba | Evidencia requerida | Estado |
|---|---|---|---|
| EQ-01 / EQ-03 | Carga incremental | Percentiles, throughput, errores, CPU/RAM y consultas | Pendiente |
| EQ-02 | Fallos de IA | Timeout/429/JSON inválido y operación de reserva sin IA | Pendiente |
| EQ-04 | Permisos | Matriz rol/propiedad, endpoints y respuestas | Pendiente |
| EQ-05 | Contratos/imports | Sustitución adapters e imports del dominio | Pendiente |
| EQ-06 | Interfaz móvil | Condiciones de red, medidas y tareas con participantes | Pendiente |
| EQ-07 | Integración PostgreSQL | 100 pares de aceptación concurrente e invariantes | Pendiente |
| EQ-08 | Pago sandbox y fallos | Reenvíos, corte de red, conciliación y pago tardío | Pendiente |
| EQ-09 | Restauración | Copia, restore, referencias de archivos y RPO/RTO observados | Pendiente |
| EQ-10 | Evaluación IA | Dataset etiquetado, filtros exactos, top-5 y costos | Pendiente |

## Criterios de entrega

- Recorrido funcional: publicar → buscar → solicitar → aceptar → pagar → entregar/iniciar → devolver/finalizar → reseñar.
- Sin solapamientos confirmados y sin efectos financieros duplicados.
- IA usa resultados reales y cuenta con respaldo convencional.
- Acceso privado por rol y propiedad; secretos fuera del repositorio.
- Pago integrado en sandbox; activación real se identifica por separado.
- Despliegue con persistencia, health checks y restauración documentada.

## Registro de resultados

Crear por ejecución un informe con: escenario, comando/procedimiento, configuración, resultado esperado/observado, evidencia, limitación y acción correctiva. No sustituir resultados por frases como “funciona correctamente”. [Escenarios completos](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
