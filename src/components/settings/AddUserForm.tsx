import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
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

type AddUserFormValues = {
  full_name: string
  email: string
  password: string
  role: 'viewer' | 'super_admin'
}

interface AddUserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddUserForm({ open, onOpenChange }: AddUserFormProps) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const addUserSchema = useMemo(
    () =>
      z.object({
        full_name: z.string().min(1, t('forms.nameRequired')),
        email: z.string().email(t('auth.emailInvalid')),
        password: z.string().min(8, t('forms.passwordMin8')),
        role: z.enum(['viewer', 'super_admin']),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { full_name: '', email: '', password: '', role: 'viewer' },
  })

  const mutation = useMutation({
    mutationFn: async (values: AddUserFormValues) => {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: values,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      reset({ full_name: '', email: '', password: '', role: 'viewer' })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.addUser')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">{t('forms.fullName')}</Label>
            <Input id="full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('settings.newUserPasswordHint')}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('settings.role')}</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">{t('header.viewer')}</SelectItem>
                    <SelectItem value="super_admin">{t('header.superAdmin')}</SelectItem>
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
              {mutation.isPending ? t('settings.creatingUser') : t('settings.addUserSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
