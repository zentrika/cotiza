import '@/test/browser-polyfills'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Client, Quote } from '@/domain/models'
import { calculateQuoteTotals } from '@/domain/calculations'
import { createInMemoryRepository, mockClient, mockQuote } from '@/services/mocks'
import { App } from './App'
import { createInMemoryProfileService, type AppServices } from './services'

function freshServices(): AppServices {
  return {
    quotes: { ...createInMemoryRepository<Quote>([structuredClone(mockQuote)]), calculateTotals: (quote) => calculateQuoteTotals(quote.items) },
    clients: createInMemoryRepository<Client>([structuredClone(mockClient)]),
    profile: createInMemoryProfileService(),
  }
}

async function go(path: string) {
  await act(async () => {
    window.location.hash = path
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

const change = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } })

beforeEach(() => {
  window.history.replaceState(null, '', '#/')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Inicio', () => {
  it('presenta Cotiza, la privacidad y las cotizaciones recientes', async () => {
    render(<App services={freshServices()} />)
    expect(screen.getByRole('heading', { level: 1, name: /cotizaciones claras/i })).toBeInTheDocument()
    expect(screen.getByText('Tus datos son tuyos')).toBeInTheDocument()
    expect(await screen.findByText('Servicios profesionales')).toBeInTheDocument()
    expect(screen.getByText('Configura los datos de tu negocio')).toBeInTheDocument()
  })
})

describe('Editor', () => {
  it('muestra errores de validación y no guarda un borrador incompleto', async () => {
    const services = freshServices()
    render(<App services={services} />)
    await go('/cotizaciones/nueva')
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar cotización' }))
    expect((await screen.findAllByText('Este campo es obligatorio.')).length).toBeGreaterThan(0)
    expect(await services.quotes.list()).toHaveLength(1)
  })

  it('crea una cotización con cliente nuevo, calcula totales y guarda el perfil', async () => {
    const services = freshServices()
    render(<App services={services} />)
    await go('/cotizaciones/nueva')

    change(await screen.findByLabelText('Título o asunto'), 'Rediseño web')
    const [clientName, issuerName] = screen.getAllByLabelText('Nombre o razón social')
    change(clientName, 'Café La Montaña')
    change(issuerName, 'Estudio Andes')
    change(screen.getByLabelText('Descripción de la línea 1'), 'Diseño UX')
    change(screen.getByLabelText('Precio unitario (COP)'), '1.000.000')
    change(screen.getByLabelText('Cantidad'), '2')

    // "1.000.000" se interpreta con puntos de miles: 2 × 1.000.000 + IVA 19 %
    const summary = screen.getByRole('complementary', { name: 'Resumen de la cotización' })
    expect(within(summary).getByText('$ 2.380.000')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cotización' }))

    await waitFor(async () => expect(await services.quotes.list()).toHaveLength(2))
    const saved = (await services.quotes.list()).find((q) => q.id !== mockQuote.id)!
    expect(saved).toMatchObject({ number: 'COT-0002', title: 'Rediseño web', clientSnapshot: { name: 'Café La Montaña' }, issuerSnapshot: { legalName: 'Estudio Andes' } })
    const clients = await services.clients.list()
    expect(clients.map((c) => c.name)).toContain('Café La Montaña')
    expect(saved.clientId).toBe(clients.find((c) => c.name === 'Café La Montaña')!.id)
    expect((await services.profile.get())?.legalName).toBe('Estudio Andes')
    await waitFor(() => expect(window.location.hash).toBe(`#/cotizaciones/${saved.id}`))
  })

  it('indica cuando una cotización no existe', async () => {
    render(<App services={freshServices()} />)
    await go('/cotizaciones/00000000-0000-4000-8000-00000000ffff')
    expect(await screen.findByText('Esta cotización no existe')).toBeInTheDocument()
  })
})

describe('Historial', () => {
  it('busca cotizaciones y muestra el estado vacío de búsqueda', async () => {
    render(<App services={freshServices()} />)
    await go('/cotizaciones')
    expect(await screen.findByText('Servicios profesionales')).toBeInTheDocument()
    change(screen.getByLabelText('Buscar cotizaciones'), 'inexistente')
    expect(screen.getByText('Sin coincidencias')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText('Servicios profesionales')).toBeInTheDocument()
  })
})

describe('Ajustes', () => {
  it('valida y guarda el perfil del negocio', async () => {
    const services = freshServices()
    render(<App services={services} />)
    await go('/ajustes')
    change(await screen.findByLabelText(/^Correo/), 'correo-malo')
    change(screen.getByLabelText('Nombre o razón social'), 'Estudio Andes')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))
    expect(await screen.findByText('Escribe un correo válido.')).toBeInTheDocument()
    change(screen.getByLabelText(/^Correo/), 'hola@andes.co')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))
    await waitFor(async () => expect((await services.profile.get())?.email).toBe('hola@andes.co'))
  })
})
