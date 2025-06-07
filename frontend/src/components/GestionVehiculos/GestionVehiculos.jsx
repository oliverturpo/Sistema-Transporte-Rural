import { useState, useEffect } from 'react'
import axios from 'axios'

function GestionVehiculos({ onVolver }) {
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    capacidad: 8,
    conductor_id: '',
    estado: 'activo'
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [vehiculosRes, conductoresRes] = await Promise.all([
        axios.get('http://192.168.1.44:8000/api/vehiculos/'),
        axios.get('http://192.168.1.44:8000/api/conductores/')
      ])
      
      setVehiculos(vehiculosRes.data)
      setConductores(conductoresRes.data)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const limpiarForm = () => {
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      capacidad: 8,
      conductor_id: '',
      estado: 'activo'
    })
    setEditando(null)
  }

  const abrirModal = (vehiculo = null) => {
    if (vehiculo) {
      setFormData({
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        año: vehiculo.año,
        capacidad: vehiculo.capacidad,
        conductor_id: vehiculo.conductor_id || '',
        estado: vehiculo.estado
      })
      setEditando(vehiculo)
    } else {
      limpiarForm()
    }
    setShowModal(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    limpiarForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.placa || !formData.marca || !formData.modelo) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      const dataToSend = {
        placa: formData.placa.toUpperCase(),
        marca: formData.marca,
        modelo: formData.modelo,
        año: formData.año,
        capacidad: formData.capacidad,
        conductor_id: formData.conductor_id || null,
        estado: formData.estado
      }

      if (editando) {
        // EDITAR - URL CORREGIDA
        await axios.put(`http://192.168.1.44:8000/api/vehiculos/${editando.id}/actualizar/`, dataToSend)
        alert('Vehículo actualizado correctamente')
      } else {
        // CREAR - URL EXISTENTE
        await axios.post('http://192.168.1.44:8000/api/vehiculos/crear/', dataToSend)
        alert('Vehículo registrado correctamente')
      }
      
      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error al guardar:', error)
      alert(error.response?.data?.error || 'Error al guardar el vehículo')
    }
  }

  const eliminarVehiculo = async (vehiculo) => {
    if (!confirm(`¿Estás seguro de eliminar el vehículo ${vehiculo.placa}?`)) return

    try {
      // ELIMINAR - URL CORREGIDA
      await axios.delete(`http://192.168.1.44:8000/api/vehiculos/${vehiculo.id}/eliminar/`)
      alert('Vehículo eliminado correctamente')
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error.response?.data?.error || 'Error al eliminar el vehículo')
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      activo: { class: 'bg-success', text: '🟢 Activo' },
      mantenimiento: { class: 'bg-warning', text: '🟡 Mantenimiento' },
      inactivo: { class: 'bg-danger', text: '🔴 Inactivo' }
    }
    return estados[estado] || estados.activo
  }

  const getConductorInfo = (vehiculo) => {
    if (!vehiculo.conductor_id) {
      return { nombre: 'Sin asignar', telefono: '' }
    }
    
    const conductor = conductores.find(c => c.id === vehiculo.conductor_id)
    return {
      nombre: conductor?.nombre_completo || vehiculo.conductor || 'Sin asignar',
      telefono: conductor?.telefono || ''
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-muted">Cargando vehículos...</h4>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button 
            className="btn btn-outline-secondary"
            onClick={onVolver}
            style={{ borderRadius: '12px' }}
          >
            ← Volver al Dashboard
          </button>
          <h1 className="h3 fw-bold text-primary mb-0">🚛 Gestión de Vehículos</h1>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => abrirModal()}
          style={{ borderRadius: '12px' }}
        >
          + Agregar Vehículo
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body text-center">
              <h3 className="text-primary fw-bold">{vehiculos.length}</h3>
              <p className="mb-0 text-muted">Total Vehículos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body text-center">
              <h3 className="text-success fw-bold">
                {vehiculos.filter(v => v.estado === 'activo').length}
              </h3>
              <p className="mb-0 text-muted">Activos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body text-center">
              <h3 className="text-warning fw-bold">
                {vehiculos.filter(v => v.estado === 'mantenimiento').length}
              </h3>
              <p className="mb-0 text-muted">Mantenimiento</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body text-center">
              <h3 className="text-info fw-bold">
                {vehiculos.reduce((sum, v) => sum + v.capacidad, 0)}
              </h3>
              <p className="mb-0 text-muted">Capacidad Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de vehículos */}
      <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
        <div className="card-header bg-white border-0" style={{ borderRadius: '20px 20px 0 0' }}>
          <h5 className="fw-bold mb-0">📋 Lista de Vehículos</h5>
        </div>
        <div className="card-body p-0">
          {vehiculos.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Placa</th>
                    <th>Vehículo</th>
                    <th>Año</th>
                    <th>Capacidad</th>
                    <th>Conductor Asignado</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((vehiculo) => {
                    const conductorInfo = getConductorInfo(vehiculo)
                    return (
                      <tr key={vehiculo.id}>
                        <td>
                          <span className="fw-bold text-primary">{vehiculo.placa}</span>
                        </td>
                        <td>
                          <div>
                            <strong>{vehiculo.marca} {vehiculo.modelo}</strong>
                          </div>
                        </td>
                        <td>{vehiculo.año}</td>
                        <td>
                          <span className="badge bg-info">{vehiculo.capacidad} personas</span>
                        </td>
                        <td>
                          {conductorInfo.nombre !== 'Sin asignar' ? (
                            <div>
                              <strong>{conductorInfo.nombre}</strong>
                              {conductorInfo.telefono && (
                                <>
                                  <br />
                                  <small className="text-muted">📞 {conductorInfo.telefono}</small>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">Sin asignar</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getEstadoBadge(vehiculo.estado).class}`}>
                            {getEstadoBadge(vehiculo.estado).text}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => abrirModal(vehiculo)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => eliminarVehiculo(vehiculo)}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚛</div>
              <h4 className="text-muted mb-3">No hay vehículos registrados</h4>
              <p className="text-muted">Agrega el primer vehículo a tu flota</p>
              <button 
                className="btn btn-primary"
                onClick={() => abrirModal()}
              >
                + Agregar Primer Vehículo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar vehículo */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  {editando ? '✏️ Editar Vehículo' : '+ Agregar Nuevo Vehículo'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={cerrarModal}
                ></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    
                    {/* Placa */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Placa del Vehículo *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={formData.placa}
                        onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                        placeholder="ABC-123"
                        maxLength="10"
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>

                    {/* Marca */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Marca *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={formData.marca}
                        onChange={(e) => setFormData({...formData, marca: e.target.value})}
                        placeholder="Toyota, Nissan, etc."
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>

                    {/* Modelo */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Modelo *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={formData.modelo}
                        onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                        placeholder="Hilux, Pickup, etc."
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>

                    {/* Año */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Año *</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={formData.año}
                        onChange={(e) => setFormData({...formData, año: parseInt(e.target.value)})}
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>

                    {/* Capacidad */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Capacidad (personas) *</label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.capacidad}
                        onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value)})}
                        required
                        style={{ borderRadius: '12px' }}
                      >
                        {[...Array(16)].map((_, i) => (
                          <option key={i + 5} value={i + 5}>{i + 5} personas</option>
                        ))}
                      </select>
                    </div>

                    {/* Conductor */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Conductor Asignado</label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.conductor_id}
                        onChange={(e) => setFormData({...formData, conductor_id: e.target.value})}
                        style={{ borderRadius: '12px' }}
                      >
                        <option value="">Sin asignar</option>
                        {conductores.map((conductor) => (
                          <option key={conductor.id} value={conductor.id}>
                            {conductor.nombre_completo} - {conductor.telefono}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estado */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">Estado del Vehículo</label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        style={{ borderRadius: '12px' }}
                      >
                        <option value="activo">🟢 Activo</option>
                        <option value="mantenimiento">🟡 En Mantenimiento</option>
                        <option value="inactivo">🔴 Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    {editando ? 'Actualizar Vehículo' : 'Registrar Vehículo'}
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

export default GestionVehiculos