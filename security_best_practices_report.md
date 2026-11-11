# Informe de auditoría técnica — TAREA 001

## Resumen ejecutivo

La auditoría reporta 7 entradas vulnerables: 2 críticas, 2 altas y 3 moderadas. Seis pertenecen a herramientas de desarrollo o sus transitivas (`vitest`, `vite`, `vite-node`, `@vitest/mocker`, `tinypool`, `esbuild`) y una afecta una dependencia de producción (`zod`). No se ejecutó `npm audit fix --force` ni se modificaron versiones.

`npm audit --json` entregó el inventario completo. La ejecución textual posterior de `npm audit` no pudo consultar el endpoint por una resolución DNS de `registry.npmjs.org`; el resultado JSON obtenido previamente es la base de este informe.

## Vulnerabilidades

### Críticas

**AUDIT-001 — Vitest UI: lectura/ejecución arbitraria de archivos**

- Paquete: `vitest@2.1.9`, dependencia de desarrollo directa (`package.json:35`).
- Advisory: GHSA-5xrq-8626-4rwp, CVSS 9.8.
- Impacto: si se expone el servidor UI vulnerable, un atacante no autenticado podría leer y ejecutar archivos arbitrarios.
- Solución compatible: actualizar a Vitest `>=3.2.6`; el arreglo recomendado por npm requiere Vitest `5.1.0`, un salto mayor que debe validarse por separado.
- Mitigación: no ejecutar Vitest UI ni exponer servidores de test fuera de localhost/CI.

**AUDIT-002 — Tinypool: prototype pollution con posible RCE**

- Paquete: `tinypool@1.1.1`, transitiva de `vitest`, desarrollo.
- Advisories: GHSA-5gmw-xhrv-c9v3 y GHSA-85c8-ppgw-ccpr.
- Impacto: opciones manipuladas del worker pueden permitir contaminación de prototipos y ejecución remota en contextos afectados.
- Solución compatible: actualizar Vitest a una línea que use Tinypool corregido; npm propone Vitest `5.1.0`.
- Mitigación: ejecutar tests solo en CI/local confiable y nunca aceptar opciones de worker desde entradas externas.

### Altas

**AUDIT-003 — Vite: ejecución de comandos en Windows vía launch-editor**

- Paquete afectado: `vite@6.4.6`, transitivo de herramientas de desarrollo (`package.json:34`); la cadena de Vitest incluye además Vite `5.4.21`.
- Advisory principal: GHSA-587h-7wmj-h5pm, rango afectado `<=6.4.3` según npm.
- Impacto: argumentos manipulados al abrir el editor pueden producir ejecución arbitraria en ciertos entornos Windows.
- Solución compatible: actualizar Vite a una versión corregida; coordinarlo con la actualización de Vitest para evitar dos líneas incompatibles.
- Mitigación: no usar `launch-editor` con argumentos derivados de usuarios y mantener el servidor de desarrollo restringido.

**AUDIT-004 — Zod: agotamiento de memoria al validar colecciones sobredimensionadas**

- Paquete: `zod@3.25.76`, dependencia de producción directa (`package.json:24`).
- Advisory: GHSA-mrhx-c7xc-m3w5, CVSS 7.5.
- Impacto: entradas de gran tamaño pueden agotar memoria y causar denegación de servicio cuando llegan a validación.
- Solución compatible: actualizar a Zod `>=4.6.6`; es un salto mayor y requiere revisar compatibilidad de los esquemas actuales.
- Mitigación: limitar tamaño de payloads, número de líneas y profundidad antes de llamar a Zod.

### Moderadas

**AUDIT-005 — @vitest/mocker: path traversal / lectura arbitraria**

- Paquete: `@vitest/mocker@2.1.9`, transitiva de desarrollo.
- Advisory: GHSA-82fw-gwwq-j7x9, CVSS 5.9.
- Solución compatible: actualizar Vitest a una versión que incluya `@vitest/mocker >=4.1.11`; validar el salto de versión mayor.

**AUDIT-006 — @vitest/mocker: inyección de código en mocks manuales**

- Paquete: `@vitest/mocker@2.1.9`, transitiva de desarrollo.
- Advisory: GHSA-qxg6-89mg-rqv8, CVSS 4.7.
- Solución compatible: actualización coordinada de Vitest/@vitest/mocker; no exponer endpoints de mocking sin autenticación.

**AUDIT-007 — esbuild / vite-node: solicitudes cross-origin al servidor de desarrollo**

- Paquetes: `esbuild@0.21.5` y `vite-node@2.1.9`, transitivos de desarrollo.
- Advisory: GHSA-67mh-4wv8-2f99, CVSS 5.3.
- Impacto: un sitio malicioso podría inducir solicitudes al servidor de desarrollo y leer respuestas en configuraciones vulnerables.
- Solución compatible: actualizar la cadena Vite/Vitest a versiones corregidas.
- Mitigación: escuchar solo en localhost, no compartir el servidor dev en redes no confiables y no ejecutar builds de desarrollo en entornos productivos.

## Revisión de contratos

Se corrigieron únicamente contratos, modelos, esquemas, documentación y pruebas:

- UUIDs en entidades y validación Zod con `z.string().uuid()`.
- `issuerSnapshot` y `clientSnapshot` dentro de cada cotización.
- Importes como strings decimales.
- Descuento e impuesto por línea.
- `CALCULATION_RULES` con escala 2, `half-up` y redondeo por línea antes de agregar.
- `issuedAt`, `validFrom` y `validUntil`, con validación de rango.
- `DATA_SCHEMA_VERSION` en entidades persistibles y respaldos.
- `BackupPayload` y `BackupService` como interfaces públicas consumibles por Claude.
- Prueba de esquema para UUID, snapshots, fechas y versión.

## Recomendación

Priorizar la actualización coordinada de la cadena Vitest/Vite en una tarea de dependencias separada. Para Zod, preparar primero una prueba de compatibilidad con Zod 4 y aplicar límites de tamaño en los adaptadores de entrada. Estas acciones requieren autorización independiente y no forman parte de esta revisión.
