import { useState, useEffect } from 'react'
import ReservasConductor from './components/ReservasConductor/ReservasConductor'

function DashboardConductor({ user }) {
  const [misSalidas, setMisSalidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaActual, setVistaActual] = useState('dashboard')
  const [salidaSeleccionada, setSalidaSeleccionada] = useState(null)
  const [pasajeros, setPasajeros] = useState([])
  const [encomiendas, setEncomiendas] = useState([])
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
      
      // Usar API que filtra por conductor
      const response = await fetch(`http://192.168.1.44:8000/api/salidas/?conductor_id=${user.id}`)
      const data = await response.json()
      
      // data es un array directamente
      const salidaData = Array.isArray(data) ? data : []
      setMisSalidas(salidaData)
      
      // Calcular estadísticas del conductor
      const ahora = new Date()
      
      // Viajes de hoy
      const viajesHoy = salidaData.filter(salida => {
        const fechaSalida = new Date(salida.fecha_hora)
        return fechaSalida.toDateString() === ahora.toDateString()
      })
      
      // Contar pasajeros de hoy
      const pasajerosHoy = viajesHoy.reduce((sum, salida) => sum + (salida.pasajeros_count || 0), 0)
      
      // Encontrar próximo viaje
      const proximoViaje = salidaData
        .filter(salida => new Date(salida.fecha_hora) > ahora && salida.estado === 'programada')
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]
      
      // Encontrar viaje en curso
      const enCurso = salidaData.find(salida => salida.estado === 'en_curso')
      
      setStats({
        viajesHoy: viajesHoy.length,
        pasajerosHoy: pasajerosHoy,
        proximoViaje: proximoViaje,
        enCurso: enCurso
      })
    } catch (error) {
      console.error('Error loading conductor data:', error)
      setMisSalidas([])
    } finally {
      setLoading(false)
    }
  }

  const cargarPasajeros = async (salidaId) => {
    try {
      const response = await fetch(`http://192.168.1.44:8000/api/salida/${salidaId}/pasajes/?conductor_id=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setPasajeros(data.pasajes || [])
      } else {
        console.error('Error al cargar pasajeros:', data.error)
        alert(`❌ ${data.error}`)
        setPasajeros([])
      }
    } catch (error) {
      console.error('Error al cargar pasajeros:', error)
      setPasajeros([])
    }
  }

  const cargarEncomiendas = async (salidaId) => {
    try {
      const response = await fetch(`http://192.168.1.44:8000/api/salida/${salidaId}/encomiendas/?conductor_id=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setEncomiendas(data.encomiendas || [])
      } else {
        console.error('Error al cargar encomiendas:', data.error)
        setEncomiendas([])
      }
    } catch (error) {
      console.error('Error al cargar encomiendas:', error)
      setEncomiendas([])
    }
  }

  const marcarSalida = async (salidaId) => {
    if (!confirm('¿Confirmar que el vehículo está saliendo?')) return

    try {
      const response = await fetch(`http://192.168.1.44:8000/api/salidas/${salidaId}/marcar-salida/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conductor_id: user.id
        })
      })
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Salida marcada correctamente')
        loadConductorData()
      } else {
        alert(data.error || 'Error al marcar salida')
      }
    } catch (error) {
      alert('Error al marcar salida')
    }
  }

  const marcarLlegada = async (salidaId) => {
    if (!confirm('¿Confirmar que el viaje ha terminado?')) return

    try {
      const response = await fetch(`http://192.168.1.44:8000/api/salidas/${salidaId}/marcar-llegada/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conductor_id: user.id
        })
      })
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Llegada marcada. ¡Viaje completado!')
        loadConductorData()
      } else {
        alert(data.error || 'Error al marcar llegada')
      }
    } catch (error) {
      alert('Error al marcar llegada')
    }
  }

  const checkInPasajero = async (pasajeroId) => {
    try {
      const response = await fetch(`http://192.168.1.44:8000/api/pasaje/${pasajeroId}/check-in/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conductor_id: user.id
        })
      })
      const data = await response.json()
      
      if (data.success) {
        cargarPasajeros(salidaSeleccionada.id)
      } else {
        alert(data.error || 'Error al hacer check-in')
      }
    } catch (error) {
      alert('Error al hacer check-in')
    }
  }

  const marcarEncomiendaEntregada = async (encomiendaId) => {
    try {
      const response = await fetch(`http://192.168.1.44:8000/api/encomienda/${encomiendaId}/entregar/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conductor_id: user.id
        })
      })
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Encomienda marcada como entregada')
        cargarEncomiendas(salidaSeleccionada.id)
      } else {
        alert(data.error || 'Error al marcar encomienda')
      }
    } catch (error) {
      alert('Error al marcar encomienda')
    }
  }

  const descargarManifiesto = async (salidaId) => {
    try {
      // Descargar directamente como PDF
      const url = `http://192.168.1.44:8000/api/salida/${salidaId}/manifiesto-pdf/?conductor_id=${user.id}`
      
      // Crear enlace temporal para descarga
      const link = document.createElement('a')
      link.href = url
      link.download = `manifiesto_${salidaId}_${new Date().toISOString().slice(0,10)}.pdf`
      link.target = '_blank'
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert('✅ Descargando manifiesto en PDF...')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al descargar manifiesto')
    }
  }

  const generarManifiestoTexto = (manifiesto) => {
    const { salida, pasajeros, estadisticas } = manifiesto
    
    let texto = `
╔══════════════════════════════════════════════════════════════╗
║                        MANIFIESTO DE VIAJE                   ║
╚══════════════════════════════════════════════════════════════╝

📍 INFORMACIÓN DEL VIAJE
═══════════════════════════════════════════════════════════════
• Ruta: ${salida.ruta.nombre}
• Origen: ${salida.ruta.origen}
• Destino: ${salida.ruta.destino}
• Fecha y Hora: ${salida.fecha_hora}
• Vehículo: ${salida.vehiculo.placa}
• Conductor: ${salida.conductor.nombre}

📊 ESTADÍSTICAS
═══════════════════════════════════════════════════════════════
• Total Pasajeros: ${estadisticas.total_pasajeros}
• Capacidad Vehículo: ${estadisticas.capacidad_vehiculo}
• Asientos Disponibles: ${estadisticas.asientos_disponibles}
• Ingresos Generados: S/ ${estadisticas.ingresos_generados.toFixed(2)}

👥 LISTA DE PASAJEROS
═══════════════════════════════════════════════════════════════
`
    
    pasajeros.forEach(pasajero => {
      const tipoEmoji = pasajero.tipo === 'Reserva del Conductor' ? '🚛' : '🎫'
      texto += `${tipoEmoji} Asiento ${pasajero.asiento.toString().padStart(2, '0')} | ${pasajero.nombre.padEnd(25)} | ${pasajero.dni} | ${pasajero.telefono} | ${pasajero.tipo}\n`
    })
    
    texto += `
═══════════════════════════════════════════════════════════════
📅 Generado: ${estadisticas.fecha_generacion}
🚛 Sistema de Transporte Rural
═══════════════════════════════════════════════════════════════
`
    
    return texto
  }

  const verDetallesSalida = (salida) => {
    setSalidaSeleccionada(salida)
    cargarPasajeros(salida.id)
    cargarEncomiendas(salida.id)
    setVistaActual('detalles')
  }

  const getEstadoViaje = (salida) => {
    const fechaSalida = new Date(salida.fecha_hora)
    const ahora = new Date()
    
    if (salida.estado === 'completada') {
      return { status: 'completado', icon: '✅', text: 'COMPLETADO', color: '#059669', bg: '#dcfce7' }
    } else if (salida.estado === 'en_curso') {
      return { status: 'en_curso', icon: '🚛', text: 'EN CURSO', color: '#d97706', bg: '#fef3c7' }
    } else if (salida.estado === 'cancelada') {
      return { status: 'cancelado', icon: '❌', text: 'CANCELADO', color: '#dc2626', bg: '#fee2e2' }
    } else if (fechaSalida <= ahora) {
      return { status: 'proximo', icon: '🚀', text: 'LISTO', color: '#2563eb', bg: '#dbeafe' }
    } else {
      return { status: 'pendiente', icon: '⏰', text: 'PENDIENTE', color: '#6b7280', bg: '#f3f4f6' }
    }
  }

  // VISTA DETALLES DE SALIDA
  if (vistaActual === 'detalles' && salidaSeleccionada) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '20px 15px'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 15px 30px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setVistaActual('dashboard')}
              style={{
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ← Volver
            </button>
            <h2 style={{ margin: 0, color: '#1e293b' }}>🚛 Mi Viaje - {salidaSeleccionada.ruta?.nombre || 'Sin nombre'}</h2>
            <div></div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <strong>Ruta:</strong> {salidaSeleccionada.ruta?.nombre || 'N/A'}<br />
              <small>{salidaSeleccionada.ruta?.origen || 'N/A'} → {salidaSeleccionada.ruta?.destino || 'N/A'}</small>
            </div>
            <div>
              <strong>Fecha/Hora:</strong> {salidaSeleccionada.fecha_hora || 'N/A'}
            </div>
            <div>
              <strong>Vehículo:</strong> {salidaSeleccionada.vehiculo?.placa || 'N/A'}
            </div>
            <div>
              <strong>Estado:</strong> 
              <span style={{
                background: getEstadoViaje(salidaSeleccionada).bg,
                color: getEstadoViaje(salidaSeleccionada).color,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                {getEstadoViaje(salidaSeleccionada).text}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {salidaSeleccionada.estado === 'programada' && (
              <button 
                onClick={() => marcarSalida(salidaSeleccionada.id)}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🚀 Marcar Salida
              </button>
            )}
            {salidaSeleccionada.estado === 'en_curso' && (
              <button 
                onClick={() => marcarLlegada(salidaSeleccionada.id)}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🏁 Marcar Llegada
              </button>
            )}
            
            {/* Botón para reservar asientos */}
            <ReservasConductor 
              user={user} 
              salida={salidaSeleccionada} 
              onReservaCreada={() => {
                cargarPasajeros(salidaSeleccionada.id)
                loadConductorData()
              }}
            />
            
            {/* Botón para descargar manifiesto PDF */}
            <button 
              onClick={() => descargarManifiesto(salidaSeleccionada.id)}
              style={{
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📄 Descargar PDF
            </button>
          </div>
        </div>

        {/* Pasajeros */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 15px 30px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: '20px' }}>
            👥 Mis Pasajeros ({pasajeros.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pasajeros.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                No hay pasajeros cargados para este viaje
              </p>
            ) : (
              pasajeros.map(pasajero => (
                <div key={pasajero.id} style={{
                  background: pasajero.estado === 'abordado' ? '#dcfce7' : '#f8fafc',
                  border: `2px solid ${pasajero.es_reserva_conductor ? '#8b5cf6' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '18px' }}>
                        {pasajero.es_reserva_conductor ? '🚛' : '🎫'}
                      </span>
                      <strong>{pasajero.nombre}</strong>
                      {pasajero.es_reserva_conductor && (
                        <span style={{
                          background: '#8b5cf6',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          MI RESERVA
                        </span>
                      )}
                    </div>
                    <small>DNI: {pasajero.dni} • Asiento: {pasajero.asiento}</small><br />
                    <small>Tel: {pasajero.telefono || 'No registrado'}</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: pasajero.estado === 'abordado' ? '#059669' : '#6b7280',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {pasajero.estado === 'abordado' ? '✅ Abordado' : '⏳ Pendiente'}
                    </span>
                    {pasajero.estado !== 'abordado' && (
                      <button 
                        onClick={() => checkInPasajero(pasajero.id)}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ✅ Check-in
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Encomiendas */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '25px',
          boxShadow: '0 15px 30px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: '20px' }}>📦 Mis Encomiendas ({encomiendas.length})</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {encomiendas.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                No tienes encomiendas para este viaje
              </p>
            ) : (
              encomiendas.map(encomienda => (
                <div key={encomienda.id} style={{
                  background: encomienda.estado === 'entregada' ? '#dcfce7' : '#fef3c7',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{encomienda.descripcion}</strong><br />
                    <small>Para: {encomienda.destinatario_nombre} • Peso: {encomienda.peso_kg}kg</small><br />
                    <small>Tel: {encomienda.destinatario_telefono}</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: encomienda.estado === 'entregada' ? '#059669' : '#d97706',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {encomienda.estado === 'entregada' ? '✅ Entregada' : '📦 Pendiente'}
                    </span>
                    {encomienda.estado !== 'entregada' && (
                      <button 
                        onClick={() => marcarEncomiendaEntregada(encomienda.id)}
                        style={{
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ✅ Entregar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // VISTA PRINCIPAL DASHBOARD
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
          <div 
            style={{
              width: '50px',
              height: '50px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}
          ></div>
          <h3 style={{ color: '#374151', margin: 0 }}>Cargando mis viajes...</h3>
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
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
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
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
          Mi Panel de Conductor
        </h1>
        <p style={{
          fontSize: '18px',
          opacity: 0.9,
          margin: '0 0 15px 0'
        }}>
          {user.first_name || user.username} {user.last_name || ''} - Conductor
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
            🚀 MI PRÓXIMO VIAJE
          </h3>
          <div style={{
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '10px',
            position: 'relative',
            zIndex: 1
          }}>
            {stats.proximoViaje.fecha_hora} - {stats.proximoViaje.ruta?.nombre || 'Sin nombre'}
          </div>
          <div style={{
            fontSize: '16px',
            opacity: 0.9,
            marginBottom: '15px',
            position: 'relative',
            zIndex: 1
          }}>
            🚛 {stats.proximoViaje.vehiculo?.placa || 'N/A'} • {stats.proximoViaje.pasajeros_count || 0}/{stats.proximoViaje.vehiculo?.capacidad || 0} pasajeros
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

      {/* VIAJE EN CURSO */}
      {stats.enCurso && (
        <div style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '25px',
          color: 'white',
          boxShadow: '0 20px 40px rgba(220, 38, 38, 0.4)',
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
            🚛
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 15px 0',
            position: 'relative',
            zIndex: 1
          }}>
            🚛 VIAJE EN CURSO
          </h3>
          <div style={{
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '10px',
            position: 'relative',
            zIndex: 1
          }}>
            {stats.enCurso.fecha_hora} - {stats.enCurso.ruta?.nombre || 'Sin nombre'}
          </div>
          <div style={{
            fontSize: '16px',
            opacity: 0.9,
            marginBottom: '15px',
            position: 'relative',
            zIndex: 1
          }}>
            🚛 {stats.enCurso.vehiculo?.placa || 'N/A'} • {stats.enCurso.pasajeros_count || 0}/{stats.enCurso.vehiculo?.capacidad || 0} pasajeros
          </div>
          <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 1 }}>
            <button 
              onClick={() => verDetallesSalida(stats.enCurso)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
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
              👁️ Ver Detalles
            </button>
            <button 
              onClick={() => marcarLlegada(stats.enCurso.id)}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(255,255,255,1)',
                color: '#dc2626',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              🏁 Marcar Llegada
            </button>
          </div>
        </div>
      )}

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
            📋 Mis Salidas Programadas
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
            🔄 Actualizar
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
                onClick={() => verDetallesSalida(salida)}
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
                    {new Date(salida.fecha_hora).toLocaleTimeString('es-PE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: estado.color,
                      marginBottom: '5px'
                    }}>
                      {salida.ruta?.nombre || 'Sin nombre'}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: estado.color,
                      opacity: 0.8
                    }}>
                      🚛 {salida.vehiculo?.placa || 'N/A'} • 👥 {salida.pasajeros_count || 0}/{salida.vehiculo?.capacidad || 0} pasajeros
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: estado.color,
                      opacity: 0.7,
                      marginTop: '2px'
                    }}>
                      📅 {new Date(salida.fecha_hora).toLocaleDateString('es-PE')}
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
                No tienes viajes programados
              </div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                Contacta con administración para programar tus rutas
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardConductor