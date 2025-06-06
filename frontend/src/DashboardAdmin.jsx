import { useState, useEffect } from 'react'
import axios from 'axios'

function DashboardAdmin() {
  const [salidas, setSalidas] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    salidasHoy: 0,
    pasajerosTotal: 0,
    ingresosHoy: 0,
    encomiendas: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [salidasRes, vehiculosRes] = await Promise.all([
        axios.get('http://192.168.1.44:8000/api/salidas-hoy/'),
        axios.get('http://192.168.1.44:8000/api/vehiculos/')
      ])
      
      setSalidas(salidasRes.data)
      setVehiculos(vehiculosRes.data)
      
      // Calcular estadísticas
      const pasajerosTotal = salidasRes.data.reduce((sum, salida) => sum + salida.ocupados, 0)
      const ingresos = pasajerosTotal * 15 // Precio promedio
      
      setStats({
        salidasHoy: salidasRes.data.length,
        pasajerosTotal: pasajerosTotal,
        ingresosHoy: ingresos,
        encomiendas: Math.floor(Math.random() * 20) + 5 // Simulado
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (salida) => {
    const ocupacion = salida.ocupados / salida.disponibles
    if (ocupacion >= 1) return { bg: '#dcfce7', text: '#166534', icon: '🟢' }
    if (ocupacion > 0.5) return { bg: '#fef3c7', text: '#92400e', icon: '🟡' }
    return { bg: '#f3f4f6', text: '#374151', icon: '⚪' }
  }

  const formatTime = () => {
    const now = new Date()
    return now.toLocaleDateString('es-PE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3 style={{ color: '#374151', margin: 0 }}>Cargando Dashboard...</h3>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* HEADER ÉPICO */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontSize: '32px',
              background: 'linear-gradient(135deg, #60a5fa, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🚛
            </div>
            <div>
              <h1 style={{
                color: 'white',
                margin: 0,
                fontSize: '24px',
                fontWeight: '800',
                letterSpacing: '-0.5px'
              }}>
                TransRural
              </h1>
              <p style={{
                color: '#94a3b8',
                margin: 0,
                fontSize: '14px'
              }}>
                Panel de Administración
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 12px',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px'
            }}>
              👨‍💼 Administrador
            </div>
            <button style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}>
              📤 Salir
            </button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px'
      }}>
        
        {/* HERO SECTION CON FECHA */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0 0 8px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            📊 Dashboard del Día
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            margin: 0,
            textTransform: 'capitalize'
          }}>
            {formatTime()}
          </p>
        </div>

        {/* KPI CARDS BRUTALES */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          
          {/* Salidas Hoy */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '20px',
            padding: '32px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              fontSize: '120px',
              opacity: 0.1
            }}>
              📅
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              marginBottom: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              {stats.salidasHoy}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              opacity: 0.9,
              position: 'relative',
              zIndex: 1
            }}>
              Salidas Programadas
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.7,
              marginTop: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              📈 +2 vs ayer
            </div>
          </div>

          {/* Pasajeros */}
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            borderRadius: '20px',
            padding: '32px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(5, 150, 105, 0.3)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              fontSize: '120px',
              opacity: 0.1
            }}>
              👥
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              marginBottom: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              {stats.pasajerosTotal}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              opacity: 0.9,
              position: 'relative',
              zIndex: 1
            }}>
              Pasajeros Transportados
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.7,
              marginTop: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              🎯 85% ocupación promedio
            </div>
          </div>

          {/* Ingresos */}
          <div style={{
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            borderRadius: '20px',
            padding: '32px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(217, 119, 6, 0.3)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              fontSize: '120px',
              opacity: 0.1
            }}>
              💰
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              marginBottom: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              S/{stats.ingresosHoy}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              opacity: 0.9,
              position: 'relative',
              zIndex: 1
            }}>
              Ingresos del Día
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.7,
              marginTop: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              💎 Meta: S/1200
            </div>
          </div>

          {/* Encomiendas */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            borderRadius: '20px',
            padding: '32px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(124, 58, 237, 0.3)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              fontSize: '120px',
              opacity: 0.1
            }}>
              📦
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              marginBottom: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              {stats.encomiendas}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              opacity: 0.9,
              position: 'relative',
              zIndex: 1
            }}>
              Encomiendas Activas
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.7,
              marginTop: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              🚚 8 en tránsito
            </div>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS BRUTALES */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            🚀 Acciones Rápidas
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            
            {[
              { icon: '🎫', title: 'Vender Pasaje', desc: 'Nueva venta', color: '#3b82f6' },
              { icon: '📦', title: 'Nueva Encomienda', desc: 'Registrar envío', color: '#059669' },
              { icon: '🚛', title: 'Programar Salida', desc: 'Nueva ruta', color: '#d97706' },
              { icon: '👥', title: 'Ver Pasajeros', desc: 'Lista completa', color: '#7c3aed' },
              { icon: '📊', title: 'Reportes', desc: 'Análisis y gráficos', color: '#dc2626' },
              { icon: '⚙️', title: 'Administrar', desc: 'Configuración', color: '#64748b' }
            ].map((action, index) => (
              <button
                key={index}
                style={{
                  background: 'white',
                  border: `2px solid ${action.color}`,
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = action.color
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = `0 15px 30px ${action.color}40`
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.color = 'inherit'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                  {action.icon}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: action.color
                }}>
                  {action.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SALIDAS EN TIEMPO REAL - ÉPICO */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              📅 Salidas de Hoy
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                + Nueva Salida
              </button>
              <button
                onClick={loadDashboardData}
                style={{
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                🔄
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {salidas.length > 0 ? salidas.map((salida, index) => {
              const status = getStatusColor(salida)
              return (
                <div
                  key={index}
                  style={{
                    background: status.bg,
                    border: `2px solid ${status.bg}`,
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: status.text
                  }}>
                    {salida.hora}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: status.text,
                      marginBottom: '4px'
                    }}>
                      {salida.ruta}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: status.text,
                      opacity: 0.8
                    }}>
                      🚛 {salida.vehiculo} • 👨‍✈️ {salida.conductor}
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: status.text
                    }}>
                      {salida.ocupados}/{salida.capacidad}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: status.text,
                      opacity: 0.8
                    }}>
                      pasajeros
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '24px'
                  }}>
                    {status.icon}
                  </div>
                </div>
              )
            }) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚛</div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  No hay salidas programadas para hoy
                </div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Programa la primera salida del día
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default DashboardAdmin