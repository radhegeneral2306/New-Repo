import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { en, hi } from '@/lib/i18n/translations'

export type Language = 'en' | 'hi'

const STORAGE_KEY = 'sahu-samaj-bhawan-language'

const dictionaries: Record<Language, unknown> = { en, hi }

function lookup(dict: unknown, key: string): string | undefined {
  let current: unknown = dict
  for (const part of key.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'hi') return stored
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — fall back to default
  }
  return 'en'
}

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage())

  const setLanguage = (next: Language) => {
    setLanguageState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }

  const t = useMemo(() => {
    return (key: string) => {
      const value = lookup(dictionaries[language], key)
      if (value !== undefined) return value
      const fallback = lookup(dictionaries.en, key)
      return fallback !== undefined ? fallback : key
    }
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
