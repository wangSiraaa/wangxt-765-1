import { Link, useLocation } from 'react-router-dom'
import { ClipboardList, Plus, FileText, Wrench, Activity, Shield } from 'lucide-react'

const navItems = [
  { path: '/', label: '事件列表', icon: ClipboardList },
  { path: '/events/new', label: '事件登记', icon: Plus },
  { path: '/rectifications', label: '整改跟踪', icon: Wrench },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-teal-800 text-white flex flex-col shadow-xl">
        <div className="p-5 border-b border-teal-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">医疗器械</h1>
              <p className="text-xs text-teal-300">不良事件上报系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path ||
              (item.path === '/' && location.pathname.startsWith('/events/'))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-teal-200 hover:bg-teal-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-teal-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold">
              管
            </div>
            <div>
              <p className="text-sm font-medium">管理员</p>
              <p className="text-xs text-teal-300">全部权限</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
