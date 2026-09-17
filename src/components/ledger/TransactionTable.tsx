import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { TransactionWithJoins } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import RequireRole from '@/components/layout/RequireRole'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import TransactionForm from '@/components/ledger/TransactionForm'

interface TransactionTableProps {
  transactions: TransactionWithJoins[]
  isLoading?: boolean
  showParty?: boolean
}

export default function TransactionTable({
  transactions,
  isLoading,
  showParty = true,
}: TransactionTableProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<TransactionWithJoins | null>(null)
  const [deleting, setDeleting] = useState<TransactionWithJoins | null>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['v_dashboard_summary'] })
      queryClient.invalidateQueries({ queryKey: ['v_cash_balance'] })
      queryClient.invalidateQueries({ queryKey: ['v_bank_balances'] })
      queryClient.invalidateQueries({ queryKey: ['v_party_balances'] })
      setDeleting(null)
    },
  })

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading transactions…</p>
  }

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No transactions found.</p>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Voucher</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Category</TableHead>
            {showParty && <TableHead>Party</TableHead>}
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <RequireRole>
              <TableHead className="text-right">Actions</TableHead>
            </RequireRole>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="font-mono text-xs">{txn.voucher_no}</TableCell>
              <TableCell>{txn.txn_date}</TableCell>
              <TableCell className="capitalize">
                {txn.payment_mode === 'bank' && txn.bank_account?.account_name
                  ? `Bank · ${txn.bank_account.account_name}`
                  : 'Cash'}
              </TableCell>
              <TableCell>{txn.category?.name ?? '—'}</TableCell>
              {showParty && <TableCell>{txn.party?.name ?? '—'}</TableCell>}
              <TableCell className="max-w-[220px] truncate text-muted-foreground">
                {txn.description || '—'}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={txn.direction === 'in' ? 'success' : 'destructive'}>
                  {txn.direction === 'in' ? '+' : '-'}
                  {formatCurrency(txn.amount)}
                </Badge>
              </TableCell>
              <RequireRole>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(txn)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(txn)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </RequireRole>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <TransactionForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} transaction={editing} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this transaction?"
        description={`Voucher ${deleting?.voucher_no} will be permanently removed. This cannot be undone.`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
