# Historial de interacciones por cliente

## Purpose

Consultar los contactos anteriores de un cliente desde el directorio para dar continuidad a su atención.

## ADDED Requirements

### Requirement: Consulta de interacciones desde el directorio

La aplicación compartida y la demo MUST permitir abrir desde el directorio las interacciones registradas para un cliente. La consulta debe agrupar por NIT exacto e incluir las solicitudes autorizadas de cualquier estado, ordenadas por fecha de recepción descendente.

#### Scenario: Selección de un cliente con solicitudes previas

- **WHEN** el coordinador abre Ver interacciones para un cliente que tiene solicitudes abiertas y cerradas por distintos canales
- **THEN** ve sus solicitudes abiertas y cerradas, de la más reciente a la más antigua
- **AND** no aparecen solicitudes de otro NIT aunque tenga una razón social similar

#### Scenario: Cliente sin interacciones visibles

- **WHEN** el usuario abre la vista de un cliente que no tiene solicitudes visibles para su cuenta
- **THEN** la vista informa que no hay interacciones disponibles

### Requirement: Resumen y detalle de cada interacción

Cada entrada MUST mostrar la fecha y hora de recepción, el canal, el ticket, el tipo de solicitud, el estado y el responsable actual. El usuario debe poder abrir el detalle existente, consultar el historial registrado y regresar a la vista del mismo cliente.

#### Scenario: Consultar la atención de un ticket

- **WHEN** el usuario selecciona un ticket visible con cambios de estado o responsable
- **THEN** puede consultar esos cambios en su historial de atención
- **AND** al regresar se muestra de nuevo el historial del cliente seleccionado

### Requirement: Visibilidad por rol

La consulta MUST aplicar los permisos vigentes de solicitudes. El coordinador puede ver todos los tickets del cliente. El agente puede ver los que tiene asignados en ese momento. Este límite se aplica a las entradas, los recuentos y el acceso al detalle.

#### Scenario: Cliente con solicitudes asignadas a distintos agentes

- **WHEN** un agente abre el historial de un cliente con una solicitud propia y otra asignada a otro agente
- **THEN** solo ve su solicitud y no obtiene datos ni recuentos de la solicitud ajena

#### Scenario: Reasignación durante la consulta

- **WHEN** un agente actualiza la vista después de que el coordinador reasignó un ticket a otra persona
- **THEN** el ticket deja de aparecer y el agente ya no puede consultar su detalle
