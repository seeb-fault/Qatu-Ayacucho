# Validación y recorrido — Reservas, contratación y pagos

## Preparación

Los incrementos 005.1/005.2 tienen API y web ejecutables para solicitar, consultar, rechazar, acordar visitas, apartar herramientas y registrar efectivo/entrega y devolución por participantes. 005.3 agrega cotizaciones versionadas; 005.4 confirma agenda al aceptar, sin anticipo. Preparar PostgreSQL y configurar backend/.env como indica backend/README.md. Ejecutar `npm run migrate` desde backend; iniciar `npm run dev` en backend y frontend. Abrir `/reservas`, o elegir una oferta pública y pulsar «Solicitar reserva». 005.5 agrega la ejecución y el cierre del oficio; pasarela y disputas siguen pendientes.

Para cotizar un oficio, el cliente solicita un servicio e indica el trabajo y horario. El proveedor abre Recibidas → Preparar cotización e indica alcance, materiales, total y vigencia en hora de Lima. El cliente revisa la propuesta en Enviadas y acepta la versión o la rechaza con motivo. Una nueva versión conserva las anteriores. Aceptar confirma el servicio y reserva el horario si sigue disponible, sin anticipo ni pago. Si hay conflicto, se coordina otra solicitud. Los acuerdos aceptados con 005.3 muestran «Confirmar horario acordado» al cliente; no se bloquean automáticamente al migrar. Cancelar un servicio confirmado mientras el trabajo no se haya iniciado libera la agenda y conserva la aceptación histórica.

Para ejecutar el oficio, desde la hora acordada el proveedor abre Recibidas y registra el inicio; al terminar declara el trabajo terminado y el efectivo recibido. El cliente abre Enviadas y confirma el trabajo y el pago, o rechaza el término con motivo. Confirmar cierra el servicio y libera la agenda.

Para pruebas usar exclusivamente una base con sufijo `_test`; definir DATABASE_URL y TEST_DATABASE_URL para esa base, JWT_SECRET de pruebas (mínimo 32 caracteres) y DOCUMENTOS_KEY de pruebas (64 caracteres hexadecimales). No usar una base de desarrollo con cuentas personales.

1. Desde backend: `npm run migrate`, `npm run build` y `npm test`.
2. Desde frontend: `npm run build`, `npm run typecheck` y `npm run test:reservas`.
3. Puertos 3001/3100 libres para las E2E, ejecutadas secuencialmente con las otras suites. El fixture sintético exige `QATU_E2E_RESERVAS=1` y sufijo `_test`, y crea sus propias cuentas/oferta sin borrar datos. La aprobación del proveedor se prepara directamente en el fixture aislado; no es evidencia del recorrido documental, cubierto por 003/004.

Las pruebas de navegador comprueban solicitud/rechazo, visita sin bloqueo y efectivo bilateral con entrega/devolución; incluyen conversión de hora de Lima a UTC, estado persistido y ancho móvil de 360 px. El backend verifica aislamiento, origen/sesión, entrada manipulada, recursos inactivos/ajenos, duplicados concurrentes, acuerdo inmutable y rollback de outbox, además de 100 pares de aceptaciones concurrentes. El resultado local EQ-07 se registra abajo; EQ-08 de pasarela continúa pendiente.

Para las pruebas con persistencia configurar `TEST_DATABASE_URL` con una base exclusiva de pruebas; las E2E requieren además `DATABASE_URL` con una base cuyo nombre termine en `_test`. Configurarlas en el proceso que ejecuta los comandos, no apuntar las pruebas a la base de desarrollo. Sin `TEST_DATABASE_URL`, el ejecutor backend omite integración y su salida no acredita persistencia.

## Recorridos

1. US1: dado dos solicitudes para el mismo recurso, se aceptan concurrentemente; comprobar que una sola queda aceptada y la otra obtiene conflicto.
2. US2: dado un servicio variable, acepto una versión vigente; comprobar que el pago usa el snapshot aceptado y no un precio del navegador.
3. US3: dado un intento persistido, ocurre timeout o se repite el webhook; comprobar que se consulta/deduplica sin iniciar un cobro adicional por incertidumbre.
4. US4: dado una reserva autorizada, registro inicio o cierre con evidencia; comprobar que se valida transición y se emite evento durable.

## Casos críticos

- EQ-07: 100 pares concurrentes, una aceptación por par y cero bloqueos superpuestos.
- EQ-08: 20 reenvíos, un efecto; monto/moneda incorrectos, falsificación, timeout, pago tardío y claves distintas.
- Carrera entre expiración y pago; límites adyacentes de rango y agenda del mismo proveedor.
- Outbox tras reinicio y canal externo caído; consumidores deduplicados.
- Contrato con doble y después Culqi sandbox real; Yape documentar habilitación o bloqueo.

## Registro de resultados

### Validación local del incremento 005.1 (2026-10-27)

- Node.js 24.21.0, Windows, Chrome instalado y PostgreSQL/PostGIS 17/3.5 en Docker local; base exclusiva `qatu_reservas_test` en puerto 5433. Fixture sintético sin pagos ni documentos personales.
- `npm run migrate` y `npm run build` en backend: correctos. La primera ejecución completa de `npm test` aprobó 61 pruebas sin omisiones. Tras añadir el fallo transaccional de outbox y corregir una suposición del fixture sobre el orden aleatorio de UUID de recursos, las 11 pruebas específicas de Reservas aprobaron sin omisiones (incluyen el nuevo caso).
- Frontend: `npm run build` y `npm run typecheck` correctos; `npm run test:reservas`: 1 recorrido E2E aprobado (59.3 s con arranque/cierre). La prueba incluye vista móvil de 360 px y captura en `frontend/test-results/reservas-recibidas-360.png` (artefacto local ignorado por Git).
- Regresión de navegación/detalle: `QATU_TEST_PORT=3200 npm test -- --output=test-results/descubrimiento`, 13 pruebas aprobadas (1.0 min). La variable se configura con sintaxis de entorno de PowerShell en Windows.
- Detector CI: 11 pruebas aprobadas. El manifiesto declara `ultimaEntrega=004` e `incrementos=["005.1"]`; exige los archivos de Reservas y activa el recorrido nuevo. Las bases remotas de CI son efímeras; no se usan los datos locales.
- La tarifa de referencia permanece inmutable aunque cambie el precio de la oferta. La creación duplicada y el rechazo concurrente generan un solo efecto; un fallo de outbox revierte estado y versión. Son verificaciones del incremento; no constituyen EQ-07 de aceptación ni EQ-08 de pagos.
- Commit y ejecución remota: se registran por los commits/PR de este incremento; la evidencia local no sustituye el CI remoto. Revisión humana, aceptación comercial, bloqueo de recursos, cotizaciones, checkout, vencimiento, notificaciones externas y ciclo de entrega/devolución siguen pendientes.

### Validación local del incremento 005.2 (2026-10-27)

- Entorno: Node.js 24.21.0, Windows y PostgreSQL/PostGIS local. Se inició `docker compose up -d db` y se usó exclusivamente `qatu_reservas_test` en el puerto 5433 para las pruebas con persistencia. Las variables de prueba se configuraron en el proceso, sin modificar `.env`.
- Backend: `npm run build` correcto. La ejecución general de `npm test` aprobó 18 pruebas y omitió 7 de integración por ausencia de `TEST_DATABASE_URL`; esa ejecución no acredita persistencia. Después de configurar `DATABASE_URL` y `TEST_DATABASE_URL` con la base aislada y ejecutar `npm run migrate`, `node --env-file-if-exists=.env --import tsx --test --test-concurrency=1 test/reservas/*.test.ts` aprobó 24 pruebas sin omisiones.
- EQ-07 local: 100 pares concurrentes, una aceptación por par y cero rangos superpuestos. También se comprobaron rollback de aceptación si falla outbox, vencimiento y ampliación, rangos adyacentes, posesión física única, condiciones inmutables y saldo por devolución tardía sin confirmar efectivo adicional.
- Frontend: `npm run build` y `npm run typecheck` correctos. Los recorridos de efectivo bilateral con entrega/devolución y solicitud con rechazo aprobaron en la primera ejecución. El recorrido de visita previa falló por el selector exacto de etiqueta del desplegable; se corrigió para usar su rol accesible `combobox` y aprobó al repetir `npm run test:reservas -- --grep 'visita previa'` (1 prueba, 33.2 s con servidores). Los tres escenarios quedaron verificados; no se presenta la primera ejecución como una suite completamente aprobada.
- El recorrido de efectivo comprueba el ancho móvil de 360 px y genera `frontend/test-results/reservas-efectivo-360.png`; los artefactos locales de Playwright se regeneran en cada ejecución.
- Repetición conjunta tras corregir el selector: `npm run test:reservas` aprobó los tres recorridos en una ejecución (1.1 min): efectivo/entrega/devolución, visita sin bloqueo y solicitud/rechazo. Las ocho especificaciones pasaron `specs/scripts/validar-specs.ps1` tras sincronizar estado, modelo, contratos y tareas de 005.2.
- Detector CI: 13 pruebas aprobadas y manifiesto validado con `ultimaEntrega=004` e `incrementos=["005.1","005.2"]`. Un fallo inicial al limpiar temporales de Windows no reapareció en la repetición.
- Este incremento no acredita cotizaciones versionadas, Culqi/Yape, EQ-08, notificaciones externas ni CI remoto; la entrega 005 completa permanece pendiente.

### Validación local del incremento 005.3 (2026-10-27)

- Backend y frontend: compilación correcta; comprobación de tipos frontend correcta. Se aplicó `004-cotizaciones.sql` en bases exclusivas de pruebas, sin modificar `.env` ni migrar la base habitual del usuario.
- La validación final usó una base nueva `qatu_cotizaciones_1793132637988_test` en PostgreSQL/PostGIS local, con `DATABASE_URL` y `TEST_DATABASE_URL` configuradas en el proceso. `npm run migrate` aplicó el esquema completo; `npm test` en backend aprobó 83 pruebas sin fallos ni omisiones (155.7 s).
- Se verificaron permisos de cliente/proveedor, 404 para terceros, JSON estricto, importes enteros, vigencia futura hasta inicio, versiones conservadas, rechazo con motivo, una sola aceptación concurrente y rechazo de la versión sustituida incluso al competir con una publicación nueva. La lectura del historial ocurre después de obtener el bloqueo de solicitud. Un fallo de outbox revierte respuesta y versión. PostgreSQL impide reescribir importes y borrar propuestas.
- `npm run test:reservas` aprobó los cuatro recorridos juntos (1.7 min): oficio con propuesta/rechazo/nueva versión/aceptación, efectivo con entrega/devolución, visita sin bloqueo y solicitud/rechazo. Se comprobó persistencia del importe de S/ 250.75 aceptado, cero efectivo y ninguna reserva automática de agenda. La captura móvil de 360 px está en `frontend/test-results/cotizacion-acordada-360.png`, artefacto local ignorado por Git y revisado visualmente.
- Detector CI: 15 pruebas aprobadas y manifiesto real validado con incrementos 005.1/005.2/005.3 y última entrega completa 004. Las ocho especificaciones pasaron sus prerrequisitos; `git diff --check` no encontró errores de formato.
- Incidencias resueltas durante la validación: PostgreSQL estaba pausado y se reanudó; la prueba de fallo de outbox se ajustó al 503 definido por el proyecto; una primera regresión completa sufrió ECONNRESET en la prueba previa de conservación documental. La repetición final en la base nueva aprobó también ese caso.
- Aceptar una cotización conserva el acuerdo económico sin confirmar agenda, servicio ejecutado, anticipo ni pago. Bloqueo de agenda de oficios, comisiones/cancelaciones económicas, pasarela Culqi/Yape, EQ-08 y CI remoto permanecen pendientes.

### Validación local del incremento 005.4 — agenda sin anticipo

- Compilación backend/frontend y tipos frontend correctos. La migración `005-agenda-oficios.sql` se aplicó con el esquema completo en la base nueva y exclusiva `qatu_agenda_final_1793152494344_test`; no se cambió `.env` ni se migró la base habitual del usuario.
- `npm test` del backend aprobó 89 pruebas, sin fallos ni omisiones (78.2 s). Incluye exclusión entre dos clientes de la misma agenda, rechazo sin efectos parciales, liberación por cancelación previa al inicio, rangos adyacentes, estado sin vencimiento de herramientas, rollback completo si falla AGENDA_CONFIRMADA y confirmación expresa de acuerdos históricos incluso con vigencia original finalizada.
- La migración no convierte acuerdos históricos en reservas. Se verificaron permisos, respuesta histórica inmutable, rechazo de confirmación repetida y restricciones PostgreSQL que impiden servicio confirmado sin bloqueo/cotización coherentes.
- `npm run test:reservas` aprobó los cinco recorridos juntos (1.8 min): conflicto/cancelación/aceptación del segundo cliente, cotización con agenda, efectivo/entrega/devolución, visita y solicitud/rechazo. La prueba de conflicto se ajustó para distinguir la alerta de negocio del anunciador de navegación de Next.js, ambos con rol alert; la repetición final completa pasó.
- Se comprobó en móvil de 360 px que el servicio confirmado conserva pago PENDIENTE, efectivo cero y vencimiento nulo. Captura local `frontend/test-results/agenda-servicio-360.png`, revisada visualmente e ignorada por Git.
- Detector: 17 pruebas aprobadas y manifiesto real validado con 005.1/005.2/005.3/005.4, manteniendo última entrega completa 004. Las ocho especificaciones pasaron sus prerrequisitos; `git diff --check` correcto.
- Una ejecución inicial de cotizaciones tuvo una interrupción prolongada y caducaron sus sesiones; la repetición final en la base nueva aprobó todos los casos. No se atribuye ese resultado interrumpido a una validación completa.
- La agenda se reserva por recurso concreto e intervalo [inicio,fin), sin anticipo ni ejecución/cobro automáticos. Ejecución/cierre del oficio, disputas, pasarela, notificaciones externas y CI remoto siguen pendientes. La reversión automática de esta migración se rechaza para conservar compromisos auditados; los cambios de esquema posteriores deben aplicarse hacia delante.

### Validación local del incremento 005.5 — ejecución y cierre de oficios (2026-11-05)

- Entorno: Node.js 24.21.0, Windows y PostgreSQL/PostGIS local en el puerto 5433. Se usaron bases nuevas y exclusivas con sufijo `_test`, con el esquema completo hasta `006-ejecucion-oficios.sql` y variables configuradas en el proceso, sin modificar `.env` ni migrar la base habitual del usuario.
- Antes de cambiar código, `npm test` en backend aprobó 89 pruebas sin omisiones. Después aprobó 97 sin fallos ni omisiones (96.5 s). `npm run build` en backend y frontend y `npm run typecheck` correctos.
- Se verificaron permisos (401, 403, 404), JSON estricto sin importes ni fechas del navegador, inicio solo desde la hora acordada, efectivo igual al total aceptado, rechazo que anula la declaración, cierre que libera la agenda, cancelación sin iniciar después de la hora y 409 una vez iniciado. Confirmar y rechazar a la vez tuvo un solo efecto. Un fallo de outbox revirtió el cierre. PostgreSQL rechazó importes ajenos a la cotización y estados incoherentes.
- `npm run test:reservas` aprobó los seis recorridos juntos (3.5 min), incluido el nuevo: horario futuro sin acción de inicio, inicio, término rechazado, nuevo término, confirmación y estado persistido al recargar. El fixture `adelantar-horario-e2e.ts` adelanta la hora acordada en la base de prueba, por lo que el recorrido no espera a que llegue el horario real.
- La revisión de la captura móvil de 360 px (`frontend/test-results/servicio-cerrado-360.png`, ignorada por Git) detectó fechas con doble punto. Se corrigió y se repitió la suite completa. La prueba comprueba que no hay desbordamiento horizontal.
- Detector: 19 pruebas aprobadas y manifiesto real validado con 005.1 a 005.5, manteniendo última entrega completa 004.
- CI remoto aprobado sobre `9583af3` en sus tres jobs ([ejecución](https://github.com/seeb-fault/Qatu-Ayacucho/actions/runs/42077694040)). No se acredita verificación bancaria ni notificación externa. Tampoco se incluyen cierre automático si el cliente no responde, cancelación después de iniciado, disputas por rechazos repetidos ni evidencia fotográfica (D12). Pasarela Culqi/Yape y EQ-08 siguen pendientes.

La tabla siguiente conserva los pendientes de aceptación del módulo completo, no los de los incrementos 005.1/005.2/005.3/005.4/005.5.

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | Pendiente |
| Fixture y condiciones | Pendiente |
| Comandos ejecutados | Pendiente |
| Resultados positivos/negativos | Pendiente |
| Medidas EQ-04/EQ-05/EQ-06/EQ-07/EQ-08 | Pendiente |
| Limitaciones y fallos | Pendiente |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).
