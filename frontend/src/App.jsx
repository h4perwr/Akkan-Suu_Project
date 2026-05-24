import { useState } from 'react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  return (
    <div>
      {!token ? <Auth setToken={setToken} /> : <Dashboard token={token} />}
    </div>
  )
}

export default App