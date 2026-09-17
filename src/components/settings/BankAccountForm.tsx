import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { BankAccountRow } from '@/types/database.types'
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

const schema = z.object({
  account_name: z.string().min(1, 'Required'),
  bank_name: z.string().min(1, 'Required'),
  account_number: z.string().min(1, 'Required'),
  ifsc: z.string().optional(),
  opening_balance: z.number(),
})

type FormValues = z.infer<typeof schema>

interface BankAccountFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: BankAccountRow | null
}

export default function BankAccountForm({ open, onOpenChange, account }: BankAccountFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { account_name: '', bank_name: '', account_number: '', ifsc: '', opening_balance: 0 },
  })

  useEffect(() => {
    if (!open) return
    if (account) {
      reset({
        account_name: account.account_name,
        bank_name: account.bank_name,
        account_number: account.account_number,
        ifsc: account.ifsc ?? '',
        opening_balance: account.opening_balance,
      })
    } else {
      reset({ account_name: '', bank_name: '', account_number: '', ifsc: '', opening_balance: 0 })
    }
  }, [open, account, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, ifsc: values.ifsc || null, is_active: true }
      if (account) {
        const { error } = await supabase.from('bank_accounts').update(payload).eq('id', account.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('bank_accounts').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['v_bank_balances'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Edit bank account' : 'Add bank account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account_name">Account name</Label>
            <Input id="account_name" {...register('account_name')} />
            {errors.account_name && <p className="text-xs text-destructive">{errors.account_name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank_name">Bank name</Label>
            <Input id="bank_name" {...register('bank_name')} />
            {errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account_number">Account number</Label>
              <Input id="account_number" {...register('account_number')} />
              {errors.account_number && (
                <p className="text-xs text-destructive">{errors.account_number.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ifsc">IFSC</Label>
              <Input id="ifsc" {...register('ifsc')} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opening_balance">Opening balance</Label>
            <Input
              id="opening_balance"
              type="number"
              step="0.01"
              {...register('opening_balance', { valueAsNumber: true })}
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {account ? 'Save changes' : 'Add account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
