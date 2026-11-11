import { test, expect } from '@playwright/test'

test.describe('ZENTRIKA — Cotiza 1.0 E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Contexto aislado: limpiamos IndexedDB antes de cada prueba para no depender de datos previos
    await page.goto('/')
    await page.evaluate(async () => {
      if (window.indexedDB) {
        const dbs = await window.indexedDB.databases?.()
        if (dbs) {
          for (const db of dbs) {
            if (db.name) window.indexedDB.deleteDatabase(db.name)
          }
        }
      }
      localStorage.clear()
    })
    await page.reload()
  })

  test('01. Abrir Cotiza por primera vez muestra bienvenida y estado inicial', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Cotiza · by ZENTRIKA/i)
    await expect(page.locator('h1')).toContainText('Cotizaciones claras')
    await expect(page.getByText('Tus datos son tuyos')).toBeVisible()
    await expect(page.getByText('Sin registro', { exact: true })).toBeVisible()
    await expect(page.getByText('Solo en tu dispositivo')).toBeVisible()
    await expect(page.getByText('Sin rastreo')).toBeVisible()
    // Enlace para configurar perfil cuando no existe
    await expect(page.getByText('Configura los datos de tu negocio')).toBeVisible()
  })

  test('02. Configurar el perfil del negocio persiste en ajustes', async ({ page }) => {
    await page.goto('/#/ajustes')
    await expect(page.locator('h1')).toContainText('Configuración')

    // Completar el formulario de perfil
    await page.getByLabel('Nombre o razón social').fill('Agencia Creativa Andina S.A.S.')
    await page.getByLabel('NIT o cédula').fill('901.888.777-1')
    await page.getByLabel('Teléfono').fill('+57 310 999 8888')
    await page.getByLabel('Correo').fill('contacto@andina.co')
    await page.getByLabel('Dirección').fill('Carrera 43A # 1-50, Medellín')
    await page.getByLabel('URL del logotipo').fill('https://andina.co/logo.png')

    // Guardar
    await page.getByRole('button', { name: 'Guardar perfil' }).click()
    await expect(page.getByText('Perfil guardado')).toBeVisible()
    await expect(page.getByText('Configurado')).toBeVisible()

    // Recargar y verificar que los datos persisten en IndexedDB
    await page.reload()
    await expect(page.getByLabel('Nombre o razón social')).toHaveValue('Agencia Creativa Andina S.A.S.')
    await expect(page.getByLabel('NIT o cédula')).toHaveValue('901.888.777-1')
  })

  test('03. Crear una cotización completa con cliente nuevo, múltiples productos, descuentos e IVA', async ({ page }) => {
    // 1. Configuramos el perfil primero para que las cotizaciones lo tomen
    await page.goto('/#/ajustes')
    await page.getByLabel('Nombre o razón social').fill('Zentrika Studio')
    await page.getByRole('button', { name: 'Guardar perfil' }).click()
    await expect(page.getByText('Perfil guardado')).toBeVisible()

    // 2. Ir a nueva cotización
    await page.goto('/#/cotizaciones/nueva')
    await expect(page.locator('h1')).toContainText('Nueva cotización')

    // Datos generales
    await page.getByLabel('Título o asunto').fill('Consultoría de Marca y Software')
    await expect(page.getByRole('combobox').filter({ hasText: /COP|USD/ })).toBeVisible()

    // Cliente (nuevo) en región Cliente
    const clientSection = page.getByRole('region', { name: 'Cliente' })
    await clientSection.getByLabel('Nombre o razón social').fill('Industrias del Café S.A.')
    await clientSection.getByLabel('NIT o cédula').fill('800.123.456-9')
    await clientSection.getByLabel('Correo').fill('gerencia@cafe.com')

    // Partida 1: Producto con IVA 19% y descuento 10%
    const descItem1 = page.getByLabel('Descripción de la línea 1')
    await descItem1.fill('Diseño de Identidad Visual')
    await page.locator('input[id$="-quantity"]').first().fill('1')
    await page.locator('input[id$="-unitPrice"]').first().fill('2.500.000')
    await page.locator('input[id$="-discountPercent"]').first().fill('10') // 10% desc
    await page.locator('input[id$="-taxPercent"]').first().fill('19')      // 19% IVA

    // Agregar Partida 2
    await page.getByRole('button', { name: 'Agregar producto o servicio' }).click()
    const descItem2 = page.getByLabel('Descripción de la línea 2')
    await descItem2.fill('Desarrollo Frontend React')
    await page.locator('input[id$="-quantity"]').nth(1).fill('2')
    await page.locator('input[id$="-unitPrice"]').nth(1).fill('1.800.000')
    await page.locator('input[id$="-discountPercent"]').nth(1).fill('0')
    await page.locator('input[id$="-taxPercent"]').nth(1).fill('19')

    // Notas
    await page.getByLabel('Notas para el cliente').fill('Tiempo de entrega estimado: 15 días hábiles.')

    // Verificar panel de totales reactivo
    const summary = page.getByRole('complementary', { name: 'Resumen de la cotización' })
    await expect(summary).toBeVisible()

    // Guardar cotización (botón de escritorio)
    await page.locator('main button').filter({ hasText: 'Guardar' }).first().click()
    await expect(page.getByText('Guardada en este dispositivo')).toBeVisible()

    // Verificar persistencia tras recarga (Escenario 7 y 8)
    await page.reload()
    await expect(page.getByLabel('Título o asunto')).toHaveValue('Consultoría de Marca y Software')
    await expect(page.getByLabel('Descripción de la línea 1')).toHaveValue('Diseño de Identidad Visual')
    await expect(page.getByLabel('Descripción de la línea 2')).toHaveValue('Desarrollo Frontend React')

    // Editar cotización guardada
    await page.getByLabel('Título o asunto').fill('Consultoría de Marca y Software v2')
    await page.locator('main button').filter({ hasText: 'Guardar' }).first().click()
    await expect(page.getByText('Guardada en este dispositivo')).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Título o asunto')).toHaveValue('Consultoría de Marca y Software v2')
  })

  test('04. Duplicar cotización, cambiar estado y eliminar con confirmación', async ({ page }) => {
    // 1. Configuramos perfil emisor
    await page.goto('/#/ajustes')
    await page.getByLabel('Nombre o razón social').fill('Agencia Creativa')
    await page.getByRole('button', { name: 'Guardar perfil' }).click()
    await expect(page.getByText('Perfil guardado')).toBeVisible()

    // 2. Creamos una cotización base
    await page.goto('/#/cotizaciones/nueva')
    await page.getByLabel('Título o asunto').fill('Campaña Publicitaria')
    const clientSection = page.getByRole('region', { name: 'Cliente' })
    await clientSection.getByLabel('Nombre o razón social').fill('Cliente Alpha')
    await page.getByLabel('Descripción de la línea 1').fill('Pauta digital')
    await page.locator('input[id$="-unitPrice"]').first().fill('500.000')
    await page.locator('main button').filter({ hasText: 'Guardar' }).first().click()
    await expect(page.getByText('Guardada en este dispositivo')).toBeVisible()

    // Ir al historial
    await page.goto('/#/cotizaciones')
    await expect(page.getByText('Campaña Publicitaria')).toBeVisible()

    // Duplicar cotización desde menú de fila
    const rowMenu = page.getByRole('button', { name: /Acciones para/i }).first()
    await rowMenu.click()
    await page.getByRole('menuitem', { name: /Duplicar/i }).click()
    await expect(page.getByText(/Se creó COT-/i)).toBeVisible()

    // Verificar que existe la copia
    await page.goto('/#/cotizaciones')
    await expect(page.getByText(/Campaña Publicitaria \(copia\)/i)).toBeVisible()

    // Cambiar estado a 'Aceptada'
    const copyMenu = page.getByRole('button', { name: /Acciones para/i }).first()
    await copyMenu.click()
    await page.getByRole('menuitem', { name: /Cambiar estado/i }).hover()
    await page.getByRole('menuitemradio', { name: /Aceptada/i }).click()
    await expect(page.getByText(/ahora está «Aceptada»/i)).toBeVisible()

    // Eliminar con diálogo de confirmación
    const deleteMenu = page.getByRole('button', { name: /Acciones para/i }).first()
    await deleteMenu.click()
    await page.getByRole('menuitem', { name: /Eliminar/i }).click()

    // Modal de confirmación
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog).toContainText('¿Eliminar')
    await confirmDialog.getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.getByText(/eliminada/i)).toBeVisible()
  })

  test('05. Vista previa y descarga de PDF', async ({ page }) => {
    // 1. Configuramos perfil emisor
    await page.goto('/#/ajustes')
    await page.getByLabel('Nombre o razón social').fill('Estudio Gráfico')
    await page.getByRole('button', { name: 'Guardar perfil' }).click()
    await expect(page.getByText('Perfil guardado')).toBeVisible()

    // 2. Creamos cotización
    await page.goto('/#/cotizaciones/nueva')
    await page.getByLabel('Título o asunto').fill('Proyecto PDF Test')
    const clientSection = page.getByRole('region', { name: 'Cliente' })
    await clientSection.getByLabel('Nombre o razón social').fill('Cliente PDF')
    await page.getByLabel('Descripción de la línea 1').fill('Servicio Documental')
    await page.locator('input[id$="-unitPrice"]').first().fill('1.000.000')
    await page.locator('main button').filter({ hasText: 'Guardar' }).first().click()
    await expect(page.getByText('Guardada en este dispositivo')).toBeVisible()

    // Abrir vista previa
    await page.getByRole('button', { name: 'Vista previa' }).first().click()
    const previewDialog = page.getByRole('dialog')
    await expect(previewDialog).toBeVisible()
    await expect(previewDialog).toContainText('Vista previa')
    await expect(previewDialog).toContainText('Proyecto PDF Test')

    // Descargar PDF y verificar captura del evento de descarga
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar PDF' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })

  test('06. Adaptación responsive a móvil (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/#/cotizaciones/nueva')

    // En móvil, la barra inferior fija de guardado con total debe ser visible
    const bottomBar = page.locator('div.fixed.inset-x-0.bottom-\\[calc\\(4rem\\+env\\(safe-area-inset-bottom\\)\\)\\]')
    await expect(bottomBar).toBeVisible()
    await expect(bottomBar.getByRole('button', { name: 'Guardar' })).toBeVisible()

    // Los campos deben apilarse adecuadamente
    await expect(page.getByLabel('Título o asunto')).toBeVisible()
    await expect(page.getByLabel('Descripción de la línea 1')).toBeVisible()
  })

  test('07. Cambio entre modo claro y oscuro', async ({ page }) => {
    await page.goto('/#/ajustes')

    // Modo oscuro
    await page.locator('label').filter({ hasText: 'Oscuro' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Modo claro
    await page.locator('label').filter({ hasText: 'Claro' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('08. Verificación de recursos oficiales de ZENTRIKA', async ({ page }) => {
    await page.goto('/')

    // El logo en la barra lateral (o header en móvil) debe cargar el isotipo oficial SVG de la marca ZENTRIKA
    const logoImg = page.locator('aside img[src*="zentrika-isotipo.svg"], header img[src*="zentrika-isotipo.svg"]').first()
    await expect(logoImg).toHaveAttribute('src', '/brand/assets/zentrika-isotipo.svg')
    await expect(page.locator('aside, header').getByText('by ZENTRIKA').first()).toBeVisible()

    // Verificar que el favicon oficial de Zentrika está configurado en el head
    const favicon = page.locator('link[rel="icon"]')
    await expect(favicon).toHaveAttribute('href', '/brand/assets/zentrika-favicon.svg')
  })
})
