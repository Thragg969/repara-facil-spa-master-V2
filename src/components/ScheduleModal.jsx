import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { getClientes } from "../api/clientesService";
import { getTecnicos } from "../api/tecnicosService";
import { createServicio } from "../api/serviciosService";
import { createAgenda } from "../api/agendaService"; 
import { useAuth } from "../context/AuthContext";

export default function ScheduleModal({ show, onClose, service, onSuccess }) {
  const { username, role } = useAuth();
  
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  
  const [clienteId, setClienteId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState(""); 
  const [loading, setLoading] = useState(false);

  // Helpers de roles
  const esCliente = role === "CLIENTE" || role === "ROLE_CLIENTE";
  const esTecnico = role === "TECNICO" || role === "ROLE_TECNICO";

  useEffect(() => {
    if (show) {
      if (service) setDescripcion(`Solicitud de: ${service.nombre}`);
      setFechaInicio(""); 

      // 1. Cargar Clientes
      getClientes().then((data) => {
        setClientes(data);
        if (esCliente) {
          const miPerfil = data.find(c => c.email?.trim().toLowerCase() === username?.trim().toLowerCase());
          if (miPerfil) setClienteId(miPerfil.id);
        }
      }).catch(console.error);

      // 2. Cargar Técnicos y Auto-asignar si soy técnico
      getTecnicos().then((data) => {
        const disponibles = data.filter(t => t.disponible);
        setTecnicos(disponibles);

        if (esTecnico) {
            // Buscar mi ID de técnico usando el email de la sesión
            const miPerfilTecnico = data.find(t => t.email === username);
            if (miPerfilTecnico) {
                setTecnicoId(miPerfilTecnico.id);
            }
        }
      }).catch(console.error);
    }
  }, [show, service, username, esCliente, esTecnico]);

  const handleSave = async () => {
    if (!clienteId || !descripcion) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      if (fechaInicio) {
        const fechaInicioEnvio = fechaInicio + ":00"; 
        const d = new Date(fechaInicio);
        d.setHours(d.getHours() + 2);
        
        const pad = (n) => n.toString().padStart(2, '0');
        const fechaFinEnvio = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

        const payloadAgenda = {
            fechaHoraInicio: fechaInicioEnvio,
            fechaHoraFin: fechaFinEnvio,
            estado: "RESERVADO",
            tecnico: tecnicoId ? { id: parseInt(tecnicoId) } : null,
            servicio: {
                descripcionProblema: descripcion,
                estado: "ASIGNADO",
                cliente: { id: parseInt(clienteId) },
                tecnico: tecnicoId ? { id: parseInt(tecnicoId) } : null
            }
        };
        
        await createAgenda(payloadAgenda);
        alert("¡Cita agendada exitosamente!");

      } else {
        const payloadServicio = {
            descripcionProblema: descripcion,
            estado: "PENDIENTE",
            cliente: { id: parseInt(clienteId) },
            tecnico: tecnicoId ? { id: parseInt(tecnicoId) } : null
        };
        
        await createServicio(payloadServicio);
        alert("¡Solicitud enviada! Un técnico te contactará.");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      if (error.response) {
          alert(`Error del servidor: ${JSON.stringify(error.response.data)}`);
      } else {
          alert("Hubo un error de conexión.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Agendar: {service.nombre}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Form>
          <Row className="g-3">
            {/* Si es cliente, no ve el select de clientes (se auto-asigna) */}
            {!esCliente && (
              <Col md={12}>
                <Form.Label className="fw-bold">Cliente <span className="text-danger">*</span></Form.Label>
                <Form.Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">-- Selecciona --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.email})</option>
                  ))}
                </Form.Select>
              </Col>
            )}

            <Col md={12}>
              <Form.Label className="fw-bold">Detalle del Problema <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)} 
              />
            </Col>

            <Col md={12}>
                <div className="p-3 bg-light rounded border mt-2">
                    <h6 className="text-primary fw-bold mb-3">
                        <i className="bi bi-calendar-check me-2"></i>¿Cuándo lo necesitas?
                    </h6>
                    <Row>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Fecha y Hora</Form.Label>
                            <Form.Control 
                                type="datetime-local" 
                                value={fechaInicio} 
                                onChange={(e) => setFechaInicio(e.target.value)} 
                            />
                            <Form.Text className="text-muted" style={{fontSize:"0.75rem"}}>
                                Si lo dejas vacío, quedará como solicitud pendiente.
                            </Form.Text>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Técnico Asignado</Form.Label>
                            <Form.Select 
                                value={tecnicoId} 
                                onChange={(e) => setTecnicoId(e.target.value)}
                                disabled={esTecnico} // <--- BLOQUEADO PARA TÉCNICOS
                                className={esTecnico ? "bg-secondary-subtle" : ""}
                            >
                                <option value="">-- Cualquiera --</option>
                                {tecnicos.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nombre} {t.apellido}
                                </option>
                                ))}
                            </Form.Select>
                            {esTecnico && <Form.Text className="text-muted">Auto-asignado a ti.</Form.Text>}
                        </Col>
                    </Row>
                </div>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="success" onClick={handleSave} disabled={loading}>
          {loading ? "Procesando..." : (fechaInicio ? "Confirmar Cita" : "Enviar Solicitud")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}