# Contratos técnicos

## Entidades

`BusinessProfile`, `Client`, `Quote`, `QuoteItem`, `QuoteTotals`, `BackupPayload` y los snapshots históricos están definidos en `src/domain/models.ts`.

Todos los identificadores públicos son UUID. `UUID` mantiene la semántica de tipo en TypeScript y los esquemas Zod aplican la validación de formato.

Una `Quote` conserva `issuerSnapshot` y `clientSnapshot` al momento de emisión. Estos datos son inmutables dentro de la cotización y permiten que un cambio posterior del perfil o cliente no altere documentos históricos.

Los campos monetarios (`unitPrice`, descuentos y totales) son strings decimales. Esto evita pérdida de precisión al serializar y permite que el cálculo use `Decimal`. Cada línea tiene `discountPercent` y `taxPercent` propios.

Las reglas vigentes están exportadas como `CALCULATION_RULES`: escala de 2 decimales, redondeo `half-up`, y redondeo de cada línea antes de agregar subtotales, descuentos e impuestos.

Las cotizaciones exponen `issuedAt` como instante ISO-8601 y `validFrom`/`validUntil` como fechas ISO `YYYY-MM-DD`; el esquema rechaza una vigencia invertida.

## Validación

`src/domain/schemas.ts` contiene los esquemas Zod. Un servicio debe rechazar entidades inválidas antes de persistirlas.

## Servicios

- `Repository<T>`: listar, obtener, guardar y eliminar entidades.
- `ClientService`: repositorio de clientes.
- `QuoteService`: repositorio de cotizaciones más cálculo de totales.
- `ProfileService`: lectura y guardado del perfil emisor.
- `PdfService`: frontera futura para generar bytes de PDF; todavía sin implementación.
- `BackupService`: crear y restaurar un `BackupPayload` versionado; todavía sin implementación.

Los mocks de `src/services/mocks.ts` son la implementación de referencia para desarrollo de frontend y pruebas aisladas.

## Persistencia

`src/db/database.ts` define el esquema Dexie y la base `cotiza`. Cada entidad persistible y cada payload exportable porta `schemaVersion`; la versión actual es `DATA_SCHEMA_VERSION = 1`. `BackupPayload` incluye fecha de exportación, perfil, clientes y cotizaciones y debe validarse con `backupPayloadSchema` antes de restaurar.
