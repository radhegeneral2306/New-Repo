import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useMembers } from '@/hooks/useMembers'
import type { MemberRow, MembershipStatus } from '@/types/database.types'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import RequireRole from '@/components/layout/RequireRole'
import MemberForm from '@/components/members/MemberForm'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const ALL = '__all__'

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MembershipStatus | undefined>(undefined)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<MemberRow | null>(null)
  const [deleting, setDeleting] = useState<MemberRow | null>(null)
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const { data: members, isLoading } = useMembers({ search: search || undefined, status })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setDeleting(null)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('members.heading')}</h1>
          <p className="text-sm text-muted-foreground">{t('members.subtitle')}</p>
        </div>
        <RequireRole>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('members.addMember')}
          </Button>
        </RequireRole>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('members.searchPlaceholder')}
            className="w-56 pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={status ?? ALL}
          onValueChange={(v) => setStatus(v === ALL ? undefined : (v as MembershipStatus))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('members.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('common.active')}</SelectItem>
            <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('members.membersCount')} ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('members.loading')}</p>
          ) : members && members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('common.type')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('members.joined')}</TableHead>
                  <RequireRole>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </RequireRole>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>{member.phone || '—'}</TableCell>
                    <TableCell>{member.membership_type || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={member.membership_status === 'active' ? 'success' : 'secondary'}>
                        {member.membership_status === 'active' ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.joined_date || '—'}</TableCell>
                    <RequireRole>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditing(member)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(member)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </RequireRole>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('members.noMembersFound')}</p>
          )}
        </CardContent>
      </Card>

      <MemberForm open={addOpen} onOpenChange={setAddOpen} />
      {editing && (
        <MemberForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} member={editing} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('members.deleteMemberTitle')}
        description={`${deleting?.full_name} ${t('members.deleteMemberDescription')}`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
