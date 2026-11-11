# Cotiza · Interfaz (TAREA 001 · UI)

## Dirección visual: «papel y tinta»

- **Superficies** cálidas tipo papel (`--background`, `--card`) y **tinta** azul-noche para el texto (`--foreground`, `--primary`).
- **Acento azul ZENTRIKA** (`--brand`, `--brand-strong`, `--brand-soft`, más `--brand-cyan`, `--brand-violet` y `--brand-gradient`), derivado de la paleta oficial `--zk-*` extraída de `public/brand/assets/*.svg`. Reservado para la marca, el foco, los estados activos, la numeración de secciones y el total. El gradiente oficial solo se usa en filetes decorativos finos.
- **Marca**: `[Isotipo ZENTRIKA] Cotiza | by ZENTRIKA` con el isotipo oficial (`zentrika-isotipo.svg`) sin alterar; en la barra lateral, «by ZENTRIKA» va bajo el nombre del producto.
- **Tipografía**: *Fraunces* (display, títulos y totales) + *Inter* (interfaz, con cifras tabulares `.tabular`). Ambas se empaquetan localmente con `@fontsource-variable`, sin llamadas a Google Fonts.
- **Modo oscuro** con la clase `.dark` (claro, oscuro o según el sistema). La preferencia se guarda en `localStorage` (`cotiza:theme`) y un script en `index.html` la aplica antes del primer pintado.
- La **vista previa del documento** usa siempre colores de papel, también en modo oscuro, porque representa lo que recibe el cliente.
- Movimiento sutil (`animate-fade-up`, zoom de diálogos) y respeto de `prefers-reduced-motion`.

Los tokens están en `src/index.css` y se exponen en `tailwind.config.ts`.

## Estructura

```
src/app/            App, enrutador por hash, tema, inyección de servicios
src/components/ui/  Primitivas shadcn/ui (Button, Input, Select, Dialog, AlertDialog, DropdownMenu, Card, Badge, Skeleton, Toaster…)
src/components/     brand/Logo · layout/AppShell, PageHeader, ThemeToggle · common/FormField, StatusBadge, Money, EmptyState, ErrorState
src/features/quotes Lógica pura (draft, format, filter, status) + componentes compartidos (QuoteDocument, QuoteRow, menús, diálogos) + useQuotes
src/features/home | history | editor | settings   Pantallas
src/hooks/useAsync  Carga con estados de carga, éxito y error
```

**Separación vista/lógica.** La lógica de dominio de la UI (normalizar importes, validar con los esquemas Zod, numerar, duplicar, filtrar) vive en módulos sin React (`features/quotes/*.ts`) con pruebas unitarias. Los hooks (`useQuoteEditor`, `useQuotes`, `useProfileForm`) orquestan los casos de uso sobre los **contratos** de `src/services/contracts.ts`; los componentes solo leen estado y llaman acciones.

**Servicios.** `src/app/services.tsx` inyecta `QuoteService`, `ClientService` y `ProfileService`. Hoy conecta `mockQuoteService` y `mockClientService`, más un `ProfileService` en memoria que implementa el contrato existente (los mocks no lo incluían). Para pasar a Dexie basta con cambiar `defaultServices`.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `#/` | Inicio |
| `#/cotizaciones` | Historial |
| `#/cotizaciones/nueva` | Editor (nueva) |
| `#/cotizaciones/:id` | Editor (existente) |
| `#/ajustes` | Configuración |

## Componentes clave

- **`FormField`**: etiqueta, control, ayuda y error, con `id`, `aria-invalid` y `aria-describedby` conectados. Marca `data-field-error` para enfocar el primer error al guardar.
- **`QuoteDocument`**: la cotización «en papel». Es la referencia visual para el futuro PDF.
- **`ItemsEditor`**: líneas con descuento e impuesto propios, importe calculado con `calculateItem` y entrada de importes al estilo colombiano (`1.500.000`, `1.500,50`).
- **`TotalsPanel`**: subtotal, descuentos, impuestos y total, calculados con `QuoteService.calculateTotals`.
- **`QuoteRow` / `QuoteActionsMenu`**: fila de listado y acciones contextuales (abrir, vista previa, duplicar, cambiar estado, eliminar).
- **`StatusBadge`**: color, punto y texto por estado; nunca depende solo del color.

## Accesibilidad

Enlace «Saltar al contenido», navegación con `aria-current`, foco visible con anillo azul ZENTRIKA, primitivas Radix navegables con teclado, etiquetas en todos los campos y avisos `aria-live` para el total y el estado de guardado. Atajos: `/` enfoca la búsqueda del historial y `Ctrl/⌘ + S` guarda en el editor.

## Necesidades de contrato detectadas (sin modificar modelos)

1. **Condiciones separadas de las notas**: `Quote` solo tiene `notes`. La sección «Notas y condiciones» usa ese campo. Si se quieren separar, hace falta un campo `terms`.
2. **Descuento o impuesto global**: el modelo solo tiene porcentajes por línea, y la UI respeta eso.
3. **Mock de `ProfileService`**: no existe en `mocks.ts`. Se creó un adaptador en memoria en `src/app/services.tsx`.
4. **Preferencias de usuario** (moneda o IVA por defecto, días de vigencia): no hay modelo. Por ahora la UI usa COP, IVA 19 % y 30 días.
5. **Unicidad del número de cotización**: el contrato no la exige. La UI solo avisa si el número está repetido.
6. **Persistencia**: los datos viven en memoria hasta conectar Dexie, y la pantalla de Ajustes lo indica.
