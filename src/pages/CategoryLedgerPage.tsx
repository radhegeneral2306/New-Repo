import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import type { TransactionFilters } from '@/hooks/useTransactions'
import type { CategoryKind } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import LedgerFilters from '@/components/ledger/LedgerFilters'
import TransactionTable from '@/components/ledger/TransactionTable'
import TransactionForm from '@/components/ledger/TransactionForm'
import CategoryBreakdown from '@/components/ledger/CategoryBreakdown'
import RequireRole from '@/components/layout/RequireRole'

export default function CategoryLedgerPage({ kind, title }: { kind: CategoryKind; title: string }) {
  const [filters, setFilters] = useState<TransactionFilters>({ categoryKind: kind })
  const [addOpen, setAddOpen] = useState(false)
  const { data: transactions, isLoading } = useTransactions(filters)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Transactions categorized as {kind === 'expense' ? 'expenses' : 'income'}
          </p>
        </div>
        <RequireRole>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </RequireRole>
      </div>

      <LedgerFilters filters={filters} onChange={setFilters} categoryKind={kind} />

      <CategoryBreakdown transactions={transactions ?? []} />

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={transactions ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>

      <TransactionForm open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
