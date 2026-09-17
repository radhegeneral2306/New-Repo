import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { UserRole, ProfileRow } from '@/types/database.types'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import AddUserForm from '@/components/settings/AddUserForm'
import EditUserForm from '@/components/settings/EditUserForm'

export default function SettingsUsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ProfileRow | null>(null)

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at')
      if (error) throw error
      return data
    },
  })

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('settings.usersHeading')}</h1>
          <p className="text-sm text-muted-foreground">{t('settings.usersSubtitle')}</p>
        </div>
        <Button onClick={() => setAddUserOpen(true)}>{t('settings.addUser')}</Button>
      </div>

      <AddUserForm open={addUserOpen} onOpenChange={setAddUserOpen} />
      <EditUserForm
        open={editingProfile !== null}
        onOpenChange={(open) => !open && setEditingProfile(null)}
        profile={editingProfile}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.usersCount')} ({profiles?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('settings.loading')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('settings.role')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name || '—'}</TableCell>
                    <TableCell>{profile.email || '—'}</TableCell>
                    <TableCell>
                      {profile.id === user?.id ? (
                        <Badge>{profile.role === 'super_admin' ? t('header.superAdmin') : t('header.viewer')}</Badge>
                      ) : (
                        <Select
                          value={profile.role}
                          onValueChange={(role) =>
                            updateRole.mutate({ id: profile.id, role: role as UserRole })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">{t('header.viewer')}</SelectItem>
                            <SelectItem value="super_admin">{t('header.superAdmin')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setEditingProfile(profile)}>
                        {t('common.edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
