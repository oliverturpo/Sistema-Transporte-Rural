import { useState, useEffect } from 'react'

const GestionConductores = ({ onVolver }) => {
  const [conductores, setConductores] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [conductorEditando, setConductorEditando] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    telefono: ''
  })

  useEffect(() => {
    cargarConductores()
  }, [])

  const cargarConductores = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://192.168.1.44:8000/api/conductores/lista/')
      const data = await response.json()
      setConductores(data)
    } catch (error) {
      console.error('Error al cargar conductores:', error)
      alert('Error al cargar la lista de conductores')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const abrirModal = (conductor = null) => {
    if (conductor) {
      // Modo edición
      setConductorEditando(conductor)
      const nombres = conductor.nombre_completo.split(' ')
      const first_name = nombres[0] || ''
      const last_name = nombres.slice(1).join(' ') || ''
      
      setFormData({
        username: conductor.username,
        password: '',
        first_name: first_name,
        last_name: last_name,
        email: conductor.email,
        telefono: conductor.telefono === 'No registrado' ? '' : conductor.telefono
      })
    } else {
      // Modo creación
      setConductorEditando(null)
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        telefono: ''
      })
    }
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setConductorEditando(null)
  }

  const guardarConductor = async (e) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    if (!conductorEditando && !formData.password) {
      alert('La contraseña es obligatoria para nuevos conductores')
      return
    }

    if (!conductorEditando && !formData.username) {
      alert('El nombre de usuario es obligatorio')
      return
    }

    try {
      setLoading(true)
      
      const url = conductorEditando 
        ? `http://192.168.1.44:8000/api/conductores/${conductorEditando.id}/actualizar/`
        : 'http://192.168.1.44:8000/api/conductores/registrar/'
      
      const method = conductorEditando ? 'PUT' : 'POST'
      
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
        cargarConductores()
        cerrarModal()
      } else {
        alert(data.error || 'Error al guardar el conductor')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el conductor')
    } finally {
      setLoading(false)
    }
  }

  const toggleEstadoConductor = async (conductorId) => {
    if (!confirm('¿Está seguro de cambiar el estado del conductor?')) {
      return
    }

    try {
      const response = await fetch(`http://192.168.1.44:8000/api/conductores/${conductorId}/toggle-estado/`, {
        method: 'PUT',
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        cargarConductores()
      } else {
        alert(data.error || 'Error al cambiar el estado')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar el estado del conductor')
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
          <div className="flex-grow-1"></div>
            <div>
              <h2 className="mb-1" style={{ color: '#1e293b', fontWeight: '700' }}>
                🚛 Gestión de Conductores
              </h2>
              <p className="text-muted mb-0">Administra los conductores del sistema</p>
            </div>
            <button 
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => abrirModal()}
              style={{
                background: 'linear-gradient(135deg, #007bff, #0056b3)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)'
              }}
            >
              <span>➕</span>
              <span>Nuevo Conductor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando conductores...</p>
        </div>
      )}

      {/* Tabla de conductores */}
      {!loading && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                      <tr>
                        <th className="border-0 px-4 py-3 fw-semibold">Conductor</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Username</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Email</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Teléfono</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Vehículos</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Registro</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Estado</th>
                        <th className="border-0 px-4 py-3 fw-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conductores.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div style={{ color: '#6c757d' }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚛</div>
                              <h5 className="mb-2">No hay conductores registrados</h5>
                              <p className="mb-0">Haz clic en "Nuevo Conductor" para agregar el primero</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        conductores.map(conductor => (
                          <tr key={conductor.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center">
                                <div className="me-3" style={{
                                  width: '44px',
                                  height: '44px',
                                  background: conductor.is_active 
                                    ? 'linear-gradient(135deg, #28a745, #20c997)' 
                                    : 'linear-gradient(135deg, #6c757d, #495057)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '18px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                  🚛
                                </div>
                                <div>
                                  <div className="fw-semibold" style={{ color: '#1e293b' }}>
                                    {conductor.nombre_completo}
                                  </div>
                                  <small className="text-muted">ID: {conductor.id}</small>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <code className="bg-light px-2 py-1 rounded" style={{ fontSize: '13px' }}>
                                {conductor.username}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-muted">{conductor.email}</td>
                            <td className="px-4 py-3 text-muted">{conductor.telefono}</td>
                            <td className="px-4 py-3">
                              <span className={`badge ${conductor.vehiculos_asignados > 0 ? 'bg-success' : 'bg-secondary'} rounded-pill`}>
                                {conductor.vehiculos_asignados} vehículos
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <small className="text-muted">{conductor.fecha_registro}</small>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${conductor.is_active ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                {conductor.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="d-flex gap-2">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => abrirModal(conductor)}
                                  style={{ borderRadius: '8px', fontSize: '12px' }}
                                >
                                  ✏️ Editar
                                </button>
                                <button 
                                  className={`btn btn-sm ${conductor.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                  onClick={() => toggleEstadoConductor(conductor.id)}
                                  style={{ borderRadius: '8px', fontSize: '12px' }}
                                >
                                  {conductor.is_active ? '🔒 Desactivar' : '🔓 Activar'}
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

      {/* Modal */}
      {mostrarModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <h5 className="modal-title fw-bold">
                  {conductorEditando ? '✏️ Editar Conductor' : '➕ Nuevo Conductor'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={cerrarModal}
                ></button>
              </div>
              <form onSubmit={guardarConductor}>
                <div className="modal-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Nombres *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Apellidos *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required={!conductorEditando}
                      disabled={conductorEditando}
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                    {conductorEditando && (
                      <small className="text-muted">El username no se puede modificar</small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Contraseña {!conductorEditando && '*'}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!conductorEditando}
                      placeholder={conductorEditando ? 'Dejar vacío para mantener la actual' : 'Ingrese la contraseña'}
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="Ej: +51 999 999 999"
                      style={{ borderRadius: '8px', padding: '12px' }}
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={cerrarModal}
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
                        {conductorEditando ? '💾 Actualizar' : '➕ Crear'} Conductor
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

export default GestionConductores