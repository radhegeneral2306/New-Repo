import { useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { exportToPdf } from '@/lib/exportPdf'
import { exportToExcel } from '@/lib/exportExcel'
import { useTranslation } from '@/lib/i18n/LanguageContext'
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

function txnRows(transactions: TransactionWithJoins[], t: (key: string) => string) {
  return transactions.map((t2) => [
    t2.voucher_no,
    t2.txn_date,
    t2.payment_mode === 'bank' ? `${t('common.bank')} (${t2.bank_account?.account_name ?? ''})` : t('common.cash'),
    t2.direction === 'in' ? t('reports.directionIn') : t('reports.directionOut'),
    t2.category?.name ?? '—',
    t2.party?.name ?? '—',
    t2.description ?? '',
    (t2.direction === 'in' ? t2.amount : -t2.amount).toFixed(2),
  ])
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const { t } = useTranslation()

  const txnHead = [
    t('reports.colVoucher'),
    t('reports.colDate'),
    t('reports.colMode'),
    t('reports.colDirection'),
    t('reports.colCategory'),
    t('reports.colParty'),
    t('reports.colDescription'),
    t('reports.colAmount'),
  ]

  const dateRangeLabel = `${t('reports.period')}: ${dateFrom || t('reports.beginning')} to ${dateTo || t('reports.today')}`

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoadingKey(key)
    try {
      await fn()
    } finally {
      setLoadingKey(null)
    }
  }

  const exportLedger = (format: 'pdf' | 'excel', kind?: CategoryKind, title = t('reports.fullLedger')) =>
    withLoading(`${title}-${format}`, async () => {
      const transactions = await fetchTransactions(dateFrom, dateTo, kind)
      const rows = txnRows(transactions, t)
      const total = transactions.reduce(
        (sum, txn) => sum + (txn.direction === 'in' ? txn.amount : -txn.amount),
        0,
      )
      const totalsRow = ['', '', '', '', '', '', t('reports.total'), total.toFixed(2)]
      const fileNameBase = title.toLowerCase().replace(/\s+/g, '-')

      if (format === 'pdf') {
        exportToPdf({
          title,
          dateRangeLabel,
          head: txnHead,
          rows,
          totalsRow,
          fileName: `${fileNameBase}.pdf`,
        })
      } else {
        await exportToExcel({
          title,
          dateRangeLabel,
          head: txnHead,
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
      const totalsRow = ['', t('reports.total'), total.toFixed(2)]
      const title = t('reports.debtorCreditorList')

      if (format === 'pdf') {
        exportToPdf({
          title,
          dateRangeLabel: `${t('reports.asOf')} ${new Date().toLocaleDateString()}`,
          head: [t('reports.colName'), t('reports.colType'), t('reports.colBalance')],
          rows,
          totalsRow,
          fileName: 'debtor-creditor-list.pdf',
        })
      } else {
        await exportToExcel({
          title,
          dateRangeLabel: `${t('reports.asOf')} ${new Date().toLocaleDateString()}`,
          head: [t('reports.colName'), t('reports.colType'), t('reports.colBalance')],
          rows,
          totalsRow,
          fileName: 'debtor-creditor-list.xlsx',
        })
      }
    })

  const reportCards = [
    {
      key: 'ledger',
      title: t('reports.fullLedger'),
      description: t('reports.fullLedgerDescription'),
      onPdf: () => exportLedger('pdf', undefined, t('reports.fullLedger')),
      onExcel: () => exportLedger('excel', undefined, t('reports.fullLedger')),
    },
    {
      key: 'expenses',
      title: t('nav.expenseLedger'),
      description: t('reports.expenseLedgerDescription'),
      onPdf: () => exportLedger('pdf', 'expense', t('nav.expenseLedger')),
      onExcel: () => exportLedger('excel', 'expense', t('nav.expenseLedger')),
    },
    {
      key: 'income',
      title: t('nav.incomeLedger'),
      description: t('reports.incomeLedgerDescription'),
      onPdf: () => exportLedger('pdf', 'income', t('nav.incomeLedger')),
      onExcel: () => exportLedger('excel', 'income', t('nav.incomeLedger')),
    },
    {
      key: 'parties',
      title: t('reports.debtorCreditorList'),
      description: t('reports.debtorCreditorListDescription'),
      onPdf: () => exportParties('pdf'),
      onExcel: () => exportParties('excel'),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('reports.heading')}</h1>
        <p className="text-sm text-muted-foreground">{t('reports.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t('reports.fromLedger')}</Label>
          <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t('reports.toLedger')}</Label>
          <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <p className="pb-2 text-xs text-muted-foreground">{t('reports.partyNote')}</p>
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
                {t('common.pdf')}
              </Button>
              <Button
                variant="outline"
                onClick={card.onExcel}
                disabled={loadingKey === `${card.title}-excel` || loadingKey === 'parties-excel'}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {t('common.excel')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
