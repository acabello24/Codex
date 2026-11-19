# Priorización y seguimiento

## Purpose

Ayudar al equipo a priorizar solicitudes, dar continuidad a los casos pendientes y revisar su desempeño semanal.

## ADDED Requirements

### Requirement: Avisos en la bandeja

La bandeja MUST indicar aviso a partir de 24 horas corridas, plazo crítico a partir de 36 y vencimiento al superar 48. Se debe poder ordenar por el tiempo restante, con los casos abiertos más urgentes primero.

#### Scenario: Casos en distintos tramos del plazo

- **WHEN** se consulta la bandeja con casos abiertos de 24, 36 y más de 48 horas y se ordena por tiempo restante
- **THEN** aparecen con el aviso correspondiente y el vencido queda primero
- **AND** los resueltos y cerrados aparecen después de los abiertos y sin avisos

### Requirement: Solicitudes relacionadas al radicar

Al seleccionar un NIT en el formulario, la aplicación MUST mostrar los casos abiertos visibles para la cuenta. Debe destacar los de la misma referencia de pedido, si se indica, y permitir abrir su detalle sin perder los datos ingresados.

#### Scenario: Pedido con un caso activo

- **WHEN** se ingresa un NIT y una referencia de pedido que coincide con un caso abierto autorizado
- **THEN** aparece marcado como Mismo pedido y se puede abrir
- **AND** los casos ajenos a los permisos del usuario quedan fuera de la lista

### Requirement: Próxima acción

Cada caso pendiente MUST admitir una próxima acción con descripción, responsable y fecha de revisión. Si se captura una acción, los tres datos son obligatorios. Sus cambios deben conservarse en el historial y la acción activa se retira al salir de un estado pendiente.

#### Scenario: Guardar una acción de logística

- **WHEN** un usuario autorizado guarda los tres campos de una próxima acción con fecha válida
- **THEN** la acción reaparece al abrir el caso y queda registrada en el historial

### Requirement: Resumen semanal de coordinación

La aplicación MUST mostrar solo al coordinador las solicitudes recibidas y resueltas durante las últimas 168 horas, el porcentaje de las resueltas en 48 horas o menos, los casos aún abiertos por agente y los tipos de reclamo recibidos.

#### Scenario: Semana sin resoluciones

- **WHEN** el coordinador consulta el resumen sin resoluciones en el periodo
- **THEN** el resumen muestra un guion en lugar del porcentaje
- **AND** cada agente queda excluido de la vista de resumen
