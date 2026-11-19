# Directorio de clientes

## Purpose

Facilitar la selección de clientes durante la radicación a partir de un directorio que pueda cargarse y validarse.

## ADDED Requirements

### Requirement: Importación y validación de clientes

El sistema MUST aceptar archivos CSV o JSON con NIT y razón social por cliente. Debe señalar los registros inválidos y los NIT duplicados dentro del archivo o en el directorio. Debe incorporar los registros válidos y únicos sin sobrescribir clientes existentes y mostrar un resumen de la carga.

#### Scenario: Importación con filas inválidas y duplicadas

- **WHEN** el coordinador importa un CSV con un cliente nuevo válido, una fila sin razón social y un NIT que ya existe
- **THEN** se incorpora el cliente nuevo y se conserva el cliente existente
- **AND** el resumen identifica la fila inválida y el NIT duplicado

#### Scenario: Archivo ilegible

- **WHEN** se importa un JSON mal formado
- **THEN** el sistema explica que no pudo leer el archivo y conserva intacto el directorio

### Requirement: Selección de cliente por NIT

El formulario de radicación MUST permitir buscar por NIT y mostrar la razón social del cliente seleccionado. Si el NIT no existe, debe informar que no hay coincidencias y permitir corregir la búsqueda.

#### Scenario: Búsqueda de un cliente recién importado

- **WHEN** el agente busca el NIT de un cliente incorporado mediante una carga válida
- **THEN** el formulario muestra su razón social y permite seleccionarlo para la solicitud
