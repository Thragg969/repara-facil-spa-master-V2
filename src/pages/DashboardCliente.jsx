import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../api/api";

export default function DashboardCliente() {
  const { username } = useAuth(); // Email del usuario logueado
  const [misServicios, setMisServicios] = useState([]);
  const [misGarantias, setMisGarantias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchMisDatos();
    }
  }, [username]);

  const fetchMisDatos = async () => {
    try {
      setLoading(true);
      
      const [serviciosResp, garantiasResp] = await Promise.all([
        api.get("/servicios"),
        api.get("/garantias")
      ]);

      // --- FILTRADO POR CLIENTE ---
      // Comparamos el email del cliente del servicio con el usuario logueado
      const misServiciosFiltrados = serviciosResp.data.filter(s => 
        s.cliente && s.cliente.email === username
      );
      
      // Lo mismo para garantías (si la garantía tiene servicio y este cliente)
      const misGarantiasFiltradas = garantiasResp.data.filter(g =>
        g.servicio && g.servicio.cliente && g.servicio.cliente.email === username
      );

      setMisServicios(misServiciosFiltrados);
      setMisGarantias(misGarantiasFiltradas);

    } catch (error) {
      console.error("Error obteniendo datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarNuevoServicio = () => {
    window.location.href = "/servicios"; // O usar navigate("/servicios")
  };

  // ... (El resto del return se mantiene igual) ...
  return (
    <div className="container mt-5">
      {/* ... encabezado ... */}
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ... tarjetas de resumen ... */}
          {/* ... tabla de servicios ... */}
          {/* ... tabla de garantías ... */}
          {/* ... accesos rápidos ... */}
          {/* Copia aquí el resto de tu JSX original, no ha cambiado */}
          <div className="row">
            <div className="col-12">
              <h1 className="mb-4">🏠 Mi Panel de Cliente</h1>
              <p className="text-muted">Bienvenido, <strong>{username}</strong></p>
            </div>
          </div>
          {/* ... etc ... */}
          {/* Solo asegúrate de cerrar bien los tags del JSX */}
          <div className="row mb-4">
             {/* ... Resumen ... */}
             <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">Servicios Solicitados</h5>
                  <h2 className="display-4">{misServicios.length}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <h3 className="mb-3">📋 Historial de Servicios</h3>
              {misServicios.length === 0 ? (
                <div className="alert alert-info">
                  No tienes servicios registrados.
                  <Link to="/servicios" className="ms-2">Ir a solicitar uno</Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Problema</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Técnico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misServicios.map((s) => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{s.descripcionProblema}</td>
                          <td>
                            <span className="badge bg-secondary">{s.estado}</span>
                          </td>
                          <td>{new Date(s.fechaSolicitud).toLocaleDateString()}</td>
                          <td>{s.tecnico ? s.tecnico.nombre : "Por asignar"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}