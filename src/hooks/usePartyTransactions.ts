import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { PartyRow, PartyTransactionRow } from '@/types/database.types'

export function useParty(partyId: string | undefined) {
  return useQuery({
    queryKey: ['party', partyId],
    queryFn: async () => {
      if (!partyId) return null
      const { data, error } = await supabase.from('parties').select('*').eq('id', partyId).single()
      if (error) throw error
      return data as PartyRow
    },
    enabled: !!partyId,
  })
}

export function usePartyTransactions(partyId: string | undefined) {
  return useQuery({
    queryKey: ['party_transactions', partyId],
    queryFn: async () => {
      if (!partyId) return []
      const { data, error } = await supabase
        .from('party_transactions')
        .select('*')
        .eq('party_id', partyId)
        .order('txn_date', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as PartyTransactionRow[]
    },
    enabled: !!partyId,
  })
}
