import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { PartyRow } from '@/types/database.types'
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

type PartyFormValues = {
  name: string
  party_type: 'debtor' | 'creditor'
  phone?: string
  address?: string
  opening_balance: number
}

interface PartyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  party?: PartyRow | null
  defaultPartyType?: 'debtor' | 'creditor'
}

export default function PartyForm({ open, onOpenChange, party, defaultPartyType }: PartyFormProps) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const partySchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('forms.nameRequired')),
        party_type: z.enum(['debtor', 'creditor']),
        phone: z.string().optional(),
        address: z.string().optional(),
        opening_balance: z.number(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      party_type: defaultPartyType ?? 'debtor',
      phone: '',
      address: '',
      opening_balance: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    if (party) {
      reset({
        name: party.name,
        party_type: party.party_type,
        phone: party.phone ?? '',
        address: party.address ?? '',
        opening_balance: party.opening_balance,
      })
    } else {
      reset({
        name: '',
        party_type: defaultPartyType ?? 'debtor',
        phone: '',
        address: '',
        opening_balance: 0,
      })
    }
  }, [open, party, defaultPartyType, reset])

  const mutation = useMutation({
    mutationFn: async (values: PartyFormValues) => {
      const payload = {
        name: values.name,
        party_type: values.party_type,
        phone: values.phone || null,
        address: values.address || null,
        opening_balance: values.opening_balance,
        is_active: true,
      }
      if (party) {
        const { error } = await supabase.from('parties').update(payload).eq('id', party.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('parties').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] })
      queryClient.invalidateQueries({ queryKey: ['v_party_balances'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{party ? t('forms.editParty') : t('forms.addParty')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t('common.name')}</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('common.type')}</Label>
              <Controller
                control={control}
                name="party_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debtor">{t('common.debtor')}</SelectItem>
                      <SelectItem value="creditor">{t('common.creditor')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opening_balance">{t('partyDetail.openingBalance')}</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                {...register('opening_balance', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">{t('common.phone')}</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">{t('forms.address')}</Label>
            <Input id="address" {...register('address')} />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {party ? t('common.saveChanges') : t('forms.addPartySubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
