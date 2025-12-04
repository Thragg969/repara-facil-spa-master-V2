import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { getClientes } from "../api/clientesService";
import { getTecnicos } from "../api/tecnicosService";
import { createServicio } from "../api/serviciosService";
import { useAuth } from "../context/AuthContext";

export default function ScheduleModal({ show, onClose, service, onSuccess }) {
  const { username, isCliente } = useAuth(); 
  
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  
  const [clienteId, setClienteId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      if (service) setDescripcion(`Solicitud de: ${service.nombre}`);

      // 1. Cargar Clientes y Auto-seleccionar
      getClientes().then((data) => {
        setClientes(data);
        
        if (isCliente) {
          // --- LOGS DE DEPURACIÓN (Míralos con F12 -> Console) ---
          console.log("🔍 Buscando perfil para:", username);
          
          // Búsqueda insensible a mayúsculas/minúsculas para evitar errores
          const miPerfil = data.find(c => 
            c.email.trim().toLowerCase() === username?.trim().toLowerCase()
          );

          if (miPerfil) {
            console.log("✅ Perfil encontrado:", miPerfil);
            setClienteId(miPerfil.id);
          } else {
            console.error("❌ ERROR CRÍTICO: No se encontró ficha de cliente para el usuario:", username);
            console.warn("Lista de clientes disponibles:", data);
            alert("Error: Tu usuario no tiene un perfil de cliente asociado. Por favor regístrate nuevamente.");
          }
        }
      });

      // 2. Cargar Técnicos
      getTecnicos().then((data) => {
        const disponibles = data.filter(t => t.disponible); 
        setTecnicos(disponibles);
      }).catch(err => console.error("Error cargando técnicos", err));
    }
  }, [show, service, username, isCliente]);

  const handleSave = async () => {
    if (!clienteId || !descripcion) {
      alert("Error: No se pudo identificar al cliente o falta la descripción.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        descripcionProblema: descripcion,
        estado: "PENDIENTE",
        cliente: { id: parseInt(clienteId) }
      };

      if (tecnicoId) {
        payload.tecnico = { id: parseInt(tecnicoId) };
        payload.estado = "ASIGNADO";
      }

      await createServicio(payload);

      alert("¡Servicio agendado exitosamente!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el servicio.");
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
            
            {/* Si NO es cliente (es Admin o Técnico), mostramos el selector */}
            {!isCliente && (
              <Col md={12}>
                <Form.Label>Seleccionar Cliente</Form.Label>
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

            {/* Si es cliente, mostramos su nombre como confirmación visual (opcional) */}
            {isCliente && (
               <Col md={12}>
                 <Form.Label>Cliente</Form.Label>
                 <Form.Control type="text" value={username} disabled className="bg-light" />
               </Col>
            )}

            <Col md={12}>
              <Form.Label>Seleccionar Técnico (Opcional)</Form.Label>
              <Form.Select 
                value={tecnicoId} 
                onChange={(e) => setTecnicoId(e.target.value)}
              >
                <option value="">-- Asignar automáticamente más tarde --</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.apellido} - {t.especialidad}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={12}>
              <Form.Label>Detalle del Problema</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
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