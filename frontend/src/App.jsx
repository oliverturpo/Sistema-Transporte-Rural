import { useState } from 'react'
import Login from './Login'
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
          <span className="navbar-brand">Sistema de Transporte</span>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Bienvenido {user.nombre} ({user.tipo})
            </span>
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={handleLogout}
            >
              Cerrar Sesión
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

// Dashboard para Administrador
function DashboardAdmin() {
  return (
    <div className="row">
      <div className="col-12">
        <h2>Panel de Administrador</h2>
        <div className="row mt-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Salidas de Hoy</h5>
                <p className="card-text">Gestionar salidas programadas</p>
                <button className="btn btn-primary">Ver Salidas</button>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Vehículos</h5>
                <p className="card-text">Administrar flota</p>
                <button className="btn btn-success">Ver Vehículos</button>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Vender Pasajes</h5>
                <p className="card-text">Venta de boletos</p>
                <button className="btn btn-warning">Vender</button>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Encomiendas</h5>
                <p className="card-text">Gestionar envíos</p>
                <button className="btn btn-info">Ver Encomiendas</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dashboard para Conductor
function DashboardConductor({ user }) {
  return (
    <div className="row">
      <div className="col-12">
        <h2>Panel de Conductor</h2>
        <div className="alert alert-info">
          Aquí verás tus salidas del día y pasajeros asignados
        </div>
      </div>
    </div>
  )
}

export default App