import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { BankAccountRow, CategoryRow, PartyRow, VPartyBalanceRow } from '@/types/database.types'

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('account_name')
      if (error) throw error
      return data as BankAccountRow[]
    },
  })
}

export function useCategories(kind?: 'expense' | 'income') {
  return useQuery({
    queryKey: ['categories', kind ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('categories').select('*').order('name')
      if (kind) query = query.eq('kind', kind)
      const { data, error } = await query
      if (error) throw error
      return data as CategoryRow[]
    },
  })
}

export function useParties(partyType?: 'debtor' | 'creditor') {
  return useQuery({
    queryKey: ['parties', partyType ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('parties').select('*').order('name')
      if (partyType) query = query.eq('party_type', partyType)
      const { data, error } = await query
      if (error) throw error
      return data as PartyRow[]
    },
  })
}

export function usePartyBalances(partyType?: 'debtor' | 'creditor') {
  return useQuery({
    queryKey: ['v_party_balances', partyType ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('v_party_balances').select('*')
      if (partyType) query = query.eq('party_type', partyType)
      const { data, error } = await query
      if (error) throw error
      return data as VPartyBalanceRow[]
    },
  })
}
