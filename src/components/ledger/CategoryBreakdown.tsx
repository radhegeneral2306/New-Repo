import { useMemo } from 'react'
import type { TransactionWithJoins } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CategoryBreakdown({ transactions }: { transactions: TransactionWithJoins[] }) {
  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const txn of transactions) {
      const key = txn.category?.name ?? 'Uncategorized'
      map.set(key, (map.get(key) ?? 0) + txn.amount)
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }, [transactions])

  const grandTotal = totals.reduce((sum, row) => sum + row.total, 0)

  if (totals.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category-wise totals</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {totals.map((row) => (
          <div key={row.name} className="flex items-center gap-3">
            <div className="w-40 shrink-0 truncate text-sm">{row.name}</div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: grandTotal ? `${(row.total / grandTotal) * 100}%` : '0%' }}
              />
            </div>
            <div className="w-28 shrink-0 text-right text-sm font-medium">{formatCurrency(row.total)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
