import type { ReactNode } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import RequireRole from '@/components/layout/RequireRole'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import LedgerPage from '@/pages/LedgerPage'
import ExpensesPage from '@/pages/ExpensesPage'
import IncomePage from '@/pages/IncomePage'
import PartiesPage from '@/pages/PartiesPage'
import PartyDetailPage from '@/pages/PartyDetailPage'
import MembersPage from '@/pages/MembersPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsAccountsPage from '@/pages/SettingsAccountsPage'
import SettingsUsersPage from '@/pages/SettingsUsersPage'

function SettingsOnly({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <RequireRole
      fallback={
        <p className="text-sm text-muted-foreground">{t('nav.settingsAccessDenied')}</p>
      }
    >
      {children}
    </RequireRole>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="income" element={<IncomePage />} />
          <Route path="parties" element={<PartiesPage />} />
          <Route path="parties/:id" element={<PartyDetailPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="settings/accounts"
            element={
              <SettingsOnly>
                <SettingsAccountsPage />
              </SettingsOnly>
            }
          />
          <Route
            path="settings/users"
            element={
              <SettingsOnly>
                <SettingsUsersPage />
              </SettingsOnly>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  )
}
