import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { MemberRow } from '@/types/database.types'
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

const memberSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  membership_type: z.string().optional(),
  membership_status: z.enum(['active', 'inactive']),
  joined_date: z.string().optional(),
  notes: z.string().optional(),
})

type MemberFormValues = z.infer<typeof memberSchema>

interface MemberFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: MemberRow | null
}

export default function MemberForm({ open, onOpenChange, member }: MemberFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      membership_type: '',
      membership_status: 'active',
      joined_date: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    if (member) {
      reset({
        full_name: member.full_name,
        phone: member.phone ?? '',
        email: member.email ?? '',
        address: member.address ?? '',
        membership_type: member.membership_type ?? '',
        membership_status: member.membership_status,
        joined_date: member.joined_date ?? '',
        notes: member.notes ?? '',
      })
    } else {
      reset({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        membership_type: '',
        membership_status: 'active',
        joined_date: '',
        notes: '',
      })
    }
  }, [open, member, reset])

  const mutation = useMutation({
    mutationFn: async (values: MemberFormValues) => {
      const payload = {
        full_name: values.full_name,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        membership_type: values.membership_type || null,
        membership_status: values.membership_status,
        joined_date: values.joined_date || null,
        notes: values.notes || null,
      }
      if (member) {
        const { error } = await supabase.from('members').update(payload).eq('id', member.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('members').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? 'Edit member' : 'Add member'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register('address')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="membership_type">Membership Type</Label>
              <Input id="membership_type" placeholder="e.g. Annual" {...register('membership_type')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="membership_status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="joined_date">Joined Date</Label>
              <Input id="joined_date" type="date" {...register('joined_date')} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register('notes')} />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {member ? 'Save changes' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
