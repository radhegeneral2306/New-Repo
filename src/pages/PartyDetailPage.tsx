import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Wallet } from 'lucide-react'
import { useParty, usePartyTransactions } from '@/hooks/usePartyTransactions'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import RequireRole from '@/components/layout/RequireRole'
import PartyForm from '@/components/parties/PartyForm'
import PartyEntryForm from '@/components/parties/PartyEntryForm'
import TransactionForm from '@/components/ledger/TransactionForm'

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: party } = useParty(id)
  const { data: entries, isLoading } = usePartyTransactions(id)
  const [editOpen, setEditOpen] = useState(false)
  const [entryOpen, setEntryOpen] = useState(false)
  const [settleOpen, setSettleOpen] = useState(false)
  const { t } = useTranslation()

  const rows = useMemo(() => {
    let running = party?.opening_balance ?? 0
    return (entries ?? []).map((entry) => {
      running += entry.entry_type === 'debit' ? entry.amount : -entry.amount
      return { ...entry, running }
    })
  }, [entries, party?.opening_balance])

  const currentBalance = rows.length > 0 ? rows[rows.length - 1].running : party?.opening_balance ?? 0

  if (!party) {
    return <p className="text-sm text-muted-foreground">{t('partyDetail.loadingParty')}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/parties" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('partyDetail.backToParties')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{party.name}</h1>
            <Badge variant={party.party_type === 'debtor' ? 'secondary' : 'outline'}>
              {party.party_type === 'debtor' ? t('common.debtor') : t('common.creditor')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {party.phone || t('partyDetail.noPhone')} · {party.address || t('partyDetail.noAddress')}
          </p>
        </div>
        <RequireRole>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              {t('common.edit')}
            </Button>
            <Button variant="outline" onClick={() => setEntryOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('partyDetail.addEntry')}
            </Button>
            <Button onClick={() => setSettleOpen(true)}>
              <Wallet className="h-4 w-4" />
              {t('partyDetail.settleViaCashBank')}
            </Button>
          </div>
        </RequireRole>
      </div>

      <Card className="w-fit">
        <CardHeader>
          <CardTitle>{t('partyDetail.currentBalance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{formatCurrency(currentBalance)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('partyDetail.ledgerHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('partyDetail.loading')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.type')}</TableHead>
                  <TableHead>{t('common.description')}</TableHead>
                  <TableHead className="text-right">{t('common.amount')}</TableHead>
                  <TableHead className="text-right">{t('partyDetail.runningBalance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    {t('partyDetail.openingBalance')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(party.opening_balance)}
                  </TableCell>
                </TableRow>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.txn_date}</TableCell>
                    <TableCell className="capitalize">
                      {row.entry_type === 'debit' ? t('common.debit') : t('common.credit')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      {row.entry_type === 'debit' ? '+' : '-'}
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.running)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PartyForm open={editOpen} onOpenChange={setEditOpen} party={party} />
      {id && <PartyEntryForm open={entryOpen} onOpenChange={setEntryOpen} partyId={id} />}
      {id && (
        <TransactionForm open={settleOpen} onOpenChange={setSettleOpen} defaultPartyId={id} />
      )}
    </div>
  )
}
