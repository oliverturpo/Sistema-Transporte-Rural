import { useState } from 'react'
import axios from 'axios'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('http://192.168.1.44:8000/api/login/', {
        username,
        password
      })

      if (response.data.success) {
        onLogin(response.data.user)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Detectar si es móvil
  const isMobile = window.innerWidth <= 768

  if (isMobile) {
    // DISEÑO MÓVIL: Fondo completo + formulario flotante
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundImage: 'url("https://images.unsplash.com/photo-1621993202323-f438eec934ff?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Overlay para legibilidad */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(1px)'
        }}></div>

        {/* Formulario flotante centrado */}
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px 30px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          zIndex: 1
        }}>
          
          {/* Header del formulario */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              fontSize: '40px',
              marginBottom: '16px'
            }}>
              🚛
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              TransRural
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '14px',
              margin: 0
            }}>
              Sistema de Transporte Rural
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                👤 Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                🔒 Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                transform: 'translateY(0)',
                marginTop: '8px'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.background = '#2563eb'
                  e.target.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.background = '#3b82f6'
                  e.target.style.transform = 'translateY(0)'
                }
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Ingresando...
                </div>
              ) : (
                '🚀 Ingresar al Sistema'
              )}
            </button>
          </form>

          {/* Info de tipos de usuario */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            👨‍💼 Administrador | 🚛 Conductor
          </div>
        </div>
      </div>
    )
  }

  // DISEÑO PC: Split-screen como antes

  // DISEÑO PC: Split-screen como antes
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#f8fafc',
      display: 'flex',
      position: 'relative'
    }}>
      
      {/* Panel izquierdo - Branding */}
      <div style={{
        flex: '1',
        backgroundImage: 'url("https://images.unsplash.com/photo-1621993202323-f438eec934ff?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Overlay oscuro para legibilidad */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(51, 65, 85, 0.8) 100%)',
          backdropFilter: 'blur(2px)'
        }}></div>

        <div style={{ zIndex: 1, textAlign: 'center', color: 'white' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '24px',
            textShadow: '0 4px 8px rgba(0,0,0,0.5)'
          }}>
            🚛
          </div>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            margin: '0 0 16px 0',
            letterSpacing: '-1px'
          }}>
            TransRural
          </h1>
          
          <p style={{
            fontSize: '18px',
            opacity: 0.8,
            margin: '0 0 32px 0',
            maxWidth: '300px',
            lineHeight: '1.6'
          }}>
            Sistema integral para la gestión de transporte rural, pasajes y encomiendas
          </p>

          <div style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Control Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Tiempo Real</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Seguro</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Login */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px'
        }}>
          
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              Bienvenido de vuelta
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0
            }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                style={{
                  width: '100%',
                  padding: '18px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                style={{
                  width: '100%',
                  padding: '18px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.background = '#2563eb'
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)'
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.background = '#3b82f6'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Ingresando...
                </div>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  TIPOS DE USUARIO
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  👨‍💼 Administrador | 🚛 Conductor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 