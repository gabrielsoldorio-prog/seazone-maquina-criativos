import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Layers, ChevronRight } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Novo Briefing', icon: Home },
  { href: '/criativos', label: 'Criativos', icon: Layers },
]

export default function Layout({ children, title, subtitle, rightPanel }) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0F172A] flex flex-col z-50">
        <div className="px-5 py-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E85D3A] rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0">S</div>
            <div>
              <div className="text-white text-sm font-bold">Seazone</div>
              <div className="text-[#94A3B8] text-xs">Máquina de Criativos</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{ textDecoration: 'none' }}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg mb-1 text-sm transition-colors duration-200 ${
                  active
                    ? 'bg-[#1E293B] text-white font-semibold'
                    : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-[#1E293B]">
          <div className="text-[#64748B] text-xs">Seazone © 2025</div>
        </div>
      </aside>

      {/* Main area */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: '256px', marginRight: rightPanel ? '320px' : '0' }}
      >
        {/* Topbar */}
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-4 flex items-center gap-2 sticky top-0 z-40">
          <span className="text-[#64748B] text-sm">Seazone</span>
          <ChevronRight size={14} color="#94A3B8" />
          <span className="text-[#0F172A] text-sm font-semibold">{title || 'Home'}</span>
          {subtitle && (
            <>
              <ChevronRight size={14} color="#94A3B8" />
              <span className="text-[#64748B] text-sm">{subtitle}</span>
            </>
          )}
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>

      {/* Right panel */}
      {rightPanel && (
        <aside className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-[#E2E8F0] flex flex-col z-40 overflow-hidden">
          {rightPanel}
        </aside>
      )}
    </div>
  )
}
