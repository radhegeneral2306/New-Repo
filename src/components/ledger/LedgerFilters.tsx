import type { TransactionFilters } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useLookups'
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

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          className="w-40"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          className="w-40"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Payment Mode</Label>
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
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Category</Label>
        <Select
          value={filters.categoryId ?? ALL}
          onValueChange={(v) => onChange({ ...filters, categoryId: v === ALL ? undefined : v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ categoryKind: filters.categoryKind })}>
        Clear filters
      </Button>
    </div>
  )
}
