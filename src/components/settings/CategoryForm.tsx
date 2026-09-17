import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { CategoryRow } from '@/types/database.types'
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

type FormValues = {
  name: string
  kind: 'expense' | 'income'
}

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CategoryRow | null
}

export default function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('forms.required')),
        kind: z.enum(['expense', 'income']),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', kind: 'expense' },
  })

  useEffect(() => {
    if (!open) return
    if (category) {
      reset({ name: category.name, kind: category.kind })
    } else {
      reset({ name: '', kind: 'expense' })
    }
  }, [open, category, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, is_active: true }
      if (category) {
        const { error } = await supabase.from('categories').update(payload).eq('id', category.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t('forms.editCategory') : t('forms.addCategory')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t('common.name')}</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('settings.kind')}</Label>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t('common.expense')}</SelectItem>
                    <SelectItem value="income">{t('common.income')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {category ? t('common.saveChanges') : t('forms.addCategorySubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
