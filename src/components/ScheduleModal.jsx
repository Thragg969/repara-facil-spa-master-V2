import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { getClientes } from "../api/clientesService";
import { getTecnicos } from "../api/tecnicosService";
import { createServicio } from "../api/serviciosService";
import { useAuth } from "../context/AuthContext";

export default function ScheduleModal({ show, onClose, service, onSuccess }) {
  const { username, role } = useAuth(); // Usamos role directamente para asegurar compatibilidad
  
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  
  const [clienteId, setClienteId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  // Definimos la variable aquí para asegurar que funcione siempre
  const esCliente = role === "CLIENTE" || role === "ROLE_CLIENTE";

  useEffect(() => {
    if (show) {
      if (service) setDescripcion(`Solicitud de: ${service.nombre}`);

      // 1. Cargar Clientes (y auto-asignar si soy cliente)
      getClientes().then((data) => {
        setClientes(data);
        if (esCliente) {
          // Buscamos mi propio ID de cliente usando el email del login
          const miPerfil = data.find(c => c.email?.toLowerCase() === username?.toLowerCase());
          if (miPerfil) {
            console.log("✅ Cliente identificado automáticamente:", miPerfil.nombre);
            setClienteId(miPerfil.id);
          } else {
            console.warn("⚠️ No se encontró ficha de cliente para:", username);
          }
        }
      }).catch(err => console.error("Error cargando clientes:", err));

      // 2. Cargar Técnicos (Siempre visibles)
      getTecnicos().then((data) => {
        console.log("🔧 Técnicos cargados:", data.length);
        const disponibles = data.filter(t => t.disponible); 
        setTecnicos(disponibles);
      }).catch(err => console.error("Error cargando técnicos:", err));
    }
  }, [show, service, username, esCliente]);

  const handleSave = async () => {
    if (!clienteId || !descripcion) {
      alert("Error: Faltan datos (Cliente no identificado o descripción vacía).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        descripcionProblema: descripcion,
        estado: "PENDIENTE",
        cliente: { id: parseInt(clienteId) }
      };

      // Si el usuario seleccionó un técnico, lo agregamos al envío
      if (tecnicoId) {
        payload.tecnico = { id: parseInt(tecnicoId) };
        payload.estado = "ASIGNADO"; // Cambiamos el estado automáticamente
      }

      console.log("Enviando servicio:", payload);
      await createServicio(payload);

      alert("¡Servicio agendado exitosamente!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un problema al guardar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Agendar: {service.nombre}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="g-3">
            
            {/* --- SECCIÓN 1: CLIENTE (Solo visible si NO eres cliente) --- */}
            {!esCliente && (
              <Col md={12}>
                <Form.Label className="fw-bold">Seleccionar Cliente</Form.Label>
                <Form.Select 
                  value={clienteId} 
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido} ({c.email})
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {/* Si eres cliente, mostramos esto solo para que sepas que el sistema te reconoció */}
            {esCliente && (
               <Col md={12}>
                 <Form.Label className="text-muted small">Reservando como:</Form.Label>
                 <Form.Control type="text" value={username} disabled className="bg-light text-muted" size="sm" />
               </Col>
            )}

            {/* --- SECCIÓN 2: TÉCNICO (Visible para TODOS) --- */}
            {/* Este bloque está 100% fuera de las condiciones anteriores */}
            <Col md={12}>
              <Form.Label className="fw-bold text-primary">Elige tu Técnico (Opcional)</Form.Label>
              <Form.Select 
                value={tecnicoId} 
                onChange={(e) => setTecnicoId(e.target.value)}
                style={{ border: "2px solid #0d6efd" }} // Borde azul para destacar
              >
                <option value="">-- Asignación automática (cualquier disponible) --</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.apellido} - {t.especialidad}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Si seleccionas uno, la cita quedará asignada inmediatamente.
              </Form.Text>
            </Col>

            {/* --- SECCIÓN 3: DETALLE --- */}
            <Col md={12}>
              <Form.Label className="fw-bold">Detalle del Problema</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe brevemente qué sucede..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </Col>

          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Procesando..." : "Confirmar Cita"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}