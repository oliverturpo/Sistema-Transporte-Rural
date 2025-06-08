import { useState, useEffect } from 'react'

function ReservasConductor({ user, salida, onReservaCreada }) {
  const [mostrarModal, setMostrarModal] = useState(false)
  const [asientosDisponibles, setAsientosDisponibles] = useState([])
  const [asientosOcupados, setAsientosOcupados] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    asiento: ''
  })

  const cargarAsientos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://192.168.1.44:8000/api/salida/${salida.id}/asientos-conductor/`)
      const data = await response.json()
      
      if (data.success) {
        setAsientosDisponibles(data.asientos_disponibles)
        setAsientosOcupados(data.asientos_ocupados)
      }
    } catch (error) {
      console.error('Error al cargar asientos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.dni || !formData.asiento) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`http://192.168.80.175:8000/api/salida/${salida.id}/reservar-conductor/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          conductor_id: user.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ ${data.message}`)
        setFormData({ nombre: '', dni: '', telefono: '', asiento: '' })
        setMostrarModal(false)
        cargarAsientos()
        if (onReservaCreada) onReservaCreada()
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      alert('Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mostrarModal) {
      cargarAsientos()
    }
  }, [mostrarModal])

  return (
    <div>
      {/* Botón para abrir modal */}
      <button
        onClick={() => setMostrarModal(true)}
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          transition: 'transform 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        👥 Reservar Asiento
      </button>

      {/* Modal */}
      {mostrarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '700' }}>
                👥 Reservar Asiento - {salida.ruta.nombre}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Información de la salida */}
            <div style={{
              background: '#f8fafc',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                <strong>📅 Fecha:</strong> {salida.fecha_hora}
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                <strong>🚛 Vehículo:</strong> {salida.vehiculo.placa} (Capacidad: {salida.vehiculo.capacidad})
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>📊 Disponibles:</strong> {asientosDisponibles.length} asientos
              </p>
            </div>

            {/* Formulario */}
            <div onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  placeholder="Ingresa el nombre del pasajero"
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                marginBottom: '20px' 
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    DNI *
                  </label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                    placeholder="12345678"
                    maxLength="8"
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                    placeholder="987654321"
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Seleccionar Asiento *
                </label>
                <select
                  value={formData.asiento}
                  onChange={(e) => setFormData({...formData, asiento: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="">-- Seleccionar asiento --</option>
                  {asientosDisponibles.map(asiento => (
                    <option key={asiento} value={asiento}>
                      Asiento {asiento}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vista de asientos ocupados */}
              {asientosOcupados.length > 0 && (
                <div style={{
                  background: '#fef3c7',
                  padding: '15px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #f59e0b'
                }}>
                  <p style={{ 
                    margin: '0 0 10px 0', 
                    fontWeight: '600',
                    color: '#92400e'
                  }}>
                    Asientos Ocupados:
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px' 
                  }}>
                    {asientosOcupados.map(ocupado => (
                      <span
                        key={ocupado.asiento}
                        style={{
                          background: ocupado.es_reserva ? '#8b5cf6' : '#3b82f6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                        title={`${ocupado.nombre} - ${ocupado.tipo}`}
                      >
                        {ocupado.asiento} {ocupado.es_reserva ? '🚛' : '🎫'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nota importante */}
              <div style={{
                background: '#e0f2fe',
                padding: '15px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #0284c7'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: '#0c4a6e',
                  lineHeight: '1.5'
                }}>
                  ℹ️ <strong>Nota:</strong> Esta es una reserva gratuita del conductor. No genera ingresos y aparecerá como "Reserva del Conductor" en el manifiesto.
                </p>
              </div>

              {/* Botones */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end' 
              }}>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#4b5563'}
                  onMouseOut={(e) => e.target.style.background = '#6b7280'}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}
                >
                  {loading ? '⏳ Reservando...' : '👥 Confirmar Reserva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReservasConductor