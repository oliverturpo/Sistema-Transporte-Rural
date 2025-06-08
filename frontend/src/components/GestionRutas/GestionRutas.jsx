import { useState, useEffect } from 'react'

const GestionRutas = ({ onVolver }) => {
  const [rutas, setRutas] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false)
  const [rutaEditando, setRutaEditando] = useState(null)
  const [loading, setLoading] = useState(false)
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [salidas, setSalidas] = useState([])
  const [mostrarSalidas, setMostrarSalidas] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    origen: '',
    destino: '',
    distancia_km: '',
    tiempo_estimado: '',
    precio_pasaje: '',
    precio_encomienda_kg: ''
  })

  const [formSalida, setFormSalida] = useState({
    ruta_id: '',
    conductor_id: '',
    fecha_hora: ''
  })

  useEffect(() => {
    cargarRutas()
    cargarVehiculos()
    cargarConductores()
    if (mostrarSalidas) {
      cargarSalidas()
    }
  }, [mostrarSalidas])

  const cargarRutas = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://192.168.80.175:8000/api/rutas/')
      const data = await response.json()
      setRutas(data)
    } catch (error) {
      console.error('Error al cargar rutas:', error)
      alert('Error al cargar la lista de rutas')
    } finally {
      setLoading(false)
    }
  }

  const cargarVehiculos = async () => {
    try {
      const response = await fetch('http://192.168.80.175:8000/api/vehiculos/')
      const data = await response.json()
      setVehiculos(data.filter(v => v.estado === 'activo'))
    } catch (error) {
      console.error('Error al cargar vehículos:', error)
    }
  }

  const cargarConductores = async () => {
    try {
      const response = await fetch('http://192.168.80.175:8000/api/conductores/lista/')  // ← CAMBIAR ESTA URL
      const data = await response.json()
      console.log('Todos los conductores:', data) // Para debug
      // Solo conductores con vehículo asignado
      const conductoresConVehiculo = data.filter(c => c.vehiculos_asignados > 0)
      console.log('Conductores con vehículo:', conductoresConVehiculo) // Para debug
      setConductores(conductoresConVehiculo)
    } catch (error) {
      console.error('Error al cargar conductores:', error)
    }
  }

  const cargarSalidas = async () => {
    try {
      const response = await fetch('http://192.168.80.175:8000/api/salidas/')
      const data = await response.json()
      setSalidas(data)
    } catch (error) {
      console.error('Error al cargar salidas:', error)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSalidaChange = (e) => {
    setFormSalida({
      ...formSalida,
      [e.target.name]: e.target.value
    })
  }

  const abrirModal = (ruta = null) => {
    if (ruta) {
      // Modo edición
      setRutaEditando(ruta)
      setFormData({
        nombre: ruta.nombre,
        origen: ruta.origen,
        destino: ruta.destino,
        distancia_km: ruta.distancia_km,
        tiempo_estimado: ruta.tiempo_estimado.replace(':00', ''), // Quitar segundos si existen
        precio_pasaje: ruta.precio_pasaje,
        precio_encomienda_kg: ruta.precio_encomienda_kg
      })
    } else {
      // Modo creación
      setRutaEditando(null)
      setFormData({
        nombre: '',
        origen: '',
        destino: '',
        distancia_km: '',
        tiempo_estimado: '',
        precio_pasaje: '',
        precio_encomienda_kg: ''
      })
    }
    setMostrarModal(true)
  }

  const abrirModalSalida = (ruta = null) => {
    setFormSalida({
      ruta_id: ruta ? ruta.id : '',
      conductor_id: '',
      fecha_hora: ''
    })
    setMostrarModalSalida(true)
  }

  const cerrarModales = () => {
    setMostrarModal(false)
    setMostrarModalSalida(false)
    setRutaEditando(null)
  }

  const guardarRuta = async (e) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!formData.nombre || !formData.origen || !formData.destino || 
        !formData.distancia_km || !formData.tiempo_estimado || 
        !formData.precio_pasaje || !formData.precio_encomienda_kg) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    try {
      setLoading(true)
      
      const url = rutaEditando 
        ? `http://192.168.80.175:8000/api/rutas/${rutaEditando.id}/actualizar/`
        : 'http://192.168.80.175:8000/api/rutas/crear/'
      
      const method = rutaEditando ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        cargarRutas()
        cerrarModales()
      } else {
        alert(data.error || 'Error al guardar la ruta')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la ruta')
    } finally {
      setLoading(false)
    }
  }

  const crearSalida = async (e) => {
    e.preventDefault()
    
    if (!formSalida.ruta_id || !formSalida.conductor_id || !formSalida.fecha_hora) {
      alert('Por favor complete todos los campos')
      return
    }

    // Obtener el vehículo del conductor seleccionado
    const conductorSeleccionado = conductores.find(c => c.id == formSalida.conductor_id)
    if (!conductorSeleccionado) {
      alert('Error: Conductor no encontrado')
      return
    }

    console.log('Conductor seleccionado:', conductorSeleccionado)
    console.log('Todos los vehículos:', vehiculos)

    // Buscar el vehículo asignado al conductor - DIFERENTES FORMAS DE BUSCAR
    let vehiculoConductor = vehiculos.find(v => v.conductor_id == conductorSeleccionado.id) ||
                           vehiculos.find(v => v.conductor == conductorSeleccionado.username) ||
                           vehiculos.find(v => v.conductor == conductorSeleccionado.nombre_completo)
    
    console.log('Vehículo encontrado:', vehiculoConductor)
    
    if (!vehiculoConductor) {
      alert(`Error: El conductor ${conductorSeleccionado.nombre_completo} no tiene un vehículo asignado`)
      console.log('Conductor ID buscado:', conductorSeleccionado.id)
      console.log('Vehículos disponibles:', vehiculos.map(v => ({id: v.id, placa: v.placa, conductor_id: v.conductor_id, conductor: v.conductor})))
      return
    }

    try {
      setLoading(true)
      
      const salidaData = {
        ...formSalida,
        vehiculo_id: vehiculoConductor.id
      }
      
      console.log('Datos a enviar:', salidaData)
      
      const response = await fetch('http://192.168.80.175:8000/api/salidas/crear/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salidaData)
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        cargarRutas()
        cerrarModales()
      } else {
        alert(data.error || 'Error al crear la salida')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la salida')
    } finally {
      setLoading(false)
    }
  }

  const toggleEstadoRuta = async (rutaId) => {
    if (!confirm('¿Está seguro de cambiar el estado de la ruta?')) {
      return
    }

    try {
      const response = await fetch(`http://192.168.80.175:8000/api/rutas/${rutaId}/toggle-estado/`, {
        method: 'PUT',
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        cargarRutas()
      } else {
        alert(data.error || 'Error al cambiar el estado')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar el estado de la ruta')
    }
  }

  const eliminarRuta = async (rutaId) => {
    if (!confirm('¿Está seguro de eliminar esta ruta? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`http://192.168.80.175:8000/api/rutas/${rutaId}/eliminar/`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        cargarRutas()
      } else {
        alert(data.error || 'Error al eliminar la ruta')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la ruta')
    }
  }

  const cancelarSalida = async (salidaId) => {
    if (!confirm('¿Está seguro de cancelar esta salida?')) {
      return
    }

    try {
      const response = await fetch(`http://192.168.80.175:8000/api/salidas/${salidaId}/cancelar/`, {
        method: 'PUT',
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        cargarSalidas()
      } else {
        alert(data.error || 'Error al cancelar la salida')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cancelar la salida')
    }
  }

  const formatearTiempo = (tiempo) => {
    // Convertir "1:30:00" a "1h 30m"
    const parts = tiempo.split(':')
    const horas = parseInt(parts[0])
    const minutos = parseInt(parts[1])
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}m`
    } else if (horas > 0) {
      return `${horas}h`
    } else {
      return `${minutos}m`
    }
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            {onVolver && (
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={onVolver}
                style={{ borderRadius: '12px' }}
              >
                ← Volver al Dashboard
              </button>
            )}
            <div className="flex-grow-1 text-center">
              <h2 className="mb-1" style={{ color: '#1e293b', fontWeight: '700' }}>
                🛣️ Gestión de Rutas
              </h2>
              <p className="text-muted mb-0">Administra las rutas y programa salidas</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-info d-flex align-items-center gap-2"
                onClick={() => setMostrarSalidas(!mostrarSalidas)}
                style={{
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontWeight: '600'
                }}
              >
                <span>📅</span>
                <span>{mostrarSalidas ? 'Ocultar' : 'Ver'} Salidas</span>
              </button>
              <button 
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={() => abrirModalSalida()}
                style={{
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontWeight: '600'
                }}
              >
                <span>🚀</span>
                <span>Nueva Salida</span>
              </button>
              <button 
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => abrirModal()}
                style={{
                  background: 'linear-gradient(135deg, #007bff, #0056b3)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
                }}
              >
                <span>➕</span>
                <span>Nueva Ruta</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando rutas...</p>
        </div>
      )}

      {/* Tabla de salidas */}
      {mostrarSalidas && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="card-header bg-info text-white" style={{ borderRadius: '16px 16px 0 0' }}>
                <h5 className="mb-0">📅 Salidas Programadas</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="border-0 px-4 py-3">Fecha/Hora</th>
                        <th className="border-0 px-4 py-3">Ruta</th>
                        <th className="border-0 px-4 py-3">Conductor</th>
                        <th className="border-0 px-4 py-3">Vehículo</th>
                        <th className="border-0 px-4 py-3">Estado</th>
                        <th className="border-0 px-4 py-3">Pasajeros</th>
                        <th className="border-0 px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salidas.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div style={{ color: '#6c757d' }}>
                              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
                              <p className="mb-0">No hay salidas programadas</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        salidas.map(salida => (
                          <tr key={salida.id}>
                            <td className="px-4 py-3">
                              <div className="fw-semibold">{salida.fecha_hora}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="fw-semibold">{salida.ruta.nombre}</div>
                                <small className="text-muted">{salida.ruta.origen} → {salida.ruta.destino}</small>
                              </div>
                            </td>
                            <td className="px-4 py-3">{salida.conductor.nombre}</td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="fw-semibold">{salida.vehiculo.placa}</div>
                                <small className="text-muted">Cap: {salida.vehiculo.capacidad}</small>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${
                                salida.estado === 'programada' ? 'bg-primary' :
                                salida.estado === 'en_curso' ? 'bg-warning' :
                                salida.estado === 'completada' ? 'bg-success' : 'bg-danger'
                              } rounded-pill`}>
                                {salida.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <span className="fw-semibold">{salida.pasajeros_count}/{salida.vehiculo.capacidad}</span>
                                <br />
                                <small className="text-muted">{salida.encomiendas_count} encomiendas</small>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {salida.estado === 'programada' && (
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => cancelarSalida(salida.id)}
                                  style={{ borderRadius: '6px', fontSize: '11px' }}
                                >
                                  ❌ Cancelar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de rutas */}
      {!loading && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                      <tr>
                        <th className="border-0 px-4 py-3 fw-semibold">Ruta</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Origen → Destino</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Distancia</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Tiempo</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Precio Pasaje</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Precio/Kg</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Salidas</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Estado</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rutas.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-5">
                            <div style={{ color: '#6c757d' }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛣️</div>
                              <h5 className="mb-2">No hay rutas registradas</h5>
                              <p className="mb-0">Crea la primera ruta para comenzar</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rutas.map(ruta => (
                          <tr key={ruta.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center">
                                <div className="me-3" style={{
                                  width: '44px',
                                  height: '44px',
                                  background: ruta.activa 
                                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                                    : 'linear-gradient(135deg, #6c757d, #495057)',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '18px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                  🛣️
                                </div>
                                <div>
                                  <div className="fw-semibold" style={{ color: '#1e293b' }}>
                                    {ruta.nombre}
                                  </div>
                                  <small className="text-muted">ID: {ruta.id}</small>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="fw-semibold">{ruta.origen}</div>
                                <div className="text-muted small">↓</div>
                                <div className="fw-semibold">{ruta.destino}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted">{ruta.distancia_km} km</td>
                            <td className="px-4 py-3 text-muted">{formatearTiempo(ruta.tiempo_estimado)}</td>
                            <td className="px-4 py-3">
                              <span className="badge bg-success rounded-pill">
                                S/ {ruta.precio_pasaje}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="badge bg-info rounded-pill">
                                S/ {ruta.precio_encomienda_kg}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${ruta.salidas_programadas > 0 ? 'bg-primary' : 'bg-secondary'} rounded-pill`}>
                                {ruta.salidas_programadas} programadas
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${ruta.activa ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                {ruta.activa ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="d-flex gap-1 flex-wrap">
                                <button 
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => abrirModalSalida(ruta)}
                                  style={{ borderRadius: '6px', fontSize: '11px' }}
                                  title="Programar salida"
                                >
                                  🚀
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => abrirModal(ruta)}
                                  style={{ borderRadius: '6px', fontSize: '11px' }}
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button 
                                  className={`btn btn-sm ${ruta.activa ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                  onClick={() => toggleEstadoRuta(ruta.id)}
                                  style={{ borderRadius: '6px', fontSize: '11px' }}
                                  title={ruta.activa ? 'Desactivar' : 'Activar'}
                                >
                                  {ruta.activa ? '🔒' : '🔓'}
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => eliminarRuta(ruta.id)}
                                  style={{ borderRadius: '6px', fontSize: '11px' }}
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ruta */}
      {mostrarModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <h5 className="modal-title fw-bold">
                  {rutaEditando ? '✏️ Editar Ruta' : '➕ Nueva Ruta'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={cerrarModales}
                ></button>
              </div>
              <form onSubmit={guardarRuta}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre de la Ruta *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Ruta Mina Norte"
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Origen *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="origen"
                        value={formData.origen}
                        onChange={handleInputChange}
                        required
                        placeholder="Ciudad de origen"
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Destino *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="destino"
                        value={formData.destino}
                        onChange={handleInputChange}
                        required
                        placeholder="Ciudad de destino"
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Distancia (km) *</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        name="distancia_km"
                        value={formData.distancia_km}
                        onChange={handleInputChange}
                        required
                        placeholder="125.5"
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Tiempo Estimado *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="tiempo_estimado"
                        value={formData.tiempo_estimado}
                        onChange={handleInputChange}
                        required
                        placeholder="2:30 o 150 (minutos)"
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                      <small className="text-muted">Formato: HH:MM o solo minutos</small>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Precio Pasaje (S/) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="precio_pasaje"
                        value={formData.precio_pasaje}
                        onChange={handleInputChange}
                        required
                        placeholder="15.00"
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Precio Encomienda/Kg (S/) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="precio_encomienda_kg"
                        value={formData.precio_encomienda_kg}
                        onChange={handleInputChange}
                        required
                        placeholder="2.50"
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={cerrarModales}
                    style={{ borderRadius: '8px', padding: '10px 20px' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #007bff, #0056b3)',
                      border: 'none'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        {rutaEditando ? '💾 Actualizar' : '➕ Crear'} Ruta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nueva Salida */}
      {mostrarModalSalida && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <h5 className="modal-title fw-bold">🚀 Programar Nueva Salida</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={cerrarModales}
                ></button>
              </div>
              <form onSubmit={crearSalida}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Ruta *</label>
                    <select
                      className="form-select"
                      name="ruta_id"
                      value={formSalida.ruta_id}
                      onChange={handleSalidaChange}
                      required
                      style={{ borderRadius: '8px', padding: '12px' }}
                    >
                      <option value="">Seleccione una ruta</option>
                      {rutas.filter(r => r.activa).map(ruta => (
                        <option key={ruta.id} value={ruta.id}>
                          {ruta.nombre} ({ruta.origen} → {ruta.destino})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Conductor (con vehículo asignado) *</label>
                    <select
                      className="form-select"
                      name="conductor_id"
                      value={formSalida.conductor_id}
                      onChange={handleSalidaChange}
                      required
                      style={{ borderRadius: '8px', padding: '12px' }}
                    >
                      <option value="">Seleccione un conductor</option>
                      {conductores.map(conductor => {
                        const vehiculoAsignado = vehiculos.find(v => v.conductor_id === conductor.id)
                        return (
                          <option key={conductor.id} value={conductor.id}>
                            {conductor.nombre_completo} - {vehiculoAsignado ? `${vehiculoAsignado.placa} (${vehiculoAsignado.marca})` : 'Sin vehículo'}
                          </option>
                        )
                      })}
                    </select>
                    <small className="text-muted">Solo se muestran conductores con vehículo asignado</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Fecha y Hora *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="fecha_hora"
                      value={formSalida.fecha_hora}
                      onChange={handleSalidaChange}
                      required
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={cerrarModales}
                    style={{ borderRadius: '8px', padding: '10px 20px' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loading}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '10px 20px'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Programando...
                      </>
                    ) : (
                      <>
                        🚀 Programar Salida
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionRutas