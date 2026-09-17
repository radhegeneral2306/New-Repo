import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useBankAccounts, useCategories } from '@/hooks/useLookups'
import type { BankAccountRow, CategoryRow } from '@/types/database.types'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import RequireRole from '@/components/layout/RequireRole'
import BankAccountForm from '@/components/settings/BankAccountForm'
import CategoryForm from '@/components/settings/CategoryForm'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function SettingsAccountsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('settings.accountsCategoriesHeading')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings.accountsCategoriesSubtitle')}</p>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">{t('settings.bankAccountsTab')}</TabsTrigger>
          <TabsTrigger value="categories">{t('settings.categoriesTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <BankAccountsPanel />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BankAccountsPanel() {
  const { data: accounts, isLoading } = useBankAccounts()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccountRow | null>(null)
  const [deleting, setDeleting] = useState<BankAccountRow | null>(null)
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] })
      setDeleting(null)
    },
  })

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t('settings.bankAccountsCount')} ({accounts?.length ?? 0})</CardTitle>
        <RequireRole>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </Button>
        </RequireRole>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('settings.loading')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.account')}</TableHead>
                <TableHead>{t('settings.bankName')}</TableHead>
                <TableHead>{t('settings.number')}</TableHead>
                <TableHead>{t('settings.ifsc')}</TableHead>
                <TableHead className="text-right">{t('settings.openingBalance')}</TableHead>
                <RequireRole>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </RequireRole>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts?.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.account_name}</TableCell>
                  <TableCell>{account.bank_name}</TableCell>
                  <TableCell>{account.account_number}</TableCell>
                  <TableCell>{account.ifsc || '—'}</TableCell>
                  <TableCell className="text-right">{account.opening_balance}</TableCell>
                  <RequireRole>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(account)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(account)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </RequireRole>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <BankAccountForm open={addOpen} onOpenChange={setAddOpen} />
      {editing && (
        <BankAccountForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} account={editing} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('settings.deleteBankAccountTitle')}
        description={`${deleting?.account_name} ${t('settings.deleteBankAccountDescription')}`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}

function CategoriesPanel() {
  const { data: categories, isLoading } = useCategories()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [deleting, setDeleting] = useState<CategoryRow | null>(null)
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleting(null)
    },
  })

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t('settings.categoriesCount')} ({categories?.length ?? 0})</CardTitle>
        <RequireRole>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </Button>
        </RequireRole>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('settings.loading')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('settings.kind')}</TableHead>
                <RequireRole>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </RequireRole>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant={category.kind === 'income' ? 'success' : 'secondary'}>
                      {category.kind === 'income' ? t('common.income') : t('common.expense')}
                    </Badge>
                  </TableCell>
                  <RequireRole>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(category)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </RequireRole>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CategoryForm open={addOpen} onOpenChange={setAddOpen} />
      {editing && (
        <CategoryForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} category={editing} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('settings.deleteCategoryTitle')}
        description={`${deleting?.name} ${t('settings.deleteCategoryDescription')}`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}
