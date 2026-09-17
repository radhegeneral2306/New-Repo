import CategoryLedgerPage from '@/pages/CategoryLedgerPage'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function ExpensesPage() {
  const { t } = useTranslation()
  return <CategoryLedgerPage kind="expense" title={t('nav.expenseLedger')} />
}
