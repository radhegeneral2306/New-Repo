import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { ProfileRow } from '@/types/database.types'
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

type EditUserFormValues = {
  full_name: string
  email: string
  password: string
}

interface EditUserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ProfileRow | null
}

export default function EditUserForm({ open, onOpenChange, profile }: EditUserFormProps) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const editUserSchema = useMemo(
    () =>
      z.object({
        full_name: z.string().min(1, t('forms.nameRequired')),
        email: z.string().email(t('auth.emailInvalid')),
        password: z.union([z.string().length(0), z.string().min(8, t('forms.passwordMin8'))]),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { full_name: '', email: '', password: '' },
  })

  useEffect(() => {
    if (!open || !profile) return
    reset({ full_name: profile.full_name ?? '', email: profile.email ?? '', password: '' })
  }, [open, profile, reset])

  const mutation = useMutation({
    mutationFn: async (values: EditUserFormValues) => {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          id: profile!.id,
          full_name: values.full_name,
          email: values.email,
          password: values.password || undefined,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.editUser')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit_full_name">{t('forms.fullName')}</Label>
            <Input id="edit_full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit_email">{t('common.email')}</Label>
            <Input id="edit_email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit_password">{t('settings.resetPasswordOptional')}</Label>
            <Input id="edit_password" type="password" {...register('password')} />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('settings.resetPasswordHint')}</p>
            )}
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? t('settings.savingUser') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
