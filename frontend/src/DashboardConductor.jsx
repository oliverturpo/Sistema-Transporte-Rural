import { useState, useEffect } from 'react'
import axios from 'axios'

function DashboardConductor({ user }) {
  const [misSalidas, setMisSalidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    viajesHoy: 0,
    pasajerosHoy: 0,
    proximoViaje: null,
    enCurso: null
  })

  useEffect(() => {
    loadConductorData()
  }, [])

  const loadConductorData = async () => {
    try {
      setLoading(true)
      // Obtener todas las salidas y filtrar por conductor
      const response = await axios.get('http://192.168.1.44:8000/api/salidas-hoy/')
      
      // Filtrar salidas de este conductor
      const misSalidasData = response.data.filter(salida => 
        salida.conductor.toLowerCase().includes(user.nombre.toLowerCase()) ||
        salida.conductor.toLowerCase().includes(user.username.toLowerCase())
      )
      
      setMisSalidas(misSalidasData)
      
      // Calcular estadísticas del conductor
      const pasajerosTotal = misSalidasData.reduce((sum, salida) => sum + salida.ocupados, 0)
      const ahora = new Date()
      const horaActual = ahora.getHours() * 100 + ahora.getMinutes()
      
      // Encontrar próximo viaje
      const proximoViaje = misSalidasData.find(salida => {
        const [hora, min] = salida.hora.split(':').map(Number)
        const horaSalida = hora * 100 + min
        return horaSalida > horaActual
      })
      
      // Encontrar viaje en curso
      const enCurso = misSalidasData.find(salida => {
        const [hora, min] = salida.hora.split(':').map(Number)
        const horaSalida = hora * 100 + min
        return horaSalida <= horaActual && horaSalida > (horaActual - 400) // 4 horas de viaje max
      })
      
      setStats({
        viajesHoy: misSalidasData.length,
        pasajerosHoy: pasajerosTotal,
        proximoViaje: proximoViaje,
        enCurso: enCurso
      })
    } catch (error) {
      console.error('Error loading conductor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoViaje = (salida) => {
    const ahora = new Date()
    const horaActual = ahora.getHours() * 100 + ahora.getMinutes()
    const [hora, min] = salida.hora.split(':').map(Number)
    const horaSalida = hora * 100 + min
    
    if (horaSalida > horaActual + 100) {
      return { status: 'pendiente', icon: '⏰', text: 'PENDIENTE', color: '#6b7280', bg: '#f3f4f6' }
    } else if (horaSalida > horaActual) {
      return { status: 'proximo', icon: '🚀', text: 'PRÓXIMO', color: '#2563eb', bg: '#dbeafe' }
    } else if (horaSalida > horaActual - 400) {
      return { status: 'en_curso', icon: '🚛', text: 'EN CURSO', color: '#d97706', bg: '#fef3c7' }
    } else {
      return { status: 'completado', icon: '✅', text: 'COMPLETADO', color: '#059669', bg: '#dcfce7' }
    }
  }

  const marcarSalida = (salidaId) => {
    alert(`Marcando salida para viaje ${salidaId}`)
    // Aquí iría la lógica para marcar salida
  }

  const verPasajeros = (salidaId) => {
    alert(`Viendo pasajeros del viaje ${salidaId}`)
    // Aquí iría la navegación a lista de pasajeros
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
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
          <h3 style={{ color: '#374151', margin: 0 }}>Cargando tus viajes...</h3>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px 15px'
    }}>
      
      {/* HEADER CONDUCTOR */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '20px',
        padding: '30px 25px',
        marginBottom: '25px',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '15px',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          🚛
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          Mi Día de Trabajo
        </h1>
        <p style={{
          fontSize: '18px',
          opacity: 0.9,
          margin: '0 0 15px 0'
        }}>
          {user.nombre} - Conductor
        </p>
        <div style={{
          fontSize: '16px',
          opacity: 0.8,
          background: 'rgba(255,255,255,0.1)',
          padding: '10px 20px',
          borderRadius: '25px',
          display: 'inline-block'
        }}>
          📅 {new Date().toLocaleDateString('es-PE', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </div>
      </div>

      {/* STATS RÁPIDAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        
        {/* Mis Viajes */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '18px',
          padding: '25px 20px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 15px 30px rgba(59, 130, 246, 0.3)',
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
            {stats.viajesHoy}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', opacity: 0.9 }}>
            📅 Mis Viajes Hoy
          </div>
        </div>

        {/* Pasajeros */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          borderRadius: '18px',
          padding: '25px 20px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 15px 30px rgba(5, 150, 105, 0.3)',
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
            {stats.pasajerosHoy}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', opacity: 0.9 }}>
            👥 Pasajeros Hoy
          </div>
        </div>
      </div>

      {/* PRÓXIMO VIAJE DESTACADO */}
      {stats.proximoViaje && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '25px',
          color: 'white',
          boxShadow: '0 20px 40px rgba(245, 158, 11, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '80px',
            opacity: 0.2
          }}>
            🚀
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 15px 0',
            position: 'relative',
            zIndex: 1
          }}>
            🚀 PRÓXIMO VIAJE
          </h3>
          <div style={{
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '10px',
            position: 'relative',
            zIndex: 1
          }}>
            {stats.proximoViaje.hora} - {stats.proximoViaje.ruta}
          </div>
          <div style={{
            fontSize: '16px',
            opacity: 0.9,
            marginBottom: '15px',
            position: 'relative',
            zIndex: 1
          }}>
            🚛 {stats.proximoViaje.vehiculo} • {stats.proximoViaje.ocupados}/{stats.proximoViaje.capacidad} pasajeros
          </div>
          <button 
            onClick={() => marcarSalida(stats.proximoViaje.id)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            🚗 Marcar Salida
          </button>
        </div>
      )}

      {/* ACCIONES RÁPIDAS */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 15px 30px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          ⚡ Acciones Rápidas
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '15px'
        }}>
          
          {[
            { icon: '👥', title: 'Ver Pasajeros', desc: 'Lista completa', color: '#3b82f6', action: () => stats.proximoViaje && verPasajeros(stats.proximoViaje.id) },
            { icon: '📋', title: 'Mis Viajes', desc: 'Horarios', color: '#059669', action: () => alert('Viendo todos mis viajes') },
            { icon: '📦', title: 'Encomiendas', desc: 'A entregar', color: '#7c3aed', action: () => alert('Viendo encomiendas') },
            { icon: '📞', title: 'Contactar', desc: 'Central', color: '#dc2626', action: () => alert('Llamando a central') }
          ].map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              style={{
                background: 'white',
                border: `2px solid ${action.color}`,
                borderRadius: '16px',
                padding: '20px 15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = action.color
                e.currentTarget.style.color = 'white'
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = `0 10px 20px ${action.color}40`
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.color = 'inherit'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                {action.icon}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px',
                color: action.color
              }}>
                {action.title}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#64748b'
              }}>
                {action.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TODOS MIS VIAJES */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '25px',
        boxShadow: '0 15px 30px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0
          }}>
            📋 Mis Salidas de Hoy
          </h3>
          <button 
            onClick={loadConductorData}
            style={{
              background: '#64748b',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {misSalidas.length > 0 ? misSalidas.map((salida, index) => {
            const estado = getEstadoViaje(salida)
            return (
              <div
                key={index}
                style={{
                  background: estado.bg,
                  border: `2px solid ${estado.bg}`,
                  borderRadius: '16px',
                  padding: '20px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => verPasajeros(salida.id)}
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
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: estado.color
                  }}>
                    {salida.hora}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: estado.color,
                      marginBottom: '5px'
                    }}>
                      {salida.ruta}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: estado.color,
                      opacity: 0.8
                    }}>
                      🚛 {salida.vehiculo} • 👥 {salida.ocupados}/{salida.capacidad} pasajeros
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                      {estado.icon}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: estado.color
                    }}>
                      {estado.text}
                    </div>
                  </div>
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
                No tienes viajes programados para hoy
              </div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                Contacta con administración para más información
              </div>
            </div>
          )}
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

export default DashboardConductor