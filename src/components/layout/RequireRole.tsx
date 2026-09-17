import type { ReactNode } from 'react'
import { useIsSuperAdmin } from '@/hooks/useProfile'

export default function RequireRole({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const isSuperAdmin = useIsSuperAdmin()
  if (!isSuperAdmin) return <>{fallback}</>
  return <>{children}</>
}
