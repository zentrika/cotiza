# Cotiza 1.0 · ZENTRIKA

Base arquitectónica del generador de cotizaciones para profesionales independientes y pequeños negocios.

## Estado

TAREA 001 — Arquitectura inicial. Esta rama contiene el esqueleto React + TypeScript + Vite, contratos de dominio, validaciones, reglas de cálculo, mocks y configuración de calidad. La interfaz final, la persistencia productiva y la generación de PDF se implementarán en tareas posteriores con autorización explícita.

## Desarrollo

```bash
npm install
npm run dev
```

Comandos de verificación: `npm run build`, `npm run lint`, `npm test` y `npm run test:e2e`.

## Estructura

- `src/domain`: modelos, esquemas Zod y cálculo monetario con `decimal.js`.
- `src/services`: contratos de servicios y adaptadores en memoria para desarrollo.
- `src/db`: límite de persistencia Dexie; no contiene aún flujos completos de guardado.
- `src/store`: estado de UI con Zustand.
- `src/app`: shell de la aplicación, enrutador por hash, tema e inyección de servicios.
- `src/components`: primitivas shadcn/ui (`ui/`) y componentes compartidos de marca, layout y estados.
- `src/features`: pantallas (inicio, historial, editor, ajustes) y lógica de cotizaciones sin React.
- `docs`: producto, contratos, criterios de aceptación y sistema de interfaz (`docs/UI.md`).
