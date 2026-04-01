import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import IssueForm from './components/IssueForm'
import Dashboard from './components/Dashboard'
import { useDarkMode } from './lib/useDarkMode'

export default function App() {
  const [view, setView]       = useState('form')
  const [dark, setDark]       = useDarkMode()

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f1e]' : 'bg-white'}`}>
      <Header
        activeView={view}
        onNavigate={setView}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
      />

      {view === 'form'      && <IssueForm dark={dark} />}
      {view === 'dashboard' && <Dashboard dark={dark} />}

      <Footer dark={dark} />
    </div>
  )
}
