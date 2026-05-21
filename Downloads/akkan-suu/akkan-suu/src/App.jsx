import { useState } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState(null)

  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)
  })

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <Dashboard session={session} />
      )}
    </div>
  )
}

export default App