# Uso de GitHub Spec Kit en Qatu

## Instalación de proyecto

Se generaron archivos oficiales con Specify CLI 1.2.0 usando integración Claude y scripts PowerShell. Se prepararon en un directorio temporal vacío y se incorporaron .specify/ y .claude/; así se conservaron las modificaciones previas. La CLI se ejecutó mediante uv tool run, no se exige una instalación global ni se cambió el código de aplicación.

RC13 menciona Claude Code; por eso la integración instalada es claude. Sus diez skills viven en .claude/skills. La constitución Qatu está en .specify/memory/constitution.md. Plantillas genéricas oficiales no son especificaciones del producto.

## Seleccionar una especificación existente

Desde la raíz real Qatu (la que contiene .specify y specs), en PowerShell:

```powershell
$env:SPECIFY_FEATURE_DIRECTORY = 'specs/002-usuarios-acceso'
$env:SPECIFY_FEATURE = '002-usuarios-acceso'
& ./.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireSpec -RequireTasks -IncludeTasks
```

Cambiar las dos variables por la carpeta elegida. El contexto inicial persistido es 001-descubrimiento-ofertas. Las variables son del proceso: iniciar Claude desde esa terminal permite heredarlas; para cambiar un proceso ya abierto se debe cambiar el contexto explícitamente antes de invocar un skill. Los scripts oficiales persisten la selección en .specify/feature.json salvo modo sin persistencia.

## Ciclo de trabajo en Claude Code

Las invocaciones de esta versión usan guion y se escriben en el chat del agente, no como comandos de terminal:

```text
/speckit-clarify Revisa la especificación seleccionada contra docs y resuelve sus decisiones pendientes antes de la operación afectada.
/speckit-plan Conserva los seis módulos y los contratos Qatu; completa el plan seleccionado sin cambiar el alcance.
/speckit-tasks Organiza las tareas por historias y conserva trazabilidad RF/HU/EQ.
/speckit-analyze Comprueba constitución, cobertura y coherencia de los artefactos seleccionados.
```

Después de cerrar aclaraciones y revisar el análisis:

```text
/speckit-implement Implementa únicamente la especificación seleccionada y verifica sus escenarios.
/speckit-converge Comprueba el comportamiento contra la especificación y registra el trabajo faltante.
```

No invocar specify para recrear una carpeta existente sin revisar el efecto. El script setup-plan puede copiar una plantilla sobre plan.md: conservar el trabajo actual en Git o una copia revisable antes de regenerarlo. No se instaló la extensión opcional de Git, ni se crearon ramas/commits automáticamente.

## Estado real

Las especificaciones, planes y tareas actuales se redactaron contra docs siguiendo la estructura SDD. La generación oficial del entorno sí se ejecutó; no se afirma que todos los skills anteriores se hayan ejecutado ni que sus gates estén superados. Planes con políticas abiertas permanecen como borradores de las operaciones afectadas. No se programó la aplicación en esta etapa.

Fuentes: [Spec Kit](https://github.com/github/spec-kit) · [Proyecto existente](https://github.github.io/spec-kit/guides/existing-projects.html).
