import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useParties, usePartyBalances } from '@/hooks/useLookups'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RequireRole from '@/components/layout/RequireRole'
import PartyForm from '@/components/parties/PartyForm'

export default function PartiesPage() {
  const [partyType, setPartyType] = useState<'debtor' | 'creditor' | undefined>(undefined)
  const [addOpen, setAddOpen] = useState(false)
  const { data: parties, isLoading } = useParties(partyType)
  const { data: balances } = usePartyBalances(partyType)
  const { t } = useTranslation()

  const balanceMap = new Map((balances ?? []).map((b) => [b.party_id, b.balance]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('parties.heading')}</h1>
          <p className="text-sm text-muted-foreground">{t('parties.subtitle')}</p>
        </div>
        <RequireRole>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('parties.addParty')}
          </Button>
        </RequireRole>
      </div>

      <Tabs
        value={partyType ?? 'all'}
        onValueChange={(v) => setPartyType(v === 'all' ? undefined : (v as 'debtor' | 'creditor'))}
      >
        <TabsList>
          <TabsTrigger value="all">{t('parties.all')}</TabsTrigger>
          <TabsTrigger value="debtor">{t('parties.debtors')}</TabsTrigger>
          <TabsTrigger value="creditor">{t('parties.creditors')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>{t('parties.partiesCount')} ({parties?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('parties.loading')}</p>
          ) : parties && parties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.type')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead className="text-right">{t('parties.balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell>
                      <Link to={`/parties/${party.id}`} className="font-medium text-primary hover:underline">
                        {party.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={party.party_type === 'debtor' ? 'secondary' : 'outline'}>
                        {party.party_type === 'debtor' ? t('common.debtor') : t('common.creditor')}
                      </Badge>
                    </TableCell>
                    <TableCell>{party.phone || '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(balanceMap.get(party.id) ?? party.opening_balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('parties.noPartiesFound')}</p>
          )}
        </CardContent>
      </Card>

      <PartyForm open={addOpen} onOpenChange={setAddOpen} defaultPartyType={partyType} />
    </div>
  )
}
