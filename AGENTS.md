# Desarrollo guiado por especificaciones

Al iniciar una tarea en un checkout nuevo, instala las dependencias con `npm ci` si todavía faltan. El proyecto requiere Node.js 22.20.0 o posterior.

Usa las skills de OpenSpec de `.agents/skills/`. Para proponer un cambio, usa `$openspec-propose`. Para implementar sus tareas, usa `$openspec-apply-change`. Valida el cambio antes de archivarlo con `$openspec-archive-change`.

Ejecuta los comandos `openspec` que aparecen en las skills como `npm exec -- openspec <comando>` para usar la versión instalada en el proyecto. Las especificaciones vigentes están en `openspec/specs/` y los cambios en `openspec/changes/`.
