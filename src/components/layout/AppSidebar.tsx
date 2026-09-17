import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  UserSquare2,
  FileBarChart,
  Settings,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsSuperAdmin } from '@/hooks/useProfile'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ledger', label: 'Ledger', icon: BookOpen },
  { to: '/expenses', label: 'Expense Ledger', icon: ArrowDownCircle },
  { to: '/income', label: 'Income Ledger', icon: ArrowUpCircle },
  { to: '/parties', label: 'Parties', icon: UserSquare2 },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
]

const settingsItems = [
  { to: '/settings/accounts', label: 'Accounts & Categories' },
  { to: '/settings/users', label: 'Users' },
]

export default function AppSidebar() {
  const isSuperAdmin = useIsSuperAdmin()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Building2 className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">Sahu Samaj Bhawan</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        {isSuperAdmin && (
          <div className="mt-4">
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </div>
            {settingsItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground',
                    isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}
