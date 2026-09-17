import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
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

const entrySchema = z.object({
  txn_date: z.string().min(1, 'Date is required'),
  entry_type: z.enum(['debit', 'credit']),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
})

type EntryFormValues = z.infer<typeof entrySchema>

interface PartyEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partyId: string
}

export default function PartyEntryForm({ open, onOpenChange, partyId }: PartyEntryFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      txn_date: format(new Date(), 'yyyy-MM-dd'),
      entry_type: 'debit',
      amount: 0,
      description: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: EntryFormValues) => {
      const { error } = await supabase.from('party_transactions').insert({
        party_id: partyId,
        txn_date: values.txn_date,
        entry_type: values.entry_type,
        amount: values.amount,
        description: values.description || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party_transactions', partyId] })
      queryClient.invalidateQueries({ queryKey: ['v_party_balances'] })
      reset({ txn_date: format(new Date(), 'yyyy-MM-dd'), entry_type: 'debit', amount: 0, description: '' })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add ledger entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="txn_date">Date</Label>
              <Input id="txn_date" type="date" {...register('txn_date')} />
              {errors.txn_date && <p className="text-xs text-destructive">{errors.txn_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Entry Type</Label>
              <Controller
                control={control}
                name="entry_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit (owed to us)</SelectItem>
                      <SelectItem value="credit">Credit (paid / settled)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              Add entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
