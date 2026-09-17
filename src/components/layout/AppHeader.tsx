import { LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useProfile } from '@/hooks/useProfile'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LanguageToggle from '@/components/layout/LanguageToggle'

export default function AppHeader() {
  const { data: profile } = useProfile()
  const { t } = useTranslation()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="text-sm font-medium text-muted-foreground md:hidden">{t('nav.appName')}</div>
      <div className="ml-auto flex items-center gap-3">
        <LanguageToggle />
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{profile?.full_name || profile?.email || t('header.user')}</span>
          {profile?.role && (
            <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
              {profile.role === 'super_admin' ? t('header.superAdmin') : t('header.viewer')}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" title={t('common.signOut')} onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
