import React, { useState } from "react";
import ScheduleModal from "./ScheduleModal.jsx";

export default function ServiceCard({ service }) {
  const [showModal, setShowModal] = useState(false);

  if (!service) return null;

  return (
    <div className="card h-100 shadow-sm service-card border-0">
      <div className="card-body d-flex flex-column">
        {/* Encabezado */}
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

          {/* ÚNICO BOTÓN PARA AGENDAR */}
          <button
            className="btn btn-primary w-100 fw-semibold"
            onClick={() => setShowModal(true)}
          >
            Agendar Cita
          </button>
        </div>
      </div>

      {/* El modal se encarga de mostrar los técnicos */}
      <ScheduleModal
        show={showModal}
        onClose={() => setShowModal(false)}
        service={service}
        onSuccess={() => {
             // Lógica extra si se requiere
        }}
      />
    </div>
  );
}