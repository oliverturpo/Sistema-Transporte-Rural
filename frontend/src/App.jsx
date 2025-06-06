import { useState } from 'react'
import Login from './Login'
import DashboardAdmin from './DashboardAdmin'
import DashboardConductor from './DashboardConductor'
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    console.log('Usuario logueado:', userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  // Si no está logueado, mostrar login
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Si está logueado, mostrar dashboard según tipo
  return (
    <div className="container-fluid">
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">🚛 TransRural</span>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Bienvenido {user.nombre} ({user.tipo})
            </span>
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={handleLogout}
            >
              📤 Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard según tipo de usuario */}
      <div className="mt-4">
        {user.tipo === 'admin' ? (
          <DashboardAdmin />
        ) : (
          <DashboardConductor user={user} />
        )}
      </div>
    </div>
  )
}

export default App