import { Moon, Sun } from 'lucide-react'

export default function Header({ activeView, onNavigate, dark, onToggleDark }) {
  return (
    <header
      className="w-full px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-2 shadow-sm"
      style={{ backgroundColor: '#2d3666' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: '#4ab9e6', color: '#fff' }}
        >
          DH
        </div>
        <div>
          <span className="text-white font-semibold text-sm">Deluxe Holiday Homes</span>
          <span className="text-gray-400 text-xs ml-2">Maintenance</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <nav className="flex gap-2">
          <NavBtn label="Submit Issue" active={activeView === 'form'}      onClick={() => onNavigate('form')} />
          <NavBtn label="Dashboard"   active={activeView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        </nav>

        <button
          onClick={onToggleDark}
          className="ml-1 p-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  )
}

function NavBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-[#4ab9e6] text-[#2d3666]'
          : 'border border-gray-600 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  )
}
