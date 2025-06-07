import { useState, useEffect } from 'react'
import axios from 'axios'
import VentaPasajes from './components/VentaPasajes/VentaPasajes'
import GestionVehiculos from './components/GestionVehiculos/GestionVehiculos'
import GestionConductores from './components/GestionConductores/GestionConductores'
import GestionRutas from './components/GestionRutas/GestionRutas'

function DashboardAdmin() {
  const [salidasHoy, setSalidasHoy] = useState([])
  const [todasLasSalidas, setTodasLasSalidas] = useState([])  // ← NUEVA VARIABLE
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    salidasHoy: 0,
    pasajerosTotal: 0,
    ingresosHoy: 0,
    encomiendas: 0,
    salidasProgramadas: 0  // ← NUEVA ESTADÍSTICA
  })

  const [vistaActual, setVistaActual] = useState('dashboard')
  const [mostrarTodasSalidas, setMostrarTodasSalidas] = useState(false)  // ← NUEVA VARIABLE

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [salidasHoyRes, todasSalidasRes, vehiculosRes] = await Promise.all([
        axios.get('http://192.168.1.44:8000/api/salidas-hoy/'),
        axios.get('http://192.168.1.44:8000/api/salidas/'),  // ← NUEVA API CALL
        axios.get('http://192.168.1.44:8000/api/vehiculos/')
      ])
      
      setSalidasHoy(salidasHoyRes.data)
      setTodasLasSalidas(todasSalidasRes.data)  // ← GUARDAR TODAS LAS SALIDAS
      setVehiculos(vehiculosRes.data)
      
      // Calcular estadísticas
      const pasajerosTotal = salidasHoyRes.data.reduce((sum, salida) => sum + salida.ocupados, 0)
      const ingresos = pasajerosTotal * 15 // Precio promedio
      
      setStats({
        salidasHoy: salidasHoyRes.data.length,
        pasajerosTotal: pasajerosTotal,
        ingresosHoy: ingresos,
        encomiendas: Math.floor(Math.random() * 20) + 5, // Simulado
        salidasProgramadas: todasSalidasRes.data.filter(s => s.estado === 'programada').length  // ← NUEVA ESTADÍSTICA
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funciones que faltan
  const getStatusColor = (salida) => {
    const ocupacion = salida.ocupados / salida.capacidad
    if (ocupacion >= 1) return '🔴'
    if (ocupacion > 0.5) return '🟡'
    return '🟢'
  }

  const getStatusColorSalida = (salida) => {
    if (salida.estado === 'programada') return 'primary'
    if (salida.estado === 'en_curso') return 'warning'
    if (salida.estado === 'completada') return 'success'
    if (salida.estado === 'cancelada') return 'danger'
    return 'secondary'
  }

  // Si está en venta de pasajes, mostrar ese componente
  if (vistaActual === 'venta-pasajes') {
    return <VentaPasajes onVolver={() => setVistaActual('dashboard')} />
  }

  if (vistaActual === 'gestion-vehiculos') {
    return <GestionVehiculos onVolver={() => setVistaActual('dashboard')} />
  }

  if (vistaActual === 'gestion-conductores') {
    return <GestionConductores onVolver={() => setVistaActual('dashboard')} />
  }

  if (vistaActual === 'gestion-rutas') {
    return <GestionRutas onVolver={() => setVistaActual('dashboard')} />
  }

  const getStatusText = (salida) => {
    const ocupacion = salida.ocupados / salida.capacidad
    if (ocupacion >= 1) return '🔴 COMPLETO'
    if (ocupacion > 0.5) return '🟡 EN CURSO'
    return '🟢 DISPONIBLE'
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
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-muted">Cargando Dashboard...</h4>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh'
    }}>
      
      {/* HERO SECTION */}
      <div className="text-center py-5">
        <h1 className="display-4 fw-bold text-primary mb-2">📊 Dashboard del Día</h1>
        <p className="lead text-muted">{formatTime()}</p>
      </div>

      {/* KPI CARDS CON BOOTSTRAP */}
      <div className="row g-4 mb-5">
        {/* Salidas Hoy */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-lg h-100" 
               style={{
                 background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                 borderRadius: '20px',
                 transform: 'translateY(0)',
                 transition: 'transform 0.3s ease'
               }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-body text-white text-center p-4 position-relative">
              <div className="position-absolute top-0 end-0 me-3 mt-2" 
                   style={{ fontSize: '4rem', opacity: '0.2' }}>📅</div>
              <h2 className="display-3 fw-bold mb-2 position-relative">{stats.salidasHoy}</h2>
              <h5 className="card-title mb-2 position-relative">Salidas Hoy</h5>
              <small className="opacity-75 position-relative">📈 {stats.salidasProgramadas} programadas total</small>
            </div>
          </div>
        </div>

        {/* Pasajeros */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-lg h-100" 
               style={{
                 background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                 borderRadius: '20px',
                 transform: 'translateY(0)',
                 transition: 'transform 0.3s ease'
               }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-body text-white text-center p-4 position-relative">
              <div className="position-absolute top-0 end-0 me-3 mt-2" 
                   style={{ fontSize: '4rem', opacity: '0.2' }}>👥</div>
              <h2 className="display-3 fw-bold mb-2 position-relative">{stats.pasajerosTotal}</h2>
              <h5 className="card-title mb-2 position-relative">Pasajeros Transportados</h5>
              <small className="opacity-75 position-relative">🎯 85% ocupación</small>
            </div>
          </div>
        </div>

        {/* Ingresos */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-lg h-100" 
               style={{
                 background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                 borderRadius: '20px',
                 transform: 'translateY(0)',
                 transition: 'transform 0.3s ease'
               }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-body text-white text-center p-4 position-relative">
              <div className="position-absolute top-0 end-0 me-3 mt-2" 
                   style={{ fontSize: '4rem', opacity: '0.2' }}>💰</div>
              <h2 className="display-3 fw-bold mb-2 position-relative">S/{stats.ingresosHoy}</h2>
              <h5 className="card-title mb-2 position-relative">Ingresos del Día</h5>
              <small className="opacity-75 position-relative">💎 Meta: S/1200</small>
            </div>
          </div>
        </div>

        {/* Encomiendas */}
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-lg h-100" 
               style={{
                 background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                 borderRadius: '20px',
                 transform: 'translateY(0)',
                 transition: 'transform 0.3s ease'
               }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-body text-white text-center p-4 position-relative">
              <div className="position-absolute top-0 end-0 me-3 mt-2" 
                   style={{ fontSize: '4rem', opacity: '0.2' }}>📦</div>
              <h2 className="display-3 fw-bold mb-2 position-relative">{stats.encomiendas}</h2>
              <h5 className="card-title mb-2 position-relative">Encomiendas Activas</h5>
              <small className="opacity-75 position-relative">🚚 8 en tránsito</small>
            </div>
          </div>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS CON BOOTSTRAP */}
      <div className="card border-0 shadow-lg mb-5" style={{ borderRadius: '20px' }}>
        <div className="card-body p-4">
          <h3 className="text-center fw-bold mb-4">🚀 Acciones Rápidas</h3>
          
          <div className="row g-3">
            {[
              { icon: '🎫', title: 'Vender Pasaje', desc: 'Nueva venta', color: 'primary', action: () => setVistaActual('venta-pasajes') },
              { icon: '📦', title: 'Nueva Encomienda', desc: 'Registrar envío', color: 'success', action: () => alert('Próximamente') },
              { icon: '🚛', title: 'Programar Salida', desc: 'Nueva ruta', color: 'warning', action: () => setVistaActual('gestion-rutas') },
              { icon: '🛣️', title: 'Rutas', desc: 'Gestionar rutas', color: 'info', action: () => setVistaActual('gestion-rutas') },
              { icon: '👨‍💼', title: 'Conductores', desc: 'Gestionar conductores', color: 'danger', action: () => setVistaActual('gestion-conductores') },
              { icon: '🚛', title: 'Vehículos', desc: 'Gestionar flota', color: 'secondary', action: () => setVistaActual('gestion-vehiculos') }
            ].map((action, index) => (
              <div key={index} className="col-lg-2 col-md-4 col-sm-6">
                <button 
                  onClick={action.action}
                  className={`btn btn-outline-${action.color} w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center`}
                  style={{
                    minHeight: '120px',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {action.icon}
                  </div>
                  <div className="fw-bold small">{action.title}</div>
                  <small className="text-muted">{action.desc}</small>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SALIDAS PROGRAMADAS */}
      <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center" 
             style={{ borderRadius: '20px 20px 0 0' }}>
          <h3 className="fw-bold mb-0">
            📅 {mostrarTodasSalidas ? 'Todas las Salidas' : 'Salidas de Hoy'}
          </h3>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-info"
              onClick={() => setMostrarTodasSalidas(!mostrarTodasSalidas)}
            >
              {mostrarTodasSalidas ? '📅 Solo Hoy' : '📋 Ver Todas'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setVistaActual('gestion-rutas')}
            >
              + Nueva Salida
            </button>
            <button className="btn btn-outline-secondary" onClick={loadDashboardData}>🔄</button>
          </div>
        </div>
        
        <div className="card-body p-4">
          {/* MOSTRAR SALIDAS SEGÚN LA VISTA SELECCIONADA */}
          {(mostrarTodasSalidas ? todasLasSalidas : salidasHoy).length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {(mostrarTodasSalidas ? todasLasSalidas : salidasHoy).map((salida, index) => {
                // Para salidas de hoy (formato anterior)
                if (!mostrarTodasSalidas) {
                  const status = getStatusColor(salida)
                  return (
                    <div
                      key={index}
                      className={`alert alert-${status === '🟢' ? 'success' : status === '🟡' ? 'warning' : 'secondary'} border-0 shadow-sm`}
                      style={{
                        borderRadius: '16px',
                        transition: 'transform 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <h4 className="fw-bold mb-0">{salida.hora}</h4>
                        </div>
                        <div className="col">
                          <h5 className="mb-1">{salida.ruta}</h5>
                          <small>🚛 {salida.vehiculo} • 👨‍✈️ {salida.conductor}</small>
                        </div>
                        <div className="col-auto">
                          <span className="badge bg-light text-dark fs-6">
                            {salida.ocupados}/{salida.capacidad} pasajeros
                          </span>
                        </div>
                        <div className="col-auto">
                          <span style={{ fontSize: '1.5rem' }}>
                            {getStatusText(salida)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  // Para todas las salidas (formato nuevo)
                  return (
                    <div
                      key={salida.id}
                      className={`alert alert-${getStatusColorSalida(salida)} border-0 shadow-sm`}
                      style={{
                        borderRadius: '16px',
                        transition: 'transform 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <h5 className="fw-bold mb-0">{salida.fecha_hora}</h5>
                        </div>
                        <div className="col">
                          <h5 className="mb-1">{salida.ruta.nombre}</h5>
                          <small>📍 {salida.ruta.origen} → {salida.ruta.destino}</small>
                          <br />
                          <small>🚛 {salida.vehiculo.placa} • 👨‍✈️ {salida.conductor.nombre}</small>
                        </div>
                        <div className="col-auto">
                          <div className="text-center">
                            <div className="fw-bold">{salida.pasajeros_count}/{salida.vehiculo.capacidad}</div>
                            <small className="text-muted">pasajeros</small>
                          </div>
                        </div>
                        <div className="col-auto">
                          <div className="text-center">
                            <div className="fw-bold">{salida.encomiendas_count}</div>
                            <small className="text-muted">encomiendas</small>
                          </div>
                        </div>
                        <div className="col-auto">
                          <span className={`badge bg-${getStatusColorSalida(salida)} fs-6`}>
                            {salida.estado.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚛</div>
              <h4 className="fw-bold text-muted mb-3">
                {mostrarTodasSalidas ? 'No hay salidas programadas' : 'No hay salidas programadas para hoy'}
              </h4>
              <p className="text-muted">Programa la primera salida del día</p>
              <button 
                className="btn btn-primary"
                onClick={() => setVistaActual('gestion-rutas')}
              >
                + Programar Salida
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin