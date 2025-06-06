function DashboardConductor({ user }) {
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h2>Panel de Conductor</h2>
          <div className="alert alert-info">
            Hola {user.nombre}, aquí verás tus salidas del día y pasajeros asignados
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardConductor