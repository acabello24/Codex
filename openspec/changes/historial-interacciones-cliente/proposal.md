# Historial de interacciones por cliente

## Why

Al recibir una nueva solicitud, el equipo necesita conocer los contactos anteriores con el cliente para responder con contexto y detectar casos recurrentes. Hoy puede buscar solicitudes en la bandeja, pero el directorio no ofrece una vista del historial de atención del cliente.

## What Changes

- Añadir al directorio una acción **Ver interacciones** para cada cliente.
- Mostrar por NIT las solicitudes registradas por teléfono, correo electrónico y mensajería, incluidas las resueltas y cerradas, de la más reciente a la más antigua.
- Permitir abrir el detalle y el historial de atención de cada solicitud. Aplicar la visibilidad actual por rol en la aplicación compartida y en la demo.
- El alcance cubre interacciones registradas como solicitudes en Aurora. La captura de contactos por fuera del sistema y las integraciones con el ERP quedan para cambios posteriores.

## Capabilities

### New Capabilities

- `historial-interacciones-cliente` — Consulta desde el directorio de las solicitudes y el historial de atención de un cliente.

### Modified Capabilities

## Impact

Afecta al directorio y a la navegación hacia el detalle de una solicitud. La consulta se apoya en el NIT y en las solicitudes existentes. Depende de la radicación, el seguimiento y las reglas de acceso del piloto.
