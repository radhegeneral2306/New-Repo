import { useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { exportToPdf } from '@/lib/exportPdf'
import { exportToExcel } from '@/lib/exportExcel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TransactionWithJoins } from '@/hooks/useTransactions'
import type { CategoryKind } from '@/types/database.types'

const SELECT_WITH_JOINS =
  '*, category:categories(id,name,kind), bank_account:bank_accounts(id,account_name), party:parties(id,name)'

async function fetchTransactions(dateFrom: string, dateTo: string, kind?: CategoryKind) {
  let query = supabase
    .from('transactions')
    .select(SELECT_WITH_JOINS)
    .order('txn_date', { ascending: true })

  if (dateFrom) query = query.gte('txn_date', dateFrom)
  if (dateTo) query = query.lte('txn_date', dateTo)

  const { data, error } = await query
  if (error) throw error

  let rows = (data ?? []) as unknown as TransactionWithJoins[]
  if (kind) rows = rows.filter((row) => row.category?.kind === kind)
  return rows
}

function txnRows(transactions: TransactionWithJoins[]) {
  return transactions.map((t) => [
    t.voucher_no,
    t.txn_date,
    t.payment_mode === 'bank' ? `Bank (${t.bank_account?.account_name ?? ''})` : 'Cash',
    t.direction === 'in' ? 'In' : 'Out',
    t.category?.name ?? '—',
    t.party?.name ?? '—',
    t.description ?? '',
    (t.direction === 'in' ? t.amount : -t.amount).toFixed(2),
  ])
}

const TXN_HEAD = ['Voucher', 'Date', 'Mode', 'Direction', 'Category', 'Party', 'Description', 'Amount']

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const dateRangeLabel = `Period: ${dateFrom || 'Beginning'} to ${dateTo || 'Today'}`

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoadingKey(key)
    try {
      await fn()
    } finally {
      setLoadingKey(null)
    }
  }

  const exportLedger = (format: 'pdf' | 'excel', kind?: CategoryKind, title = 'Full Ledger') =>
    withLoading(`${title}-${format}`, async () => {
      const transactions = await fetchTransactions(dateFrom, dateTo, kind)
      const rows = txnRows(transactions)
      const total = transactions.reduce(
        (sum, t) => sum + (t.direction === 'in' ? t.amount : -t.amount),
        0,
      )
      const totalsRow = ['', '', '', '', '', '', 'Total', total.toFixed(2)]
      const fileNameBase = title.toLowerCase().replace(/\s+/g, '-')

      if (format === 'pdf') {
        exportToPdf({
          title,
          dateRangeLabel,
          head: TXN_HEAD,
          rows,
          totalsRow,
          fileName: `${fileNameBase}.pdf`,
        })
      } else {
        await exportToExcel({
          title,
          dateRangeLabel,
          head: TXN_HEAD,
          rows,
          totalsRow,
          fileName: `${fileNameBase}.xlsx`,
        })
      }
    })

  const exportParties = (format: 'pdf' | 'excel') =>
    withLoading(`parties-${format}`, async () => {
      const { data: balances, error } = await supabase.from('v_party_balances').select('*')
      if (error) throw error

      const rows = (balances ?? []).map((b) => [b.name, b.party_type, b.balance.toFixed(2)])
      const total = (balances ?? []).reduce((sum, b) => sum + b.balance, 0)
      const totalsRow = ['', 'Total', total.toFixed(2)]
      const title = 'Debtor / Creditor List'

      if (format === 'pdf') {
        exportToPdf({
          title,
          dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
          head: ['Name', 'Type', 'Balance'],
          rows,
          totalsRow,
          fileName: 'debtor-creditor-list.pdf',
        })
      } else {
        await exportToExcel({
          title,
          dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
          head: ['Name', 'Type', 'Balance'],
          rows,
          totalsRow,
          fileName: 'debtor-creditor-list.xlsx',
        })
      }
    })

  const reportCards = [
    {
      key: 'ledger',
      title: 'Full Ledger',
      description: 'Every cash & bank transaction in the selected period',
      onPdf: () => exportLedger('pdf', undefined, 'Full Ledger'),
      onExcel: () => exportLedger('excel', undefined, 'Full Ledger'),
    },
    {
      key: 'expenses',
      title: 'Expense Ledger',
      description: 'Transactions categorized as expenses',
      onPdf: () => exportLedger('pdf', 'expense', 'Expense Ledger'),
      onExcel: () => exportLedger('excel', 'expense', 'Expense Ledger'),
    },
    {
      key: 'income',
      title: 'Income Ledger',
      description: 'Transactions categorized as income',
      onPdf: () => exportLedger('pdf', 'income', 'Income Ledger'),
      onExcel: () => exportLedger('excel', 'income', 'Income Ledger'),
    },
    {
      key: 'parties',
      title: 'Debtor / Creditor List',
      description: 'Current outstanding balances for all parties',
      onPdf: () => exportParties('pdf'),
      onExcel: () => exportParties('excel'),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Export statements as PDF or Excel</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">From (ledger reports)</Label>
          <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">To (ledger reports)</Label>
          <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <p className="pb-2 text-xs text-muted-foreground">
          The debtor/creditor list always reflects current balances, regardless of date range.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reportCards.map((card) => (
          <Card key={card.key}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                onClick={card.onPdf}
                disabled={loadingKey === `${card.title}-pdf` || loadingKey === 'parties-pdf'}
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={card.onExcel}
                disabled={loadingKey === `${card.title}-excel` || loadingKey === 'parties-excel'}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
