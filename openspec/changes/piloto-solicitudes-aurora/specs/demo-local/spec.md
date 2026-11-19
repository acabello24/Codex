# Demo local

## Purpose

Permitir que el equipo pruebe el flujo de atención desde un solo archivo HTML en su navegador.

## ADDED Requirements

### Requirement: Ejecución autónoma y perfiles simulados

La demo MUST entregarse como un único archivo HTML con CSS y JavaScript incorporados. Debe abrir con doble clic sin conexión ni servidor y ofrecer datos ficticios y perfiles simulados para probar radicación, asignación, bandeja, estados e historial.

#### Scenario: Prueba sin conexión

- **WHEN** el usuario abre el HTML con doble clic en un navegador sin conexión
- **THEN** puede seleccionar un perfil, radicar una solicitud de prueba y consultar su asignación, estado e historial sin recursos externos

### Requirement: Importación del directorio local

La demo MUST permitir importar clientes ficticios en CSV o JSON y aplicar la validación de datos y duplicados del directorio.

#### Scenario: Carga de un cliente de prueba

- **WHEN** el usuario importa un CSV válido con un nuevo NIT y su razón social
- **THEN** puede encontrar y seleccionar ese cliente durante la radicación local

### Requirement: Exportación y restauración de datos

La demo MUST exportar un archivo JSON con los clientes, solicitudes, historial y datos necesarios para continuar los consecutivos y la rotación. Debe validar el archivo completo antes de restaurarlo y conservar los datos actuales si la validación falla.

#### Scenario: Restauración en una nueva sesión

- **WHEN** el usuario exporta la demo tras radicar un caso, vuelve a abrir el HTML y carga el archivo exportado
- **THEN** se recuperan el directorio, los casos, sus responsables y el historial
- **AND** la siguiente radicación continúa la rotación y genera un identificador distinto de los ya restaurados

#### Scenario: Respaldo inválido

- **WHEN** el usuario carga un archivo mal formado o con solicitudes que hacen referencia a clientes o responsables inexistentes
- **THEN** la demo informa el error y conserva el estado previo
