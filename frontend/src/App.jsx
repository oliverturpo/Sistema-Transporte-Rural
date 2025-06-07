import { useState } from 'react'
import Login from './Login'
import DashboardAdmin from './DashboardAdmin'
import DashboardConductor from './DashboardConductor'
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
  const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem('user')
  return savedUser ? JSON.parse(savedUser) : null
  })

  const handleLogin = (userData) => {
  setUser(userData)
  localStorage.setItem('user', JSON.stringify(userData))
  console.log('Usuario logueado:', userData)
  }

  const handleLogout = () => {
  setUser(null)
  localStorage.removeItem('user')
  }

  // Si no está logueado, mostrar login
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Si está logueado, mostrar dashboard según tipo
  return (
    <div className="container-fluid">
      {/* Header Épico pero Simple */}
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top" 
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
        <div className="container-fluid py-2">
          
          {/* Logo y Branding */}
          <div className="navbar-brand d-flex align-items-center gap-3 mb-0">
            <div style={{
              width: '45px',
              height: '45px',
              background: 'linear-gradient(135deg, #60a5fa, #34d399)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
              transform: 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'rotate(5deg) scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
            >
              🚛
            </div>
            <div>
              <h1 className="h4 fw-bold mb-0 text-white" style={{ letterSpacing: '-0.5px' }}>
                TransRural
              </h1>
              <small className="text-white-50 d-none d-md-block">
                Sistema de Transporte Rural
              </small>
            </div>
          </div>

          {/* Información del usuario y logout */}
          <div className="d-flex align-items-center gap-3">
            
            {/* Info del usuario */}
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: '40px',
                height: '40px',
                background: user.tipo === 'admin' 
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                  : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                {user.tipo === 'admin' ? '👨‍💼' : '🚛'}
              </div>
              
              <div className="text-white d-none d-sm-block">
                <div className="fw-semibold" style={{ fontSize: '15px', lineHeight: '1.2' }}>
                  {user.nombre}
                </div>
                <div className="small text-white-50" style={{ fontSize: '13px' }}>
                  {user.tipo === 'admin' ? 'Administrador' : 'Conductor'}
                </div>
              </div>
            </div>

            {/* Botón logout mejorado */}
            <button 
              className="btn btn-outline-light d-flex align-items-center gap-2"
              onClick={handleLogout}
              style={{ 
                borderRadius: '12px',
                borderColor: 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                fontWeight: '600',
                padding: '8px 16px',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span>📤</span>
              <span className="d-none d-md-inline">Cerrar Sesión</span>
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