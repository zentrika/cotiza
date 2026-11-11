import { Compass } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/common/States'
import { buttonVariants } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { EditorPage } from '@/features/editor/EditorPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { HomePage } from '@/features/home/HomePage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { Link, paths, RouterProvider, useRouter } from './router'
import { ServicesProvider, type AppServices } from './services'
import { ThemeProvider } from './theme'

function Screen() {
  const { route } = useRouter()
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'history':
      return <HistoryPage />
    case 'new-quote':
      return <EditorPage key="new" />
    case 'edit-quote':
      return <EditorPage key={route.id} quoteId={route.id} />
    case 'settings':
      return <SettingsPage />
    default:
      return (
        <EmptyState
          icon={<Compass />}
          title="Página no encontrada"
          description="La dirección no corresponde a ninguna sección de Cotiza."
          action={<Link to={paths.home} className={buttonVariants({ variant: 'outline' })}>Volver al inicio</Link>}
        />
      )
  }
}

export function App({ services }: { services?: AppServices }) {
  return (
    <ThemeProvider>
      <ServicesProvider services={services}>
        <RouterProvider>
          <AppShell>
            <Screen />
          </AppShell>
          <Toaster />
        </RouterProvider>
      </ServicesProvider>
    </ThemeProvider>
  )
}
