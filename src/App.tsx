import { NavLink, Route, Routes } from 'react-router-dom'
import { LayoutDashboard, Tag, Settings as SettingsIcon } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { Tags } from './pages/Tags'
import { Settings } from './pages/Settings'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tags', label: 'Tags', icon: Tag },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-white text-sm tracking-wide">🎵 NFC Jukebox</span>
          <nav className="flex gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`
                }
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <footer className="text-center text-slate-600 text-xs py-4">
        NFC Spotify Jukebox — <a href="https://github.com/mvesga/nfcSpotifyJukebox" className="hover:text-slate-400 transition-colors">GitHub</a>
      </footer>
    </div>
  )
}
