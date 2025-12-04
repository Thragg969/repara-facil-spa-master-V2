import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getAgenda, createAgenda, updateAgenda, cancelarAgenda } from "../api/agendaService";
import { getTecnicos } from "../api/tecnicosService";
import { getClientes } from "../api/clientesService"; 
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useAuth } from "../context/AuthContext"; 

export default function Agenda() {
  const { username, role } = useAuth(); 
  
  const [citas, setCitas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [myTechId, setMyTechId] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); 
  const [params] = useSearchParams();
  const techIdFilter = params.get("tech");

  // Estados del Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const initialFormState = {
    fechaInicio: "",
    fechaFin: "",
    estado: "RESERVADO",
    tecnicoId: "",
    clienteId: "",        
    descripcionProblema: "" 
  };
  const [formData, setFormData] = useState(initialFormState);

  const isTecnico = role === "TECNICO" || role === "ROLE_TECNICO";

  useEffect(() => {
    cargarDatos();
  }, [username, isTecnico]); 

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [agendaRes, tecnicosRes, clientesRes] = await Promise.all([
        getAgenda(),
        getTecnicos(),
        getClientes()
      ]);

      if (isTecnico) {
        const me = tecnicosRes.find(t => t.email?.trim().toLowerCase() === username?.trim().toLowerCase());
        if (me) {
            setMyTechId(me.id);
        }
      }

      const citasFormateadas = agendaRes.data.map(item => ({
        id: item.id,
        fechaRaw: item.fechaHoraInicio,
        fechaEndRaw: item.fechaHoraFin,
        fecha: new Date(item.fechaHoraInicio).toLocaleString(),
        cliente: item.servicio?.cliente ? `${item.servicio.cliente.nombre} ${item.servicio.cliente.apellido}` : "Desconocido",
        direccion: item.servicio?.cliente?.direccion || "Sin dirección",
        servicioDesc: item.servicio?.descripcionProblema || "Sin descripción",
        tecnicoNombre: item.tecnico ? `${item.tecnico.nombre} ${item.tecnico.apellido}` : "Sin asignar",
        tecnicoId: item.tecnico?.id,
        estado: item.estado
      }));

      setCitas(citasFormateadas);
      setTecnicos(tecnicosRes);
      setClientes(clientesRes);
    } catch (err) {
      console.error("Error cargando datos:", err);
      if(err.response && err.response.status === 403) {
          alert("Error de permisos (403). Intenta cerrar sesión y volver a entrar.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormData({
        ...initialFormState,
        tecnicoId: isTecnico && myTechId ? myTechId : "" 
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cita) => {
    setEditId(cita.id);
    const formatForInput = (dateStr) => dateStr ? new Date(dateStr).toISOString().slice(0, 16) : "";

    setFormData({
      ...initialFormState,
      fechaInicio: formatForInput(cita.fechaRaw),
      fechaFin: formatForInput(cita.fechaEndRaw),
      estado: cita.estado,
      tecnicoId: cita.tecnicoId || "",
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    if (!formData.fechaInicio || !formData.tecnicoId) {
      alert("Falta fecha o técnico.");
      return;
    }
    if (!editId && (!formData.clienteId || !formData.descripcionProblema)) {
       alert("Para nueva cita, selecciona Cliente y describe el Problema.");
       return;
    }

    setSaving(true);
    try {
      const fechaInicioISO = formData.fechaInicio.length === 16 ? formData.fechaInicio + ":00" : formData.fechaInicio;
      const fechaFinInput = formData.fechaFin || formData.fechaInicio;
      const fechaFinISO = fechaFinInput.length === 16 ? fechaFinInput + ":00" : fechaFinInput;

      let payload = {
        fechaHoraInicio: fechaInicioISO,
        fechaHoraFin: fechaFinISO, 
        estado: formData.estado,
        tecnico: { id: parseInt(formData.tecnicoId) }
      };

      if (editId) {
        await updateAgenda(editId, payload);
        alert("¡Cita actualizada!");
      } else {
        payload.servicio = {
            descripcionProblema: formData.descripcionProblema,
            estado: "ASIGNADO",
            cliente: { id: parseInt(formData.clienteId) },
            tecnico: { id: parseInt(formData.tecnicoId) }
        };

        await createAgenda(payload);
        alert("¡Cita y Servicio creados!");
      }
      
      cargarDatos();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error al guardar. Verifica permisos o datos.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    // Cambio de texto: Eliminar -> Cancelar
    if (window.confirm("¿Estás seguro de cancelar esta cita?")) {
      try {
        await cancelarAgenda(id); 
        cargarDatos();
      } catch (error) {
        alert("Error al cancelar la cita.");
      }
    }
  };

  const citasFiltradas = useMemo(() => {
    if (isTecnico && myTechId) {
        return citas.filter((c) => String(c.tecnicoId) === String(myTechId));
    }
    if (techIdFilter) {
        return citas.filter((c) => String(c.tecnicoId) === String(techIdFilter));
    }
    return citas;
  }, [citas, techIdFilter, isTecnico, myTechId]);

  if (loading) return <div className="text-center py-5">Cargando agenda...</div>;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-0">Agenda de Servicios</h2>
            <p className="text-muted small mb-0">
               {isTecnico ? "Mis asignaciones y citas" : "Gestión global de servicios"}
            </p>
          </div>

          <div className="d-flex gap-2">
             <div className="btn-group shadow-sm" role="group">
              <button className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-white bg-white text-dark border'}`} onClick={() => setViewMode('grid')}><i className="bi bi-grid-fill"></i></button>
              <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-white bg-white text-dark border'}`} onClick={() => setViewMode('list')}><i className="bi bi-list-ul"></i></button>
            </div>
            <Button variant="success" className="shadow-sm" onClick={handleOpenCreate}>
              <i className="bi bi-calendar-plus me-2"></i> Nueva Cita
            </Button>
          </div>
        </div>

        {citasFiltradas.length === 0 ? (
          <div className="alert alert-info text-center py-4 shadow-sm">
            <h4>No hay citas programadas</h4>
            <p className="mb-0">Usa el botón verde para crear una nueva.</p>
          </div>
        ) : (
          <>
            {/* GRID */}
            {viewMode === 'grid' && (
              <div className="row g-4">
                {citasFiltradas.map((c) => (
                  <div key={c.id} className="col-md-6 col-lg-4 d-flex align-items-stretch">
                    <div className="card w-100 shadow-sm border-0 h-100">
                      <div className="card-header bg-white border-bottom-0 pt-3 d-flex justify-content-between">
                        <span className="badge bg-primary">{c.estado}</span>
                        <small className="text-muted">#{c.id}</small>
                      </div>
                      <div className="card-body pt-0">
                        <h5 className="text-dark fw-bold mb-3"><i className="bi bi-clock text-primary me-2"></i>{c.fecha}</h5>
                        <div className="small text-secondary d-flex flex-column gap-2">
                          <div><strong>Cliente:</strong> {c.cliente}</div>
                          <div><strong>Servicio:</strong> {c.servicioDesc}</div>
                          {!isTecnico && <div><strong>Técnico:</strong> {c.tecnicoNombre}</div>}
                          <div><i className="bi bi-geo-alt me-1"></i> {c.direccion}</div>
                        </div>
                      </div>
                      <div className="card-footer bg-white border-top-0 d-flex gap-2">
                        <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => handleOpenEdit(c)}>Gestionar</Button>
                        <Button variant="outline-danger" size="sm" className="flex-grow-1" onClick={() => handleDelete(c.id)}>Cancelar</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LISTA (BOTONES GRANDES Y VISIBLES) */}
            {viewMode === 'list' && (
              <div className="card shadow border-0 overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-secondary small text-uppercase">
                      <tr>
                        <th className="ps-4">Fecha</th>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        {!isTecnico && <th>Técnico</th>}
                        <th>Estado</th>
                        <th className="text-end pe-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {citasFiltradas.map((c) => (
                        <tr key={c.id}>
                          <td className="ps-4 fw-bold">{c.fecha}</td>
                          <td>
                            <div className="d-flex flex-column small">
                              <span className="fw-bold">{c.cliente}</span>
                              <span className="text-muted">{c.direccion}</span>
                            </div>
                          </td>
                          <td className="small">{c.servicioDesc}</td>
                          {!isTecnico && <td className="small">{c.tecnicoNombre}</td>}
                          <td><span className="badge bg-light text-dark border">{c.estado}</span></td>
                          <td className="text-end pe-4">
                            {/* BOTONES MEJORADOS: MÁS GRANDES Y CON TEXTO */}
                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="warning" className="text-dark fw-bold px-3 shadow-sm" onClick={() => handleOpenEdit(c)}>
                                    <i className="bi bi-pencil-square me-2"></i> Editar
                                </Button>
                                {/* Botón visible para todos (incluido técnicos) */}
                                <Button variant="danger" className="fw-bold px-3 shadow-sm" onClick={() => handleDelete(c.id)}>
                                    <i className="bi bi-x-circle me-2"></i> Cancelar
                                </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg">
          <Modal.Header closeButton className="bg-light">
            <Modal.Title className="fw-bold">
              {editId ? "✏️ Gestionar Cita" : "📅 Crear Servicio y Agendar"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Row className="g-3">
                
                {!editId && (
                    <Col md={12} className="bg-light p-3 rounded mb-2 border">
                        <h6 className="fw-bold text-primary mb-3">1. Datos del Nuevo Servicio</h6>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Cliente</Form.Label>
                                <Form.Select name="clienteId" value={formData.clienteId} onChange={handleInputChange}>
                                    <option value="">-- Selecciona Cliente --</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Problema</Form.Label>
                                <Form.Control type="text" name="descripcionProblema" placeholder="Ej: Lavadora no enciende" value={formData.descripcionProblema} onChange={handleInputChange} />
                            </Col>
                        </Row>
                    </Col>
                )}

                <Col md={12}>
                    <h6 className="fw-bold text-success mb-3">{!editId ? "2. Datos de la Cita" : "Editar Datos de Cita"}</h6>
                </Col>

                <Col md={12}>
                  <Form.Label className="small fw-bold">Técnico Asignado</Form.Label>
                  <Form.Select 
                    name="tecnicoId" 
                    value={formData.tecnicoId} 
                    onChange={handleInputChange}
                    disabled={isTecnico} // BLOQUEAR si es técnico
                    className={isTecnico ? "bg-secondary-subtle" : ""}
                  >
                    <option value="">-- Selecciona Técnico --</option>
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} {t.apellido} - {t.especialidad}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={6}>
                  <Form.Label className="small fw-bold">Inicio</Form.Label>
                  <Form.Control type="datetime-local" name="fechaInicio" value={formData.fechaInicio} onChange={handleInputChange} />
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-bold">Fin (Estimado)</Form.Label>
                  <Form.Control type="datetime-local" name="fechaFin" value={formData.fechaFin} onChange={handleInputChange} />
                </Col>

                <Col md={12}>
                  <Form.Label className="small fw-bold">Estado</Form.Label>
                  <Form.Select name="estado" value={formData.estado} onChange={handleInputChange}>
                    <option value="RESERVADO">RESERVADO</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="DISPONIBLE">DISPONIBLE</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </Form.Select>
                </Col>

              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</Button>
            <Button variant="success" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar Todo"}
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </section>
  );
}