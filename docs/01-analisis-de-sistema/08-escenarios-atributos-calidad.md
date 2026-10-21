# 08 - Escenarios de atributos de calidad de Qatu

## Propósito y estado

Especificar respuestas comprobables, siguiendo la referencia Marketplace. Las cifras son objetivos de diseño pendientes de validar en el VPS; no son resultados obtenidos ni compromisos comerciales.

## Entorno de evaluación

Registrar CPU, RAM, disco, versiones, commit y configuración de PostgreSQL. Usar 1 000 publicaciones, 100 proveedores y 5 000 reservas sintéticas; 5 minutos de calentamiento y 15 de carga medida. Entorno base: 30 usuarios virtuales; 70 % búsquedas, 20 % detalles y 10 % consulta de reservas. Escalabilidad: escalones de 10, 30 y 60 usuarios. Medir API desde proxy y separar pruebas de interfaz. Separar terceros simulados y sandbox real.

Registrar p50/p95/p99, throughput, CPU, RAM y conexiones. Errores técnicos: 5xx, conexiones fallidas y tiempos agotados. Un 409 esperado por conflicto no es error técnico. Las evidencias se registran en [validación](../03-diseño-de-software/validacion-del-diseno.md).

## EQ-01 - Búsqueda convencional

| Elemento | Descripción |
|---|---|
| Atributo | AC01 - Rendimiento |
| Fuente | Cliente o visitante |
| Estímulo | Busca por categoría, zona y precio o abre una publicación |
| Condición | Carga y datos del entorno base; sin IA |
| Artefacto | API Catálogo y PostgreSQL |
| Respuesta esperada | Lista paginada de publicaciones activas |
| Medida | Propuesta: p95 ≤ 1 segundo, errores técnicos < 1 %, máximo 20 resultados por página |
| Verificación | Carga con y sin caché; inspeccionar índices y consultas |
| Trazabilidad | RF01, RF02; DA02; ADR-003 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-02 - Fallo de IA

| Elemento | Descripción |
|---|---|
| Atributo | AC02, AC07 - Disponibilidad y resiliencia |
| Fuente | Proveedor externo de IA |
| Estímulo | Timeout, cuota agotada o JSON inválido |
| Condición | API y base de datos operativas |
| Artefacto | Búsqueda inteligente y adaptador de IA |
| Respuesta esperada | Ofrece búsqueda convencional; reservas y pagos continúan |
| Medida | Propuesta: petición total ≤ 5 segundos; interpretación ≤ 3 segundos; 100 % de fallos simulados controlados |
| Verificación | Inyectar 429, 5xx, demora y JSON inválido; reservar y pagar durante el fallo |
| Trazabilidad | RF16, RF17; DA10; ADR-009 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-03 - Aumento de carga

| Elemento | Descripción |
|---|---|
| Atributo | AC03 - Escalabilidad |
| Fuente | Incremento de clientes |
| Estímulo | Concurrencia sube de 10 a 30 y 60 usuarios virtuales |
| Condición | Mismos datos, mezcla e infraestructura registrada |
| Artefacto | Proxy, web, API y PostgreSQL |
| Respuesta esperada | Mantiene consistencia y comunica exceso de carga |
| Medida | Propuesta: con 30 cumple EQ-01; con 60, p95 de lectura ≤ 2 segundos y errores técnicos < 1 % |
| Verificación | Comparar niveles y recursos; identificar cuello de botella antes de dimensionar |
| Trazabilidad | DA01, DA11; ADR-001, ADR-010 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-04 - Autorización

| Elemento | Descripción |
|---|---|
| Atributo | AC04 - Seguridad |
| Fuente | Usuario sin permiso |
| Estímulo | Lee reserva ajena, cambia publicación ajena o descarga evidencia privada |
| Condición | Matriz de roles y propietarios definida |
| Artefacto | Guardas, casos de uso y acceso a archivos |
| Respuesta esperada | Rechaza sin cambios ni exposición de datos privados |
| Medida | 100 % de casos no autorizados definidos rechazados; cero secretos o datos de tarjetas en respuestas revisadas |
| Verificación | Casos positivos y negativos por endpoint, rol y propiedad; revisar registros |
| Trazabilidad | RF12-RF15, RF19; DA03; ADR-007, ADR-012 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-05 - Sustitución de adaptadores

| Elemento | Descripción |
|---|---|
| Atributo | AC05 - Mantenibilidad |
| Fuente | Desarrollador |
| Estímulo | Sustituye pasarela o modelo por un doble de prueba |
| Condición | Contratos públicos y composición definidos |
| Artefacto | Reservas y Búsqueda inteligente |
| Respuesta esperada | Conserva casos de uso y reglas de dominio |
| Medida | Cero imports de framework, ORM o SDK en dominio; contrato y regresión aprobados |
| Verificación | Inspeccionar imports y diff; probar sustitución y capacidades |
| Trazabilidad | DA07, DA10; ADR-002, ADR-004, ADR-009 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-06 - Uso móvil

| Elemento | Descripción |
|---|---|
| Atributo | AC06 - Usabilidad |
| Fuente | Cliente desde celular |
| Estímulo | Busca y solicita alquiler |
| Condición | Ancho 360 px, 1,6 Mbps, latencia 150 ms; cinco participantes |
| Artefacto | Web Next.js |
| Respuesta esperada | Permite corregir filtros y ver costos antes de solicitar |
| Medida | Propuesta: sin scroll horizontal; contenido principal ≤ 3 segundos en 4 de 5 ejecuciones; 4 de 5 participantes completan en ≤ 3 minutos sin ayuda |
| Verificación | Prueba de navegador y tareas; registrar condiciones y errores |
| Trazabilidad | RF01, RF05, RF16; DA09; ADR-008 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-07 - Conflicto de fechas

| Elemento | Descripción |
|---|---|
| Atributo | AC08 - Integridad |
| Fuente | Dos solicitudes concurrentes |
| Estímulo | Dos aceptaciones bloquean la misma unidad física y rango |
| Condición | Dos solicitudes pendientes; PostgreSQL real |
| Artefacto | Reserva, bloqueo y restricción de exclusión |
| Respuesta esperada | Una aceptación confirma; la otra obtiene conflicto |
| Medida | En 100 pares concurrentes: exactamente una aceptación por par, cero rangos bloqueantes superpuestos |
| Verificación | Integración real y consulta de invariantes tras cada par |
| Trazabilidad | RF04, RF05, RF07; DA08; ADR-006 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-08 - Pago repetido o incierto

| Elemento | Descripción |
|---|---|
| Atributo | AC07, AC08 - Fiabilidad e integridad |
| Fuente | Pasarela o cliente |
| Estímulo | Repite solicitud/evento o se corta red después del cobro |
| Condición | Intento guardado antes de la llamada; sandbox y fallos simulados |
| Artefacto | Pagos de Reservas, inbox y conciliación |
| Respuesta esperada | Reutiliza intento, verifica estado externo y evita cobro nuevo por timeout |
| Medida | Un efecto local por operación/evento en 20 reenvíos; ningún cobro adicional solicitado por incertidumbre |
| Verificación | Monto/moneda incorrectos, evento falsificado, reenvíos, pago tardío y cortes de red |
| Trazabilidad | RF09, RF21, RF22; DA04, DA12; ADR-004, ADR-011 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-09 - Recuperación

| Elemento | Descripción |
|---|---|
| Atributo | AC09 - Recuperabilidad |
| Fuente | Fallo del VPS |
| Estímulo | Se pierde host o volumen |
| Condición | Copias diarias cifradas fuera del VPS |
| Artefacto | PostgreSQL, fotos, evidencias y configuración |
| Respuesta esperada | Restaura datos/archivos y concilia pagos posteriores a la copia |
| Medida | Propuesta: RPO ≤ 24 horas, RTO ≤ 4 horas; caída solo del proceso: health recuperado ≤ 60 segundos si host/datos siguen disponibles |
| Verificación | Restaurar en entorno vacío; comprobar archivos referenciados e historial de pagos |
| Trazabilidad | DA11; ADR-010, ADR-012 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## EQ-10 - Calidad de búsqueda natural

| Elemento | Descripción |
|---|---|
| Atributo | AC01, AC04, AC07 |
| Fuente | Cliente |
| Estímulo | Consulta explícita, ambigua o adversarial |
| Condición | 50 consultas etiquetadas: 30 explícitas, 10 ambiguas, 10 adversariales; fecha fijada y America/Lima |
| Artefacto | Intérprete, validador y APIs públicas de lectura |
| Respuesta esperada | Valida filtros, pide precisión y devuelve ofertas reales; no cobra ni reserva |
| Medida | Propuesta: ≥ 90 % coincidencia exacta de filtros en explícitas; ≥ 80 % con opción pertinente entre primeros 5; cero IDs/precios inventados y acciones de escritura |
| Verificación | Comparar etiquetas humanas, límites de entrada, permisos y presupuesto |
| Trazabilidad | RF16, RF17; DA10; ADR-009 |

**Estado:** pendiente de implementación y ejecución; EQ-04, EQ-07 y EQ-08 son invariantes obligatorios.

## Límites de evaluación

Un VPS es un punto único de fallo. Reiniciar un proceso no resuelve la pérdida del servidor. Una entrega corta tampoco demuestra disponibilidad mensual. Registrar condiciones, resultados y desviaciones; ajustar las metas de rendimiento solo con evidencia y conservar las invariantes de seguridad e integridad.
