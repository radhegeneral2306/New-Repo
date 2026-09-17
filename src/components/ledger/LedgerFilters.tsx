import type { TransactionFilters } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useLookups'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { CategoryKind, PaymentMode } from '@/types/database.types'

const ALL = '__all__'

interface LedgerFiltersProps {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  categoryKind?: CategoryKind
}

export default function LedgerFilters({ filters, onChange, categoryKind }: LedgerFiltersProps) {
  const { data: categories } = useCategories(categoryKind)
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">{t('common.from')}</Label>
        <Input
          type="date"
          className="w-40"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">{t('common.to')}</Label>
        <Input
          type="date"
          className="w-40"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">{t('ledger.paymentMode')}</Label>
        <Select
          value={filters.paymentMode ?? ALL}
          onValueChange={(v) =>
            onChange({ ...filters, paymentMode: v === ALL ? undefined : (v as PaymentMode) })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.all')}</SelectItem>
            <SelectItem value="cash">{t('common.cash')}</SelectItem>
            <SelectItem value="bank">{t('common.bank')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">{t('ledger.category')}</Label>
        <Select
          value={filters.categoryId ?? ALL}
          onValueChange={(v) => onChange({ ...filters, categoryId: v === ALL ? undefined : v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('ledger.allCategories')}</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ categoryKind: filters.categoryKind })}>
        {t('common.clearFilters')}
      </Button>
    </div>
  )
}
