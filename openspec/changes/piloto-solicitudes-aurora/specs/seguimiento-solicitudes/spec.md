# Seguimiento de solicitudes

## Purpose

Dar visibilidad al estado de la atención, conservar el historial y medir los plazos de resolución.

## ADDED Requirements

### Requirement: Bandeja de solicitudes

La bandeja MUST permitir buscar por identificador, NIT o razón social y combinar filtros por estado, responsable y antigüedad dentro del alcance autorizado del usuario. Cada fila debe mostrar el identificador, cliente, estado, responsable y fecha de recepción.

#### Scenario: Búsqueda con filtros combinados

- **WHEN** el coordinador busca un NIT y filtra por estado En proceso y responsable
- **THEN** únicamente se muestran los casos que cumplen los tres criterios
- **AND** se informa si no hay coincidencias

### Requirement: Estados y resolución

El sistema MUST usar los estados Nuevo, En proceso, Pendiente logística, Pendiente ventas, Resuelto y Cerrado. Un caso nuevo puede pasar a En proceso. Un caso en proceso puede pasar a pendiente o resuelto, y un caso pendiente puede volver a En proceso o resolverse. Solo un caso resuelto puede cerrarse. Resolver exige registrar una respuesta y una fecha de resolución.

#### Scenario: Resolución sin respuesta

- **WHEN** un agente autorizado intenta resolver una solicitud sin registrar la respuesta
- **THEN** el sistema solicita la respuesta y conserva el estado previo

#### Scenario: Cierre de un caso sin resolver

- **WHEN** un usuario intenta cerrar un caso pendiente
- **THEN** el sistema rechaza la transición y no altera el historial

### Requirement: Historial de atención

El sistema MUST añadir un evento de historial por cada radicación, transición o reasignación exitosa. Debe registrar el ticket, la fecha y hora, el usuario, la acción y los valores anteriores y nuevos que correspondan. La aplicación no debe permitir editar ni borrar esos eventos.

#### Scenario: Reasignación por el coordinador

- **WHEN** el coordinador cambia el responsable a otro agente disponible
- **THEN** el detalle muestra el nuevo responsable y un nuevo evento con ambos responsables y la cuenta del coordinador
- **AND** los eventos previos siguen disponibles

### Requirement: Plazo de 48 horas corridas

El sistema MUST calcular el tiempo transcurrido desde la recepción hasta la resolución, incluyendo noches, fines de semana y festivos. Debe marcar como cumplido un caso resuelto en 48 horas o menos e identificar al coordinador los casos sin resolver que superen 48 horas.

#### Scenario: Resolución en el límite exacto

- **WHEN** un caso se resuelve exactamente 48 horas después de su recepción
- **THEN** el historial conserva la fecha de resolución y el caso figura como atendido dentro del plazo

#### Scenario: Caso abierto vencido

- **WHEN** un caso pendiente sigue sin resolver tras superar 48 horas desde su recepción
- **THEN** el coordinador lo ve marcado como vencido en la bandeja
- **AND** si se resuelve después, queda registrado como resuelto fuera del plazo
