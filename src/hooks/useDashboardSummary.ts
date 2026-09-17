import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { VDashboardSummaryRow } from '@/types/database.types'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['v_dashboard_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_dashboard_summary').select('*').single()
      if (error) throw error
      return data as VDashboardSummaryRow
    },
  })
}
