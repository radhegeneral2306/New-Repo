import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import type { ProfileRow } from '@/types/database.types'

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data as ProfileRow
    },
    enabled: !!user,
  })
}

export function useIsSuperAdmin() {
  const { data: profile } = useProfile()
  return profile?.role === 'super_admin'
}
