import CategoryLedgerPage from '@/pages/CategoryLedgerPage'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function IncomePage() {
  const { t } = useTranslation()
  return <CategoryLedgerPage kind="income" title={t('nav.incomeLedger')} />
}
