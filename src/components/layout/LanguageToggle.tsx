import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useTranslation()

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-background p-0.5 text-xs font-medium',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          'rounded-sm px-2 py-1 transition-colors',
          language === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={cn(
          'rounded-sm px-2 py-1 transition-colors',
          language === 'hi'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        हिं
      </button>
    </div>
  )
}
