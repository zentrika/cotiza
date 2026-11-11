import { create } from 'zustand'
import type { Quote } from '@/domain/models'

interface QuoteStore { activeQuote?: Quote; setActiveQuote: (quote?: Quote) => void }
export const useQuoteStore = create<QuoteStore>((set) => ({ activeQuote: undefined, setActiveQuote: (activeQuote) => set({ activeQuote }) }))
