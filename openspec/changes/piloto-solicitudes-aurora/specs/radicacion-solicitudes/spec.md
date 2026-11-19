# Radicación de solicitudes

## Purpose

Registrar las solicitudes que recibe Comercial Aurora y asignar un responsable desde el momento de la radicación.

## ADDED Requirements

### Requirement: Captura manual de solicitudes

El sistema MUST aceptar solicitudes por teléfono, correo electrónico o mensajería. Debe exigir un cliente del directorio, el canal, un tipo permitido y una descripción de al menos diez caracteres. La referencia de pedido es opcional. Los tipos permitidos son consulta de stock, estado de pedido, inconformidad de envío, facturación o cobro y devolución.

#### Scenario: Radicación válida sin referencia de pedido

- **WHEN** un agente registra una inconformidad de envío por teléfono con un cliente válido y una descripción suficiente
- **THEN** el sistema guarda la solicitud en estado Nuevo con NIT, razón social, canal, tipo y descripción
- **AND** confirma el identificador y responsable asignados

#### Scenario: Datos de radicación incompletos o inválidos

- **WHEN** se omite el canal o el cliente, se presenta un tipo ajeno al catálogo o la descripción tiene menos de diez caracteres
- **THEN** el sistema identifica los campos inválidos y conserva el formulario para su corrección
- **AND** no crea solicitudes ni eventos de historial

### Requirement: Identificador y fecha de recepción

El sistema MUST generar un identificador único e inmutable con formato AUR-YYYYMM-XXXX, con consecutivo de cuatro dígitos por mes en la zona America/Bogota. La aplicación compartida debe registrar la recepción con la hora del servicio en formato ISO 8601.

#### Scenario: Dos radicaciones simultáneas

- **WHEN** dos usuarios guardan solicitudes válidas al mismo tiempo
- **THEN** cada solicitud recibe un identificador distinto y ambas quedan registradas

#### Scenario: Cambio de mes

- **WHEN** se registra la primera solicitud de un nuevo mes en Bogotá
- **THEN** el identificador incluye el mes nuevo y el consecutivo 0001
- **AND** los identificadores anteriores se conservan

### Requirement: Asignación por turnos

El sistema MUST asignar la solicitud al siguiente agente disponible en la rotación compartida. El registro, la asignación y el evento de radicación deben completarse juntos. Si no hay agente disponible, debe informar el motivo y conservar el formulario.

#### Scenario: Rotación con un agente no disponible

- **WHEN** el siguiente agente en la rotación está marcado como no disponible y hay otro disponible
- **THEN** la solicitud queda asignada al siguiente agente disponible en el orden circular

#### Scenario: Ningún agente disponible

- **WHEN** se intenta guardar y ningún agente está disponible
- **THEN** el sistema informa que no puede asignar responsable y conserva los datos ingresados
- **AND** no crea una solicitud sin asignar
