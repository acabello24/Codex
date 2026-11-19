# Operación compartida

## Purpose

Permitir que los cuatro agentes y el coordinador trabajen desde equipos distintos sobre las mismas solicitudes.

## ADDED Requirements

### Requirement: Acceso individual por internet

La aplicación compartida MUST estar disponible desde una URL HTTPS y admitir cinco sesiones simultáneas, una por cada agente y una para el coordinador. Consultar o modificar datos exige iniciar sesión con una cuenta individual, y las acciones registradas deben atribuirse a esa cuenta.

#### Scenario: Cinco sesiones activas

- **WHEN** los cuatro agentes y el coordinador inician sesión desde sus propios equipos
- **THEN** cada uno puede usar su bandeja sin invalidar las sesiones de los demás

#### Scenario: Acceso sin iniciar sesión

- **WHEN** una persona sin sesión intenta consultar una solicitud por URL directa
- **THEN** la aplicación solicita autenticación y no entrega datos del caso

### Requirement: Permisos por rol

El servicio MUST permitir a los agentes radicar solicitudes y consultar y actualizar sus propios casos. El coordinador debe poder consultar todos los casos, actualizarlos, reasignarlos y administrar la carga del directorio. El servicio debe aplicar los permisos a cada operación, incluso si se solicita fuera de la interfaz.

#### Scenario: Agente intenta reasignar o editar un caso ajeno

- **WHEN** un agente intenta reasignar una solicitud o modificar un caso asignado a otro agente
- **THEN** el servicio rechaza la operación sin alterar el caso ni su historial

### Requirement: Datos compartidos y conflicto de edición

La aplicación MUST conservar los cambios confirmados al cerrar sesión y mostrarlos a los usuarios autorizados al actualizar su bandeja. Si se intenta guardar una edición basada en datos desactualizados, debe preservar el cambio confirmado y ofrecer recargar el caso para revisar los datos actuales.

#### Scenario: Dos usuarios editan el mismo caso

- **WHEN** el agente y el coordinador abren el mismo caso, el coordinador guarda primero y el agente intenta guardar desde su versión anterior
- **THEN** la aplicación conserva el cambio del coordinador y avisa al agente del conflicto
- **AND** el intento rechazado no modifica el caso ni añade eventos

#### Scenario: Consulta desde otro equipo tras volver a iniciar sesión

- **WHEN** el coordinador vuelve a abrir la bandeja desde otro equipo después de una radicación confirmada
- **THEN** puede consultar la solicitud con el mismo identificador, responsable e historial
