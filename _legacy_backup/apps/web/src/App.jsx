import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Action from './pages/Action'
import axios from 'axios'
import { Toaster } from 'sonner'

axios.defaults.withCredentials = true

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get('/auth/me')
      if (res.data && res.data.user) {
        setUser(res.data.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={checkAuth} />}
        />
        <Route
          path="/action/:scenarioId"
          element={<Action />}
        />
        <Route
          path="/*"
          element={!user ? <Navigate to="/login" /> : <Dashboard user={user} onLogout={() => setUser(null)} />}
        />
      </Routes>
    </>
  )
}

export default App
