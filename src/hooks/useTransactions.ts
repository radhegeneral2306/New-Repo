import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { CategoryKind, PaymentMode, TxnDirection } from '@/types/database.types'

export interface TransactionWithJoins {
  id: string
  voucher_no: string
  txn_date: string
  payment_mode: PaymentMode
  bank_account_id: string | null
  direction: TxnDirection
  amount: number
  category_id: string | null
  party_id: string | null
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  category: { id: string; name: string; kind: CategoryKind } | null
  bank_account: { id: string; account_name: string } | null
  party: { id: string; name: string } | null
}

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  paymentMode?: PaymentMode
  categoryId?: string
  categoryKind?: CategoryKind
  partyId?: string
}

const SELECT_WITH_JOINS =
  '*, category:categories(id,name,kind), bank_account:bank_accounts(id,account_name), party:parties(id,name)'

export function useTransactions(filters: TransactionFilters = {}, limit?: number) {
  return useQuery({
    queryKey: ['transactions', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(SELECT_WITH_JOINS)
        .order('txn_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.dateFrom) query = query.gte('txn_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('txn_date', filters.dateTo)
      if (filters.paymentMode) query = query.eq('payment_mode', filters.paymentMode)
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters.partyId) query = query.eq('party_id', filters.partyId)
      if (limit) query = query.limit(limit)

      const { data, error } = await query
      if (error) throw error

      let rows = (data ?? []) as unknown as TransactionWithJoins[]
      if (filters.categoryKind) {
        rows = rows.filter((row) => row.category?.kind === filters.categoryKind)
      }
      return rows
    },
  })
}
