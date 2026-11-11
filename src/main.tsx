import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function ArchitecturePlaceholder() {
  return <main className="min-h-screen bg-background p-8 text-foreground"><h1 className="text-2xl font-semibold">Cotiza · ZENTRIKA</h1><p className="mt-2 text-slate-600">Arquitectura inicial lista para desarrollo.</p></main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><ArchitecturePlaceholder /></StrictMode>)
