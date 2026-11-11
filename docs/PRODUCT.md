# Cotiza 1.0 — Producto

## Propósito

Cotiza permite a profesionales independientes y pequeños negocios crear cotizaciones claras, calcular totales sin errores de precisión y prepararlas para compartir con sus clientes.

## Alcance de la base arquitectónica

- Datos de negocio: perfil emisor, clientes, cotizaciones y partidas.
- Estados de cotización: borrador, enviada, aceptada, rechazada y vencida.
- Monedas iniciales: COP y USD.
- Cálculo explícito de subtotal, descuento, impuesto y total.
- Fronteras preparadas para IndexedDB/Dexie, PDF y UI shadcn/ui.

## Fuera de alcance de TAREA 001

No se implementan todavía flujos visuales finales, persistencia completa, autenticación, sincronización remota, envío de correo ni generación de PDF.

## Principios

1. Los importes se transportan como strings decimales y se calculan con `decimal.js`.
2. Las entradas externas se validan con Zod antes de entrar al dominio.
3. La UI depende de contratos de servicios, no de IndexedDB directamente.
4. Los adaptadores en memoria permiten que el frontend avance sin backend.
