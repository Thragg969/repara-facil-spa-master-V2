import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // <--- 1. Importar useNavigate
import { useAuth } from "../context/AuthContext"; // <--- 2. Importar Auth
import ScheduleModal from "./ScheduleModal.jsx";

export default function ServiceCard({ service }) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate(); // <--- 3. Usar el hook
  const { role } = useAuth();     // <--- 4. Obtener el rol

  if (!service) return null;

  const handleSuccess = () => {
    // 5. Redirigir al dashboard correspondiente según el rol
    if (role === "TECNICO" || role === "ROLE_TECNICO") {
      navigate("/dashboard/tecnico");
    } else if (role === "ADMIN" || role === "ROLE_ADMIN") {
      navigate("/dashboard/admin");
    } else {
      navigate("/dashboard/cliente");
    }
  };

  return (
    <div className="card h-100 shadow-sm service-card border-0">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="card-title fw-bold text-primary mb-1">{service.nombre}</h5>
            <span className="badge bg-light text-secondary border">
              {service.categoria}
            </span>
          </div>
          <h5 className="fw-bold text-dark">${service.precio?.toLocaleString()}</h5>
        </div>

        <p className="card-text text-muted small flex-grow-1">
          {service.descripcion}
        </p>

        <div className="mt-3">
          <div className="d-flex align-items-center text-muted small mb-3">
            <i className="bi bi-clock me-2"></i> {service.duracion}
            <span className="mx-2">|</span>
            <i className="bi bi-person-badge me-2"></i> {service.nivel}
          </div>

          <button
            className="btn btn-primary w-100 fw-semibold"
            onClick={() => setShowModal(true)}
          >
            Agendar Cita
          </button>
        </div>
      </div>

      <ScheduleModal
        show={showModal}
        onClose={() => setShowModal(false)}
        service={service}
        onSuccess={handleSuccess} // <--- 6. Conectar la redirección
      />
    </div>
  );
}