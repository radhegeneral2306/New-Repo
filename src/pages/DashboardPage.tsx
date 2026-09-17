import { Wallet, Landmark, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TransactionTable from '@/components/ledger/TransactionTable'

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary()
  const { data: recentTransactions, isLoading: txnsLoading } = useTransactions({}, 10)
  const { t } = useTranslation()

  const cards = [
    {
      label: t('dashboard.cashBalance'),
      value: summary?.cash_balance ?? 0,
      icon: Wallet,
    },
    {
      label: t('dashboard.bankBalance'),
      value: summary?.bank_balance ?? 0,
      icon: Landmark,
    },
    {
      label: t('dashboard.pendingFromDebtors'),
      value: summary?.total_debtor_balance ?? 0,
      icon: ArrowDownCircle,
    },
    {
      label: t('dashboard.payableToCreditors'),
      value: summary?.total_creditor_balance ?? 0,
      icon: ArrowUpCircle,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('dashboard.heading')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
              <CardTitle>{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {summaryLoading ? '—' : formatCurrency(card.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={recentTransactions ?? []} isLoading={txnsLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
