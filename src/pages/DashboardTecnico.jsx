import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

export default function DashboardTecnico() {
  const { username } = useAuth(); // Este es el email del usuario logueado
  const [tecnicoId, setTecnicoId] = useState(null);
  const [misServicios, setMisServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({ pendientes: 0, proceso: 0, completados: 0 });

  useEffect(() => {
    if (username) {
      inicializarDatos();
    }
  }, [username]);

  const inicializarDatos = async () => {
    try {
      setLoading(true);

      // 1. Obtener lista de técnicos para encontrar mi ID basado en el email (username)
      // Nota: Idealmente el backend tendría un endpoint /tecnicos/me, pero lo simulamos aquí.
      const { data: listaTecnicos } = await api.get("/tecnicos");
      const miPerfil = listaTecnicos.find((t) => t.email === username);

      if (!miPerfil) {
        console.warn("No se encontró un perfil de técnico asociado a este usuario.");
        setLoading(false);
        return;
      }

      setTecnicoId(miPerfil.id);

      // 2. Cargar todos los servicios y filtrar solo los míos
      // Nota: Si hay muchos datos, esto debería filtrarse en el Backend (Repo.findByTecnicoId)
      const { data: todosServicios } = await api.get("/servicios");
      
      const misAsignaciones = todosServicios.filter(
        (s) => s.tecnico && s.tecnico.id === miPerfil.id
      );

      setMisServicios(misAsignaciones);
      calcularResumen(misAsignaciones);

    } catch (error) {
      console.error("Error cargando datos del técnico:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularResumen = (servicios) => {
    const stats = {
      pendientes: servicios.filter(s => s.estado === 'ASIGNADO' || s.estado === 'PENDIENTE').length,
      proceso: servicios.filter(s => s.estado === 'EN_PROCESO').length,
      completados: servicios.filter(s => s.estado === 'COMPLETADO').length
    };
    setResumen(stats);
  };

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      // Obtenemos el servicio actual para no perder datos al actualizar
      const servicioActual = misServicios.find(s => s.id === id);
      
      await api.put(`/servicios/${id}`, {
        ...servicioActual,
        estado: nuevoEstado,
        // Al completar, podríamos requerir diagnóstico y solución, pero por ahora solo cambiamos estado
        cliente: servicioActual.cliente, // Mantener relaciones
        tecnico: servicioActual.tecnico
      });

      // Actualizar UI localmente
      const actualizados = misServicios.map(s => 
        s.id === id ? { ...s, estado: nuevoEstado } : s
      );
      setMisServicios(actualizados);
      calcularResumen(actualizados);
      
    } catch (error) {
      console.error("Error actualizando estado:", error);
      alert("No se pudo actualizar el estado.");
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );

  return (
    <div className="container py-5">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark">Panel de Técnico</h1>
          <p className="text-muted mb-0">Hola, {username} 🔧</p>
        </div>
        <div>
            <span className="badge bg-light text-dark border p-2">
                ID Técnico: {tecnicoId ? `#${tecnicoId}` : "Sin asignar"}
            </span>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-warning">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold">Por Atender</h6>
              <h2 className="display-6 fw-bold mb-0 text-warning">{resumen.pendientes}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-primary">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold">En Progreso</h6>
              <h2 className="display-6 fw-bold mb-0 text-primary">{resumen.proceso}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-success">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold">Finalizados</h6>
              <h2 className="display-6 fw-bold mb-0 text-success">{resumen.completados}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Servicios */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-bold">Mis Servicios Asignados</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#ID</th>
                <th>Cliente</th>
                <th>Problema Reportado</th>
                <th>Fecha Solicitud</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {misServicios.length > 0 ? (
                misServicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td className="fw-bold">#{servicio.id}</td>
                    <td>
                      <div className="fw-semibold">
                        {servicio.cliente ? `${servicio.cliente.nombre} ${servicio.cliente.apellido}` : "Desconocido"}
                      </div>
                      <div className="small text-muted">
                        {servicio.cliente?.direccion || "Sin dirección"}
                      </div>
                    </td>
                    <td>{servicio.descripcionProblema}</td>
                    <td>{new Date(servicio.fechaSolicitud).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge rounded-pill ${
                        servicio.estado === 'COMPLETADO' ? 'bg-success' :
                        servicio.estado === 'EN_PROCESO' ? 'bg-primary' :
                        'bg-warning text-dark'
                      }`}>
                        {servicio.estado}
                      </span>
                    </td>
                    <td className="text-end">
                      {servicio.estado === 'ASIGNADO' || servicio.estado === 'PENDIENTE' ? (
                        <button 
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => actualizarEstado(servicio.id, "EN_PROCESO")}
                        >
                          Iniciar
                        </button>
                      ) : null}

                      {servicio.estado === 'EN_PROCESO' && (
                        <button 
                          className="btn btn-sm btn-success text-white"
                          onClick={() => actualizarEstado(servicio.id, "COMPLETADO")}
                        >
                          Finalizar
                        </button>
                      )}
                      
                      {servicio.estado === 'COMPLETADO' && (
                        <span className="text-muted small fst-italic">Sin acciones</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No tienes servicios asignados actualmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}