import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'
import type { TransactionWithJoins } from '@/hooks/useTransactions'
import { useBankAccounts, useCategories, useParties } from '@/hooks/useLookups'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const NONE = '__none__'

type TransactionFormValues = {
  txn_date: string
  payment_mode: 'cash' | 'bank'
  bank_account_id?: string
  direction: 'in' | 'out'
  amount: number
  category_id?: string
  party_id?: string
  description?: string
}

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: TransactionWithJoins | null
  defaultPartyId?: string
}

export default function TransactionForm({
  open,
  onOpenChange,
  transaction,
  defaultPartyId,
}: TransactionFormProps) {
  const queryClient = useQueryClient()
  const { data: bankAccounts } = useBankAccounts()
  const { data: categories } = useCategories()
  const { data: parties } = useParties()
  const { t } = useTranslation()

  const transactionSchema = useMemo(
    () =>
      z
        .object({
          txn_date: z.string().min(1, t('forms.dateRequired')),
          payment_mode: z.enum(['cash', 'bank']),
          bank_account_id: z.string().optional(),
          direction: z.enum(['in', 'out']),
          amount: z.number().positive(t('forms.amountPositive')),
          category_id: z.string().optional(),
          party_id: z.string().optional(),
          description: z.string().optional(),
        })
        .refine((val) => val.payment_mode !== 'bank' || !!val.bank_account_id, {
          message: t('forms.bankAccountRequired'),
          path: ['bank_account_id'],
        }),
    [t],
  )

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      txn_date: format(new Date(), 'yyyy-MM-dd'),
      payment_mode: 'cash',
      direction: 'out',
      amount: 0,
      party_id: defaultPartyId ?? '',
    },
  })

  useEffect(() => {
    if (!open) return
    if (transaction) {
      reset({
        txn_date: transaction.txn_date,
        payment_mode: transaction.payment_mode,
        bank_account_id: transaction.bank_account_id ?? '',
        direction: transaction.direction,
        amount: transaction.amount,
        category_id: transaction.category_id ?? '',
        party_id: transaction.party_id ?? '',
        description: transaction.description ?? '',
      })
    } else {
      reset({
        txn_date: format(new Date(), 'yyyy-MM-dd'),
        payment_mode: 'cash',
        bank_account_id: '',
        direction: 'out',
        amount: 0,
        category_id: '',
        party_id: defaultPartyId ?? '',
        description: '',
      })
    }
  }, [open, transaction, defaultPartyId, reset])

  const paymentMode = watch('payment_mode')

  const mutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const payload = {
        txn_date: values.txn_date,
        payment_mode: values.payment_mode,
        bank_account_id: values.payment_mode === 'bank' ? values.bank_account_id || null : null,
        direction: values.direction,
        amount: values.amount,
        category_id: values.category_id || null,
        party_id: values.party_id || null,
        description: values.description || null,
      }

      if (transaction) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', transaction.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['v_dashboard_summary'] })
      queryClient.invalidateQueries({ queryKey: ['v_cash_balance'] })
      queryClient.invalidateQueries({ queryKey: ['v_bank_balances'] })
      queryClient.invalidateQueries({ queryKey: ['v_party_balances'] })
      onOpenChange(false)
    },
  })

  const onSubmit = (values: TransactionFormValues) => mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? t('forms.editTransaction') : t('forms.addTransaction')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {transaction && (
            <div className="text-xs text-muted-foreground">
              {t('forms.voucherNo')}: <span className="font-medium text-foreground">{transaction.voucher_no}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="txn_date">{t('common.date')}</Label>
              <Input id="txn_date" type="date" {...register('txn_date')} />
              {errors.txn_date && <p className="text-xs text-destructive">{errors.txn_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('forms.direction')}</Label>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">{t('forms.moneyIn')}</SelectItem>
                      <SelectItem value="out">{t('forms.moneyOut')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('ledger.paymentMode')}</Label>
              <Controller
                control={control}
                name="payment_mode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t('common.cash')}</SelectItem>
                      <SelectItem value="bank">{t('common.bank')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">{t('common.amount')}</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          {paymentMode === 'bank' && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('forms.bankAccount')}</Label>
              <Controller
                control={control}
                name="bank_account_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('forms.selectBankAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} ({account.bank_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bank_account_id && (
                <p className="text-xs text-destructive">{errors.bank_account_id.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('ledger.category')}</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.none')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.kind})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('forms.partyOptional')}</Label>
              <Controller
                control={control}
                name="party_id"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.none')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                      {parties?.map((party) => (
                        <SelectItem key={party.id} value={party.id}>
                          {party.name} ({party.party_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Input id="description" {...register('description')} />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {transaction ? t('common.saveChanges') : t('forms.addTransactionSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
