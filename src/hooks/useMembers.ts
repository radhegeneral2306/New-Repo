import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { MemberRow, MembershipStatus } from '@/types/database.types'

export interface MemberFilters {
  search?: string
  status?: MembershipStatus
  membershipType?: string
}

export function useMembers(filters: MemberFilters = {}) {
  return useQuery({
    queryKey: ['members', filters],
    queryFn: async () => {
      let query = supabase.from('members').select('*').order('full_name')
      if (filters.status) query = query.eq('membership_status', filters.status)
      if (filters.membershipType) query = query.eq('membership_type', filters.membershipType)
      if (filters.search) query = query.ilike('full_name', `%${filters.search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as MemberRow[]
    },
  })
}
