# Diseño

## Contexto

La bandeja ya dispone de fechas y estados, el formulario incluye el NIT y la referencia de pedido, y el servicio limita las solicitudes según la cuenta.

## Decisiones

- Calcular el plazo al consultar la bandeja. Para el resumen, usar la fecha de recepción para entradas y la fecha de resolución para cumplimiento. Los casos abiertos por agente representan la carga actual.
- Consultar las solicitudes autorizadas para sugerir casos abiertos. Comparar el NIT exacto y la referencia sin distinguir mayúsculas. Volver a verificar el acceso al abrir el detalle.
- Guardar la acción como campo opcional de la solicitud. Aplicar el control de versión existente y registrar los cambios en el historial. Los respaldos anteriores siguen siendo válidos.
- Contar inconformidades de envío, facturación o cobro y devoluciones como reclamos usando las categorías actuales.
