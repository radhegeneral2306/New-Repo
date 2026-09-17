export type UserRole = 'super_admin' | 'viewer'
export type PaymentMode = 'cash' | 'bank'
export type TxnDirection = 'in' | 'out'
export type CategoryKind = 'expense' | 'income'
export type PartyType = 'debtor' | 'creditor'
export type PartyEntryType = 'debit' | 'credit'
export type MembershipStatus = 'active' | 'inactive'

export interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at: string
}
export type ProfileUpdate = Partial<Pick<ProfileRow, 'full_name' | 'role'>>

export interface BankAccountRow {
  id: string
  account_name: string
  bank_name: string
  account_number: string
  ifsc: string | null
  opening_balance: number
  is_active: boolean
  created_at: string
}
export type BankAccountInsert = Omit<BankAccountRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type BankAccountUpdate = Partial<BankAccountInsert>

export interface CategoryRow {
  id: string
  name: string
  kind: CategoryKind
  is_active: boolean
  created_at: string
}
export type CategoryInsert = Omit<CategoryRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type CategoryUpdate = Partial<CategoryInsert>

export interface PartyRow {
  id: string
  name: string
  party_type: PartyType
  phone: string | null
  address: string | null
  opening_balance: number
  is_active: boolean
  created_at: string
}
export type PartyInsert = Omit<PartyRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type PartyUpdate = Partial<PartyInsert>

export interface AppConfigRow {
  id: true
  cash_opening_balance: number
}
export type AppConfigUpdate = Partial<Pick<AppConfigRow, 'cash_opening_balance'>>

export interface TransactionRow {
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
}
export type TransactionInsert = Omit<
  TransactionRow,
  'id' | 'voucher_no' | 'created_at' | 'updated_at'
> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type TransactionUpdate = Partial<TransactionInsert>

export interface PartyTransactionRow {
  id: string
  party_id: string
  txn_date: string
  entry_type: PartyEntryType
  amount: number
  description: string | null
  linked_transaction_id: string | null
  created_by: string | null
  created_at: string
}
export type PartyTransactionInsert = Omit<PartyTransactionRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type PartyTransactionUpdate = Partial<PartyTransactionInsert>

export interface MemberRow {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  address: string | null
  membership_type: string | null
  membership_status: MembershipStatus
  joined_date: string | null
  notes: string | null
  created_at: string
}
export type MemberInsert = Omit<MemberRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type MemberUpdate = Partial<MemberInsert>

export interface VCashBalanceRow {
  balance: number
}
export interface VBankBalanceRow {
  bank_account_id: string
  account_name: string
  balance: number
}
export interface VPartyBalanceRow {
  party_id: string
  name: string
  party_type: PartyType
  balance: number
}
export interface VDashboardSummaryRow {
  cash_balance: number
  bank_balance: number
  total_debtor_balance: number
  total_creditor_balance: number
}

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & { id: string }
        Update: ProfileUpdate
        Relationships: Relationship[]
      }
      bank_accounts: {
        Row: BankAccountRow
        Insert: BankAccountInsert
        Update: BankAccountUpdate
        Relationships: Relationship[]
      }
      categories: {
        Row: CategoryRow
        Insert: CategoryInsert
        Update: CategoryUpdate
        Relationships: Relationship[]
      }
      parties: {
        Row: PartyRow
        Insert: PartyInsert
        Update: PartyUpdate
        Relationships: Relationship[]
      }
      app_config: {
        Row: AppConfigRow
        Insert: AppConfigRow
        Update: AppConfigUpdate
        Relationships: Relationship[]
      }
      transactions: {
        Row: TransactionRow
        Insert: TransactionInsert
        Update: TransactionUpdate
        Relationships: [
          {
            foreignKeyName: 'transactions_bank_account_id_fkey'
            columns: ['bank_account_id']
            isOneToOne: false
            referencedRelation: 'bank_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_party_id_fkey'
            columns: ['party_id']
            isOneToOne: false
            referencedRelation: 'parties'
            referencedColumns: ['id']
          },
        ]
      }
      party_transactions: {
        Row: PartyTransactionRow
        Insert: PartyTransactionInsert
        Update: PartyTransactionUpdate
        Relationships: [
          {
            foreignKeyName: 'party_transactions_party_id_fkey'
            columns: ['party_id']
            isOneToOne: false
            referencedRelation: 'parties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'party_transactions_linked_transaction_id_fkey'
            columns: ['linked_transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      members: {
        Row: MemberRow
        Insert: MemberInsert
        Update: MemberUpdate
        Relationships: Relationship[]
      }
    }
    Views: {
      v_cash_balance: { Row: VCashBalanceRow; Relationships: Relationship[] }
      v_bank_balances: { Row: VBankBalanceRow; Relationships: Relationship[] }
      v_party_balances: { Row: VPartyBalanceRow; Relationships: Relationship[] }
      v_dashboard_summary: { Row: VDashboardSummaryRow; Relationships: Relationship[] }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
