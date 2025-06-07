import { useState, useEffect } from 'react'
// Importar jsPDF para generar PDFs reales
import jsPDF from 'jspdf'

function VentaPasajes({ onVolver }) {
  const [pasoActual, setPasoActual] = useState(1)
  const [salidas, setSalidas] = useState([])
  const [salidaSeleccionada, setSalidaSeleccionada] = useState(null)
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null)
  const [asientosOcupados, setAsientosOcupados] = useState([])
  const [loading, setLoading] = useState(true)
  const [ventaCompletada, setVentaCompletada] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    montoRecibido: ''
  })

  // Cargar salidas disponibles
  useEffect(() => {
    cargarSalidas()
  }, [])

  const cargarSalidas = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://192.168.1.44:8000/api/salidas-disponibles/')
      const data = await response.json()
      
      // Calcular saldo total por salida para el chofer
      const salidasConSaldo = await Promise.all(
        data.map(async (salida) => {
          try {
            const pasajesRes = await fetch(`http://192.168.1.44:8000/api/salida/${salida.id}/pasajes/`)
            const pasajesData = await pasajesRes.json()
            const saldoTotal = pasajesData.pasajes?.reduce((sum, p) => sum + parseFloat(p.precio), 0) || 0
            
            return {
              ...salida,
              saldoTotal: saldoTotal,
              totalPasajeros: pasajesData.pasajes?.length || 0
            }
          } catch (error) {
            return { ...salida, saldoTotal: 0, totalPasajeros: 0 }
          }
        })
      )
      
      setSalidas(salidasConSaldo)
    } catch (error) {
      console.error('Error al cargar salidas:', error)
      alert('Error al cargar salidas disponibles')
    } finally {
      setLoading(false)
    }
  }

  // Cargar asientos ocupados cuando se selecciona una salida
  useEffect(() => {
    if (salidaSeleccionada) {
      cargarAsientosOcupados()
    }
  }, [salidaSeleccionada])

  const cargarAsientosOcupados = async () => {
    try {
      const response = await fetch(`http://192.168.1.44:8000/api/salida/${salidaSeleccionada.id}/pasajes/`)
      const data = await response.json()
      setAsientosOcupados(data.asientos_ocupados || [])
    } catch (error) {
      console.error('Error al cargar asientos:', error)
    }
  }

  const handleInputChange = (e) => {
    let value = e.target.value
    
    // Normalizar nombre a mayúsculas
    if (e.target.name === 'nombre') {
      value = value.toUpperCase()
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const calcularVuelto = () => {
    const recibido = parseFloat(formData.montoRecibido) || 0
    const precio = parseFloat(salidaSeleccionada?.precio) || 0
    return recibido - precio
  }

  const validarFormulario = () => {
    if (!formData.nombre || formData.nombre.length < 3) {
      alert('El nombre debe tener al menos 3 caracteres')
      return false
    }
    if (!formData.dni || formData.dni.length !== 8) {
      alert('El DNI debe tener 8 dígitos')
      return false
    }
    
    const montoRecibido = parseFloat(formData.montoRecibido)
    const precio = parseFloat(salidaSeleccionada?.precio)
    
    if (!montoRecibido || montoRecibido < precio) {
      alert(`El monto recibido debe ser al menos S/${precio}`)
      return false
    }
    
    return true
  }

  const procesarVenta = async () => {
    if (!validarFormulario()) return

    try {
      const response = await fetch(`http://192.168.1.44:8000/api/salida/${salidaSeleccionada.id}/vender/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          dni: formData.dni,
          telefono: formData.telefono,
          asiento: asientoSeleccionado
        })
      })

      const data = await response.json()

      if (data.success) {
        setVentaCompletada({
          ...data,
          salida: salidaSeleccionada,
          asiento: asientoSeleccionado,
          pasajero: formData,
          montoRecibido: parseFloat(formData.montoRecibido),
          vuelto: calcularVuelto()
        })
        setPasoActual(4)
        cargarSalidas() // Actualizar disponibilidad
      } else {
        alert(data.error || 'Error al vender pasaje')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la venta')
    }
  }

  const generarManifiestoPDF = async (salidaId) => {
    try {
      const response = await fetch(`http://192.168.1.44:8000/api/salida/${salidaId}/manifiesto/`)
      const data = await response.json()
      
      // Crear PDF con jsPDF
      const pdf = new jsPDF()
      
      // Configurar fuente
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(20)
      
      // Título
      pdf.text('MANIFIESTO DE PASAJEROS', 20, 30)
      
      pdf.setFontSize(16)
      pdf.text('TransRural - Sistema de Transporte Rural', 20, 45)
      
      // Línea separadora
      pdf.setLineWidth(0.5)
      pdf.line(20, 50, 190, 50)
      
      // Información de la salida
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(12)
      
      let yPos = 65
      pdf.text(`Ruta: ${data.salida.ruta}`, 20, yPos)
      pdf.text(`Fecha: ${data.salida.fecha_completa}`, 20, yPos + 10)
      pdf.text(`Vehículo: ${data.salida.vehiculo}`, 20, yPos + 20)
      pdf.text(`Conductor: ${data.salida.conductor}`, 20, yPos + 30)
      
      // Línea separadora
      yPos += 45
      pdf.line(20, yPos, 190, yPos)
      
      // Encabezados de tabla
      yPos += 15
      pdf.setFont('helvetica', 'bold')
      pdf.text('No.', 20, yPos)
      pdf.text('NOMBRE COMPLETO', 35, yPos)
      pdf.text('DNI', 100, yPos)
      pdf.text('ASIENTO', 130, yPos)
      pdf.text('TELÉFONO', 155, yPos)
      
      // Línea bajo encabezados
      pdf.line(20, yPos + 3, 190, yPos + 3)
      
      // Lista de pasajeros
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      
      data.pasajeros.forEach((pasajero, index) => {
        yPos += 12
        
        // Si se acaba el espacio, crear nueva página
        if (yPos > 270) {
          pdf.addPage()
          yPos = 30
        }
        
        pdf.text((index + 1).toString(), 20, yPos)
        pdf.text(pasajero.nombre, 35, yPos)
        pdf.text(pasajero.dni, 100, yPos)
        pdf.text(pasajero.asiento.toString(), 135, yPos)
        pdf.text(pasajero.telefono || '-', 155, yPos)
      })
      
      // Resumen final
      yPos += 20
      pdf.line(20, yPos, 190, yPos)
      
      yPos += 15
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.text(`Total Pasajeros: ${data.total_pasajeros}`, 20, yPos)
      pdf.text(`Saldo Total: S/${data.saldo_total.toFixed(2)}`, 20, yPos + 15)
      
      // Pie de página
      yPos += 40
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text('_________________________', 20, yPos)
      pdf.text('Firma del Conductor', 20, yPos + 10)
      
      pdf.text('_________________________', 120, yPos)
      pdf.text('Firma del Administrador', 120, yPos + 10)
      
      // Generar y descargar
      const fecha = new Date().toISOString().split('T')[0]
      pdf.save(`manifiesto_${salidaId}_${fecha}.pdf`)
      
    } catch (error) {
      console.error('Error al generar manifiesto:', error)
      alert('Error al generar el manifiesto PDF')
    }
  }

  const generarBoletaChofer = (salida) => {
    // Crear PDF con jsPDF
    const pdf = new jsPDF()
    
    // Configurar fuente y título
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text('BOLETA PARA CHOFER', 20, 30)
    
    pdf.setFontSize(14)
    pdf.text('TransRural', 20, 45)
    
    // Línea separadora
    pdf.setLineWidth(0.5)
    pdf.line(20, 50, 190, 50)
    
    // Información del chofer
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    
    let yPos = 65
    pdf.text(`Chofer: ${salida.conductor}`, 20, yPos)
    pdf.text(`Vehículo: ${salida.vehiculo}`, 20, yPos + 15)
    pdf.text(`Ruta: ${salida.ruta}`, 20, yPos + 30)
    pdf.text(`Fecha: ${salida.fecha_completa}`, 20, yPos + 45)
    
    // Saldo destacado
    yPos += 70
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(0, 100, 0) // Verde
    pdf.text(`Saldo a entregar: S/${salida.saldoTotal.toFixed(2)}`, 20, yPos)
    
    pdf.setTextColor(0, 0, 0) // Negro
    pdf.setFontSize(12)
    pdf.text(`Total de pasajeros: ${salida.totalPasajeros}`, 20, yPos + 20)
    
    // Línea separadora
    yPos += 40
    pdf.line(20, yPos, 190, yPos)
    
    // Sección de firmas
    yPos += 20
    pdf.setFont('helvetica', 'normal')
    pdf.text('He recibido conforme el saldo correspondiente a la ruta:', 20, yPos)
    
    yPos += 30
    pdf.text('_________________________', 20, yPos)
    pdf.text('Firma del Chofer', 20, yPos + 15)
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, yPos + 25)
    
    pdf.text('_________________________', 120, yPos)
    pdf.text('Firma del Administrador', 120, yPos + 15)
    pdf.text(`Hora: ${new Date().toLocaleTimeString('es-PE')}`, 120, yPos + 25)
    
    // Nota al pie
    yPos += 50
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100) // Gris
    pdf.text('Nota: Esta boleta sirve como comprobante de entrega del saldo.', 20, yPos)
    pdf.text('Conservar para efectos de control interno.', 20, yPos + 10)
    
    // Generar y descargar
    const fecha = new Date().toISOString().split('T')[0]
    pdf.save(`boleta_chofer_${salida.id}_${fecha}.pdf`)
  }

  const nuevaVenta = () => {
    setPasoActual(1)
    setSalidaSeleccionada(null)
    setAsientoSeleccionado(null)
    setVentaCompletada(null)
    setFormData({ nombre: '', dni: '', telefono: '', montoRecibido: '' })
  }

  const calcularEstado = (salida) => {
    const ocupacion = salida.ocupados / salida.capacidad
    if (ocupacion >= 1) return { color: 'danger', texto: '🔴 COMPLETO', disponible: false }
    if (ocupacion >= 0.8) return { color: 'warning', texto: '🟡 CASI LLENO', disponible: true }
    return { color: 'success', texto: '🟢 DISPONIBLE', disponible: true }
  }

  // ============ PASO 1: SELECCIONAR SALIDA ============
  if (pasoActual === 1) {
    if (loading) {
      return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <h5 className="text-muted">Cargando salidas disponibles...</h5>
          </div>
        </div>
      )
    }

    const salidasDisponibles = salidas.filter(s => calcularEstado(s).disponible)

    return (
      <div className="container-fluid" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100vh', padding: '20px' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-outline-secondary" onClick={onVolver}>
            ← Volver al Dashboard
          </button>
          <h2 className="text-primary fw-bold">🎫 Venta de Pasajes</h2>
          <div></div>
        </div>

        {/* Título */}
        <div className="text-center mb-5">
          <h3 className="fw-bold text-dark mb-2">Seleccionar Salida</h3>
          <p className="text-muted">Elige el viaje para tu pasajero</p>
        </div>

        {/* Salidas */}
        <div className="row g-4">
          {salidasDisponibles.map((salida) => {
            const estado = calcularEstado(salida)
            return (
              <div key={salida.id} className="col-xl-4 col-lg-6 col-md-6">
                <div 
                  className="card h-100 shadow-sm border-0"
                  style={{ 
                    borderRadius: '16px', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease' 
                  }}
                  onClick={() => {
                    setSalidaSeleccionada(salida)
                    setPasoActual(2)
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold text-dark mb-1">{salida.fecha_completa}</h5>
                        <h6 className="text-primary fw-semibold">{salida.ruta}</h6>
                      </div>
                      <span className={`badge bg-${estado.color} fs-6`}>{estado.texto}</span>
                    </div>
                    
                    <div className="small text-muted mb-3">
                      <div className="mb-2">🚛 <strong>{salida.vehiculo}</strong></div>
                      <div className="mb-2">👨‍✈️ <strong>{salida.conductor}</strong></div>
                      <div className="mb-2">👥 <strong>{salida.ocupados}/{salida.capacidad}</strong> pasajeros</div>
                      <div className="text-success fw-bold fs-6">💰 S/{salida.precio}</div>
                    </div>

                    {/* SECCIÓN SALDO CHOFER */}
                    <div className="border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">💼 Saldo Chofer:</small>
                        <span className="badge bg-warning text-dark fw-bold">S/{salida.saldoTotal}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm flex-fill"
                          onClick={(e) => {
                            e.stopPropagation()
                            generarManifiestoPDF(salida.id)
                          }}
                          style={{ fontSize: '11px' }}
                        >
                          📋 Manifiesto
                        </button>
                        <button 
                          className="btn btn-outline-success btn-sm flex-fill"
                          onClick={(e) => {
                            e.stopPropagation()
                            generarBoletaChofer(salida)
                          }}
                          style={{ fontSize: '11px' }}
                        >
                          🧾 Boleta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {salidasDisponibles.length === 0 && (
          <div className="text-center py-5">
            <div style={{ fontSize: '4rem' }} className="mb-3">🚛</div>
            <h4 className="fw-bold text-muted mb-3">No hay salidas disponibles</h4>
            <p className="text-muted">No hay salidas programadas con cupos disponibles</p>
            <button className="btn btn-primary" onClick={cargarSalidas}>
              🔄 Actualizar
            </button>
          </div>
        )}
      </div>
    )
  }

  // ============ PASO 2: SELECCIONAR ASIENTO ============
  if (pasoActual === 2) {
    const asientos = Array.from({ length: salidaSeleccionada.capacidad }, (_, i) => i + 1)

    return (
      <div className="container-fluid" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100vh', padding: '20px' }}>
        <div className="text-center mb-5">
          <h3 className="fw-bold text-primary mb-2">🪑 Seleccionar Asiento</h3>
          <p className="text-muted">{salidaSeleccionada.ruta} - {salidaSeleccionada.fecha_completa}</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="text-center mb-4">🚗 Mapa de Asientos</h5>
                
                <div className="row g-3 justify-content-center" style={{ maxWidth: '400px', margin: '0 auto' }}>
                  {asientos.map(numeroAsiento => {
                    const ocupado = asientosOcupados.includes(numeroAsiento)
                    const seleccionado = asientoSeleccionado === numeroAsiento
                    
                    return (
                      <div key={numeroAsiento} className="col-3">
                        <button
                          onClick={() => !ocupado && setAsientoSeleccionado(numeroAsiento)}
                          disabled={ocupado}
                          className={`btn w-100 fw-bold fs-5 position-relative ${
                            ocupado 
                              ? 'btn-dark disabled' 
                              : seleccionado
                                ? 'btn-primary'
                                : 'btn-outline-success'
                          }`}
                          style={{ 
                            height: '60px', 
                            borderRadius: '12px',
                            opacity: ocupado ? '0.3' : '1',
                            cursor: ocupado ? 'not-allowed' : 'pointer',
                            transform: seleccionado ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all 0.3s ease',
                            boxShadow: seleccionado ? '0 4px 15px rgba(13, 110, 253, 0.4)' : 'none'
                          }}
                        >
                          {ocupado && (
                            <span 
                              className="position-absolute top-50 start-50 translate-middle"
                              style={{ fontSize: '1.5rem' }}
                            >
                              ❌
                            </span>
                          )}
                          {seleccionado && !ocupado && (
                            <span 
                              className="position-absolute top-50 start-50 translate-middle"
                              style={{ fontSize: '1.2rem' }}
                            >
                              ✅
                            </span>
                          )}
                          <span className={ocupado ? 'visually-hidden' : ''}>{numeroAsiento}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
                
                <div className="d-flex justify-content-center gap-4 mt-4 p-3 bg-light rounded">
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="bg-success rounded border border-success" 
                      style={{ width: '20px', height: '20px', border: '2px solid #198754' }}
                    ></div>
                    <small className="fw-semibold text-success">✅ Disponible</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="bg-primary rounded border border-primary" 
                      style={{ width: '20px', height: '20px', boxShadow: '0 0 10px rgba(13, 110, 253, 0.5)' }}
                    ></div>
                    <small className="fw-semibold text-primary">🎯 Seleccionado</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="bg-dark rounded border border-dark" 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        opacity: '0.3',
                        position: 'relative'
                      }}
                    >
                      <span 
                        style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          fontSize: '12px'
                        }}
                      >
                        ❌
                      </span>
                    </div>
                    <small className="fw-semibold text-danger">❌ Ocupado</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-3 justify-content-center mt-4">
          <button className="btn btn-secondary" onClick={() => setPasoActual(1)}>
            ← Cambiar Salida
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setPasoActual(3)}
            disabled={!asientoSeleccionado}
          >
            Continuar →
          </button>
        </div>
      </div>
    )
  }

  // ============ PASO 3: DATOS DEL PASAJERO ============
  if (pasoActual === 3) {
    return (
      <div className="container-fluid" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100vh', padding: '20px' }}>
        <div className="text-center mb-5">
          <h3 className="fw-bold text-primary mb-2">👤 Datos del Pasajero</h3>
          <p className="text-muted">Asiento {asientoSeleccionado} - {salidaSeleccionada.ruta}</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Formulario */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4">📝 Información del Pasajero</h5>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Nombre Completo *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="form-control form-control-lg"
                      placeholder="Ingresa el nombre completo"
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">DNI *</label>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={(e) => setFormData({...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8)})}
                      className="form-control form-control-lg"
                      placeholder="12345678"
                      maxLength="8"
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Teléfono (opcional)</label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)})}
                      className="form-control form-control-lg"
                      placeholder="987654321"
                      maxLength="9"
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                  
                  {/* NUEVO CAMPO: MONTO RECIBIDO */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Monto Recibido (S/) *</label>
                    <input
                      type="number"
                      name="montoRecibido"
                      value={formData.montoRecibido}
                      onChange={handleInputChange}
                      className="form-control form-control-lg"
                      placeholder={`Mínimo S/${salidaSeleccionada?.precio}`}
                      min={salidaSeleccionada?.precio}
                      step="0.01"
                      style={{ borderRadius: '12px' }}
                    />
                    {formData.montoRecibido && (
                      <div className="mt-2">
                        <div className="d-flex justify-content-between">
                          <span>Precio del pasaje:</span>
                          <span className="fw-bold">S/{salidaSeleccionada?.precio}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Monto recibido:</span>
                          <span className="fw-bold text-primary">S/{formData.montoRecibido}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">Vuelto:</span>
                          <span className={`fw-bold ${calcularVuelto() >= 0 ? 'text-success' : 'text-danger'}`}>
                            S/{calcularVuelto().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="card border-0 shadow-sm bg-primary bg-opacity-10" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4">📋 Resumen de Compra</h5>
                <div className="row g-2">
                  <div className="col-6"><strong>Ruta:</strong></div>
                  <div className="col-6 text-end">{salidaSeleccionada.ruta}</div>
                  
                  <div className="col-6"><strong>Fecha/Hora:</strong></div>
                  <div className="col-6 text-end">{salidaSeleccionada.fecha_completa}</div>
                  
                  <div className="col-6"><strong>Asiento:</strong></div>
                  <div className="col-6 text-end">#{asientoSeleccionado}</div>
                  
                  <div className="col-6"><strong>Vehículo:</strong></div>
                  <div className="col-6 text-end">{salidaSeleccionada.vehiculo}</div>
                  
                  <div className="col-12"><hr className="my-3" /></div>
                  
                  <div className="col-6"><strong>Total:</strong></div>
                  <div className="col-6 text-end"><h5 className="text-success mb-0 fw-bold">S/{salidaSeleccionada.precio}</h5></div>
                  
                  {formData.montoRecibido && (
                    <>
                      <div className="col-12"><hr className="my-2" /></div>
                      <div className="col-6"><strong>Recibido:</strong></div>
                      <div className="col-6 text-end">S/{formData.montoRecibido}</div>
                      
                      <div className="col-6"><strong>Vuelto:</strong></div>
                      <div className="col-6 text-end">
                        <span className={calcularVuelto() >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                          S/{calcularVuelto().toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-3 justify-content-center mt-4">
          <button className="btn btn-secondary" onClick={() => setPasoActual(2)}>
            ← Cambiar Asiento
          </button>
          <button className="btn btn-success btn-lg" onClick={procesarVenta}>
            💳 Confirmar Venta
          </button>
        </div>
      </div>
    )
  }

  // ============ PASO 4: CONFIRMACIÓN ============
  if (pasoActual === 4) {
    return (
      <div className="container-fluid" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100vh', padding: '20px' }}>
        <div className="text-center mb-5">
          <div style={{ fontSize: '4rem' }} className="mb-3">✅</div>
          <h3 className="fw-bold text-success mb-2">¡Venta Exitosa!</h3>
          <p className="text-muted">El pasaje ha sido vendido correctamente</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm bg-success bg-opacity-10" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <div className="text-center border-bottom pb-3 mb-3">
                  <h4 className="fw-bold text-dark">🚛 TransRural</h4>
                  <p className="small text-muted mb-0">Sistema de Transporte Rural</p>
                </div>
                
                <div className="row g-2 small">
                  <div className="col-5"><strong>Pasajero:</strong></div>
                  <div className="col-7">{ventaCompletada.pasajero.nombre}</div>
                  
                  <div className="col-5"><strong>DNI:</strong></div>
                  <div className="col-7">{ventaCompletada.pasajero.dni}</div>
                  
                  <div className="col-5"><strong>Ruta:</strong></div>
                  <div className="col-7">{ventaCompletada.salida.ruta}</div>
                  
                  <div className="col-5"><strong>Fecha/Hora:</strong></div>
                  <div className="col-7">{ventaCompletada.salida.fecha_completa}</div>
                  
                  <div className="col-5"><strong>Asiento:</strong></div>
                  <div className="col-7">#{ventaCompletada.asiento}</div>
                  
                  <div className="col-5"><strong>Vehículo:</strong></div>
                  <div className="col-7">{ventaCompletada.salida.vehiculo}</div>
                  
                  <div className="col-5"><strong>Conductor:</strong></div>
                  <div className="col-7">{ventaCompletada.salida.conductor}</div>
                </div>
                
                  <div className="col-5"><strong>Total pagado:</strong></div>
                  <div className="col-7">S/{ventaCompletada.salida.precio}</div>
                  
                  <div className="col-5"><strong>Recibido:</strong></div>
                  <div className="col-7">S/{ventaCompletada.montoRecibido}</div>
                  
                  <div className="col-5"><strong>Vuelto:</strong></div>
                  <div className="col-7 text-success fw-bold">S/{ventaCompletada.vuelto.toFixed(2)}</div>
                
                <div className="text-center mt-4">
                  <p className="small text-muted mb-1">Ticket ID: {ventaCompletada.pasaje_id}</p>
                  <p className="small text-muted mb-0">Conserve este ticket para el viaje</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-3 justify-content-center mt-4">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            🖨️ Imprimir Ticket
          </button>
          <button className="btn btn-primary btn-lg" onClick={nuevaVenta}>
            🎫 Nueva Venta
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default VentaPasajes