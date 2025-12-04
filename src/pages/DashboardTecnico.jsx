import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom"; 
import api from "../api/api";

export default function DashboardTecnico() {
  const { username } = useAuth(); 
  const [perfil, setPerfil] = useState(null); 
  const [misServicios, setMisServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({ pendientes: 0, proceso: 0, completados: 0 });
  
  // NUEVO: Estado para el filtro activo ('TODOS', 'PENDIENTE', 'EN_PROCESO', 'COMPLETADO')
  const [filterStatus, setFilterStatus] = useState('TODOS');

  useEffect(() => {
    if (username) {
      inicializarDatos();
    }
  }, [username]);

  const inicializarDatos = async () => {
    try {
      setLoading(true);

      const { data: listaTecnicos } = await api.get("/tecnicos");
      const miPerfil = listaTecnicos.find((t) => t.email === username);

      if (!miPerfil) {
        setLoading(false);
        return;
      }

      setPerfil(miPerfil); 

      const { data: todosServicios } = await api.get("/servicios");
      const misAsignaciones = todosServicios.filter(
        (s) => s.tecnico && s.tecnico.id === miPerfil.id
      );

      setMisServicios(misAsignaciones);
      calcularResumen(misAsignaciones);

    } catch (error) {
      console.error("Error cargando datos:", error);
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
      const servicioActual = misServicios.find(s => s.id === id);
      if (!servicioActual) return;

      const payload = {
        descripcionProblema: servicioActual.descripcionProblema,
        estado: nuevoEstado,
        diagnostico: servicioActual.diagnostico || null,
        solucion: servicioActual.solucion || null,
        cliente: servicioActual.cliente ? { id: servicioActual.cliente.id } : null,
        tecnico: servicioActual.tecnico ? { id: servicioActual.tecnico.id } : null
      };
      
      await api.put(`/servicios/${id}`, payload);

      const actualizados = misServicios.map(s => 
        s.id === id ? { ...s, estado: nuevoEstado } : s
      );
      setMisServicios(actualizados);
      calcularResumen(actualizados);
      
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("No se pudo actualizar el estado.");
    }
  };

  // NUEVO: Manejador de clic en tarjetas (Toggle: si ya está activo, lo desactiva)
  const handleFilterClick = (status) => {
      setFilterStatus(prev => prev === status ? 'TODOS' : status);
  };

  // NUEVO: Lógica de filtrado dinámico
  const serviciosFiltrados = useMemo(() => {
      if (filterStatus === 'TODOS') return misServicios;

      return misServicios.filter(s => {
          if (filterStatus === 'PENDIENTE') return s.estado === 'ASIGNADO' || s.estado === 'PENDIENTE';
          return s.estado === filterStatus;
      });
  }, [misServicios, filterStatus]);


  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="container py-5">
      
      {/* --- SECCIÓN 1: PERFIL --- */}
      <div className="card shadow-sm border-0 mb-5 overflow-hidden">
        <div className="card-body p-0">
            <div className="row g-0">
                <div className="col-md-8 p-4 d-flex align-items-center bg-white">
                    <div className="me-4 position-relative">
                        <img 
                            src={perfil?.foto || "https://via.placeholder.com/150"} 
                            alt="Perfil" 
                            className="rounded-circle border border-3 border-light shadow-sm"
                            style={{ width: "100px", height: "100px", objectFit: "cover" }}
                            onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                        />
                        <span 
                            className={`position-absolute bottom-0 end-0 p-2 rounded-circle border border-white ${perfil?.disponible ? 'bg-success' : 'bg-danger'}`}
                            title={perfil?.disponible ? "Disponible" : "Ocupado"}
                        ></span>
                    </div>
                    <div>
                        <h2 className="h4 fw-bold mb-1">Hola, {perfil?.nombre} {perfil?.apellido} 👋</h2>
                        <p className="text-muted mb-2">{perfil?.especialidad} | ID: #{perfil?.id}</p>
                        <div className="d-flex gap-2">
                            <span className="badge bg-light text-dark border">
                                <i className="bi bi-envelope me-1"></i> {perfil?.email}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 bg-light p-4 d-flex flex-column justify-content-center border-start">
                    <h6 className="fw-bold text-secondary mb-3">ACCESOS RÁPIDOS</h6>
                    <div className="d-grid gap-2">
                        <Link to="/agenda" className="btn btn-primary text-start">
                            <i className="bi bi-calendar-event me-2"></i> Ver Mi Agenda
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: ESTADÍSTICAS (FILTROS) --- */}
      <div className="row g-4 mb-5">
        {/* Card: PENDIENTES */}
        <div className="col-md-4" onClick={() => handleFilterClick('PENDIENTE')} style={{cursor: 'pointer'}}>
          <div className={`card border-0 shadow-sm h-100 border-start border-4 border-warning transition-all ${filterStatus === 'PENDIENTE' ? 'bg-warning text-dark ring-2 ring-warning' : 'bg-warning bg-opacity-10'}`}>
            <div className="card-body d-flex align-items-center">
              <div className={`rounded-circle p-3 me-3 ${filterStatus === 'PENDIENTE' ? 'bg-white text-warning' : 'bg-warning text-white'}`}>
                <i className="bi bi-hourglass-split fs-3"></i>
              </div>
              <div>
                <h6 className={`text-uppercase small fw-bold mb-0 ${filterStatus === 'PENDIENTE' ? 'text-dark' : 'text-muted'}`}>Por Atender</h6>
                <h2 className="display-6 fw-bold mb-0">{resumen.pendientes}</h2>
              </div>
              {filterStatus === 'PENDIENTE' && <i className="bi bi-check-circle-fill fs-4 ms-auto text-dark"></i>}
            </div>
          </div>
        </div>

        {/* Card: EN PROCESO */}
        <div className="col-md-4" onClick={() => handleFilterClick('EN_PROCESO')} style={{cursor: 'pointer'}}>
          <div className={`card border-0 shadow-sm h-100 border-start border-4 border-primary transition-all ${filterStatus === 'EN_PROCESO' ? 'bg-primary text-white ring-2 ring-primary' : 'bg-primary bg-opacity-10'}`}>
            <div className="card-body d-flex align-items-center">
              <div className={`rounded-circle p-3 me-3 ${filterStatus === 'EN_PROCESO' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                <i className="bi bi-tools fs-3"></i>
              </div>
              <div>
                <h6 className={`text-uppercase small fw-bold mb-0 ${filterStatus === 'EN_PROCESO' ? 'text-white' : 'text-muted'}`}>En Progreso</h6>
                <h2 className="display-6 fw-bold mb-0">{resumen.proceso}</h2>
              </div>
              {filterStatus === 'EN_PROCESO' && <i className="bi bi-check-circle-fill fs-4 ms-auto text-white"></i>}
            </div>
          </div>
        </div>

        {/* Card: FINALIZADOS */}
        <div className="col-md-4" onClick={() => handleFilterClick('COMPLETADO')} style={{cursor: 'pointer'}}>
          <div className={`card border-0 shadow-sm h-100 border-start border-4 border-success transition-all ${filterStatus === 'COMPLETADO' ? 'bg-success text-white ring-2 ring-success' : 'bg-success bg-opacity-10'}`}>
            <div className="card-body d-flex align-items-center">
              <div className={`rounded-circle p-3 me-3 ${filterStatus === 'COMPLETADO' ? 'bg-white text-success' : 'bg-success text-white'}`}>
                <i className="bi bi-check-lg fs-3"></i>
              </div>
              <div>
                <h6 className={`text-uppercase small fw-bold mb-0 ${filterStatus === 'COMPLETADO' ? 'text-white' : 'text-muted'}`}>Finalizados</h6>
                <h2 className="display-6 fw-bold mb-0">{resumen.completados}</h2>
              </div>
              {filterStatus === 'COMPLETADO' && <i className="bi bi-check-circle-fill fs-4 ms-auto text-white"></i>}
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 3: TABLA DE SERVICIOS --- */}
      <div className="card shadow border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark">
            📋 {filterStatus === 'TODOS' ? 'Todos los Servicios' : 
                filterStatus === 'PENDIENTE' ? 'Servicios Pendientes' : 
                filterStatus === 'EN_PROCESO' ? 'Servicios en Progreso' : 'Servicios Finalizados'}
          </h5>
          
          <div className="d-flex gap-2">
            {filterStatus !== 'TODOS' && (
                <button className="btn btn-sm btn-outline-dark" onClick={() => setFilterStatus('TODOS')}>
                    <i className="bi bi-x-circle me-1"></i> Quitar Filtro
                </button>
            )}
            <button className="btn btn-sm btn-outline-secondary" onClick={inicializarDatos}>
                <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary text-uppercase small">
              <tr>
                <th className="ps-4">#ID</th>
                <th>Cliente</th>
                <th>Problema</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {serviciosFiltrados.length > 0 ? (
                serviciosFiltrados.map((servicio) => (
                  <tr key={servicio.id}>
                    <td className="ps-4 fw-bold">#{servicio.id}</td>
                    <td>
                      <div className="fw-bold text-dark">
                        {servicio.cliente ? `${servicio.cliente.nombre} ${servicio.cliente.apellido}` : "Desconocido"}
                      </div>
                      <div className="small text-muted">
                        <i className="bi bi-geo-alt me-1"></i>{servicio.cliente?.direccion || "Sin dirección"}
                      </div>
                    </td>
                    <td className="text-truncate" style={{maxWidth: "200px"}} title={servicio.descripcionProblema}>
                        {servicio.descripcionProblema}
                    </td>
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
                    <td className="text-end pe-4">
                      {servicio.estado === 'ASIGNADO' || servicio.estado === 'PENDIENTE' ? (
                        <button 
                          className="btn btn-sm btn-primary fw-bold"
                          onClick={() => actualizarEstado(servicio.id, "EN_PROCESO")}
                        >
                          <i className="bi bi-play-fill me-1"></i>Iniciar
                        </button>
                      ) : null}

                      {servicio.estado === 'EN_PROCESO' && (
                        <button 
                          className="btn btn-sm btn-success text-white fw-bold"
                          onClick={() => actualizarEstado(servicio.id, "COMPLETADO")}
                        >
                          <i className="bi bi-check2-circle me-1"></i>Terminar
                        </button>
                      )}
                      
                      {servicio.estado === 'COMPLETADO' && (
                        <span className="text-muted small fst-italic"><i className="bi bi-lock-fill me-1"></i>Cerrado</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-filter-circle fs-1 d-block mb-2 opacity-25"></i>
                    No se encontraron servicios con este filtro.
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