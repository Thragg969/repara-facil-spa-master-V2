import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { getClientes } from "../api/clientesService.js"; 
import { createAgenda } from "../api/agendaService.js"; 
import { getTecnicos, createTecnico, updateTecnico, deleteTecnico } from "../api/tecnicosService.js";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function Tecnicos() {
  const { role, username } = useAuth(); 
  const navigate = useNavigate();
  
  const [tecnicos, setTecnicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); 

  // --- Estados para el Modal de ADMIN ---
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // --- Estados para el Modal de AGENDAMIENTO ---
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    tecnicoId: null,
    tecnicoNombre: "",
    clienteId: "",
    fechaInicio: "",
    descripcion: ""
  });

  // Helpers de Roles
  const isAdmin = role === 'ROLE_ADMIN' || role === 'ADMIN';
  const isTecnico = role === 'ROLE_TECNICO' || role === 'TECNICO';

  const initialFormState = {
    nombre: "",
    apellido: "",
    email: "",
    password: "", 
    telefono: "",
    especialidad: "General",
    foto: "",
    disponible: true
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const techs = await getTecnicos();
      setTecnicos(techs);
      if (isAdmin) {
        const cls = await getClientes();
        setClientes(cls);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEdit = (tech) => {
    setEditId(tech.id);
    setFormData({
      nombre: tech.nombre,
      apellido: tech.apellido,
      email: tech.email,
      password: "", 
      telefono: tech.telefono,
      especialidad: tech.especialidad,
      foto: tech.foto || "",
      disponible: tech.disponible
    });
    setShowModal(true);
  };

  const handleSaveTecnico = async () => {
    if (!formData.nombre || !formData.email || !formData.especialidad) {
      alert("Completa los campos obligatorios (*)");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, foto: formData.foto || null };
      if (editId) await updateTecnico(editId, payload);
      else await createTecnico(payload);
      
      alert(editId ? "¡Técnico actualizado!" : "¡Técnico creado!");
      cargarDatos();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error al guardar técnico.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este técnico? Esta acción es irreversible.")) {
      try {
        await deleteTecnico(id);
        cargarDatos();
      } catch (error) {
        alert("No se pudo eliminar el técnico.");
      }
    }
  };

  const handleAbrirAgendar = (tech) => {
    if (!username && !isAdmin) {
        alert("Debes iniciar sesión para agendar.");
        navigate("/login");
        return;
    }
    
    if (isAdmin && clientes.length === 0) {
        getClientes().then(setClientes);
    }

    setBookingData({
        tecnicoId: tech.id,
        tecnicoNombre: `${tech.nombre} ${tech.apellido}`,
        clienteId: "",
        fechaInicio: "",
        descripcion: ""
    });
    setShowBookingModal(true);
  };

  // Acción temporal para el botón de contactar
  const handleContactar = (tech) => {
      alert(`Próximamente: Abrir chat con ${tech.nombre} ${tech.apellido}`);
  };

  const handleBookingSubmit = async () => {
    if (!bookingData.fechaInicio || !bookingData.descripcion) {
        alert("Por favor indica la fecha y describe el problema.");
        return;
    }

    if (isAdmin && !bookingData.clienteId) {
        alert("Como administrador, debes seleccionar a qué cliente asignar esta cita.");
        return;
    }

    setSaving(true);
    try {
        let finalClienteId = bookingData.clienteId;

        if (!isAdmin) {
            const clientesList = await getClientes();
            const miPerfil = clientesList.find(c => c.email?.trim().toLowerCase() === username?.trim().toLowerCase());
            
            if (!miPerfil) {
                alert("Error: No se encontró tu perfil de cliente asociado a este usuario.");
                setSaving(false);
                return;
            }
            finalClienteId = miPerfil.id;
        }

        const fechaInicioISO = new Date(bookingData.fechaInicio).toISOString();
        const fechaFinDate = new Date(bookingData.fechaInicio);
        fechaFinDate.setHours(fechaFinDate.getHours() + 2);

        const payload = {
            fechaHoraInicio: fechaInicioISO,
            fechaHoraFin: fechaFinDate.toISOString(),
            estado: "RESERVADO",
            tecnico: { id: bookingData.tecnicoId },
            servicio: {
                descripcionProblema: bookingData.descripcion,
                estado: "ASIGNADO",
                cliente: { id: parseInt(finalClienteId) },
                tecnico: { id: bookingData.tecnicoId }
            }
        };

        await createAgenda(payload);
        
        alert(`¡Cita agendada con éxito para ${bookingData.tecnicoNombre}!`);
        setShowBookingModal(false);
        
        if (isAdmin) navigate("/agenda");
        else navigate("/dashboard/cliente");

    } catch (error) {
        console.error("Error agendando:", error);
        alert("Error al agendar la cita. Revisa la consola.");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-5">Cargando datos...</div>;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-0">Personal Técnico</h2>
            <p className="text-muted small mb-0">
              {isAdmin ? "Administración de personal y asignación de servicios" : 
               isTecnico ? "Compañeros de trabajo y red de contactos" : 
               "Elige a tu experto de confianza"}
            </p>
          </div>

          <div className="d-flex gap-2">
            <div className="btn-group shadow-sm" role="group">
              <button className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-white bg-white text-dark border'}`} onClick={() => setViewMode('grid')}><i className="bi bi-grid-fill"></i></button>
              <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-white bg-white text-dark border'}`} onClick={() => setViewMode('list')}><i className="bi bi-list-ul"></i></button>
            </div>
            {isAdmin && (
              <Button variant="success" className="shadow-sm" onClick={handleOpenCreate}>
                <i className="bi bi-person-plus-fill me-2"></i>Nuevo Técnico
              </Button>
            )}
          </div>
        </div>

        {/* LISTADO */}
        {tecnicos.length === 0 ? (
          <div className="alert alert-info text-center py-4">No hay técnicos disponibles.</div>
        ) : (
          viewMode === 'grid' ? (
            // --- VISTA CUADRICULA ---
            <div className="row g-4">
              {tecnicos.map((t) => (
                <div key={t.id} className="col-md-6 col-lg-4 d-flex align-items-stretch">
                  <div className="card w-100 shadow-sm border-0 h-100 hover-card">
                    <div className="bg-light text-center py-4 border-bottom position-relative">
                      <img src={t.foto || "https://via.placeholder.com/150"} alt="Avatar" className="rounded-circle border shadow-sm" style={{ width: "100px", height: "100px", objectFit: "cover" }} onError={(e) => e.target.src = "https://via.placeholder.com/150"} />
                      <span className={`position-absolute top-0 end-0 m-3 badge rounded-pill ${t.disponible ? 'bg-success' : 'bg-secondary'}`}>{t.disponible ? 'Disponible' : 'Ocupado'}</span>
                    </div>
                    <div className="card-body text-center">
                      <h5 className="card-title fw-bold mb-1">{t.nombre} {t.apellido}</h5>
                      <span className="badge bg-info text-dark mb-3">{t.especialidad}</span>
                      {isAdmin && <div className="text-muted small mb-2"><i className="bi bi-envelope"></i> {t.email}</div>}
                    </div>
                    <div className="card-footer bg-white border-top-0 p-3 pt-0">
                      {/* LÓGICA DE BOTONES SEGÚN ROL */}
                      {isAdmin ? (
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex gap-2">
                                <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => handleOpenEdit(t)}>Editar</Button>
                                <Button variant="outline-danger" size="sm" className="flex-grow-1" onClick={() => handleDelete(t.id)}>Eliminar</Button>
                            </div>
                            <Button variant="primary" size="sm" onClick={() => handleAbrirAgendar(t)}>
                                <i className="bi bi-calendar-plus me-1"></i> Asignar a Cliente
                            </Button>
                        </div>
                      ) : isTecnico ? (
                        /* VISTA TÉCNICO: Botón Contactar */
                        <div className="d-grid">
                          <Button 
                            variant="info" 
                            className="text-white"
                            onClick={() => handleContactar(t)}
                          >
                            <i className="bi bi-chat-dots-fill me-2"></i> Contactar
                          </Button>
                        </div>
                      ) : (
                        /* VISTA CLIENTE: Botón Contratar */
                        <div className="d-grid">
                          <Button 
                            variant={t.disponible ? "primary" : "secondary"} 
                            disabled={!t.disponible}
                            onClick={() => t.disponible && handleAbrirAgendar(t)}
                          >
                            {t.disponible ? <><i className="bi bi-calendar-check me-2"></i> Solicitar Servicio</> : "No disponible"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // --- VISTA LISTA MEJORADA ---
            <div className="card shadow border-0 overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light"><tr><th>Profesional</th><th>Especialidad</th><th>Estado</th><th className="text-end" style={{minWidth: "320px"}}>Acciones</th></tr></thead>
                    <tbody>
                      {tecnicos.map((t) => (
                        <tr key={t.id}>
                          <td>
                             <div className="d-flex align-items-center gap-3">
                                <img src={t.foto || "https://via.placeholder.com/40"} className="rounded-circle" width="40" height="40" style={{objectFit:"cover"}} onError={(e) => e.target.src = "https://via.placeholder.com/40"} />
                                <div>
                                    <div className="fw-bold">{t.nombre} {t.apellido}</div>
                                    {isAdmin && <small className="text-muted">{t.email}</small>}
                                </div>
                             </div>
                          </td>
                          <td><span className="badge bg-light text-dark border">{t.especialidad}</span></td>
                          <td>
                            <span className={`badge rounded-pill ${t.disponible ? 'bg-success' : 'bg-secondary'}`}>
                                {t.disponible ? "Disponible" : "Ocupado"}
                            </span>
                          </td>
                          <td className="text-end">
                             {isAdmin ? (
                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant="warning" className="text-dark fw-bold" onClick={() => handleOpenEdit(t)}>
                                        <i className="bi bi-pencil-fill me-1"></i> Editar
                                    </Button>
                                    <Button variant="danger" className="fw-bold" onClick={() => handleDelete(t.id)}>
                                        <i className="bi bi-trash-fill me-1"></i> Eliminar
                                    </Button>
                                    <Button variant="primary" className="fw-bold px-3" onClick={() => handleAbrirAgendar(t)}>
                                        <i className="bi bi-calendar-plus-fill me-2"></i> Asignar
                                    </Button>
                                </div>
                             ) : isTecnico ? (
                                /* VISTA TÉCNICO: Botón Contactar */
                                <Button 
                                    variant="info"
                                    className="text-white fw-bold px-3" 
                                    onClick={() => handleContactar(t)}
                                >
                                    <i className="bi bi-chat-dots-fill me-2"></i> Contactar
                                </Button>
                             ) : (
                                /* VISTA CLIENTE: Botón Contratar */
                                <Button 
                                    variant="primary" 
                                    disabled={!t.disponible} 
                                    onClick={() => t.disponible && handleAbrirAgendar(t)}
                                >
                                    <i className="bi bi-calendar-check me-2"></i> Contratar
                                </Button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          )
        )}

        {/* MODAL GESTIÓN (SOLO ADMIN) */}
        {isAdmin && (
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>{editId ? "Editar Técnico" : "Registrar Técnico"}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="g-2">
                            <Col md={6}><Form.Label>Nombre</Form.Label><Form.Control name="nombre" value={formData.nombre} onChange={handleInputChange}/></Col>
                            <Col md={6}><Form.Label>Apellido</Form.Label><Form.Control name="apellido" value={formData.apellido} onChange={handleInputChange}/></Col>
                            <Col md={12}><Form.Label>Email</Form.Label><Form.Control name="email" value={formData.email} onChange={handleInputChange}/></Col>
                            
                            {/* CAMPO PASSWORD NUEVO */}
                            <Col md={12}>
                                <Form.Label>Contraseña {editId ? "(Dejar en blanco para no cambiar)" : "*"}</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    name="password" 
                                    placeholder={editId ? "********" : "Ingresa contraseña"} 
                                    value={formData.password} 
                                    onChange={handleInputChange}
                                />
                            </Col>

                            <Col md={6}><Form.Label>Teléfono</Form.Label><Form.Control name="telefono" value={formData.telefono} onChange={handleInputChange}/></Col>
                            <Col md={6}><Form.Label>Especialidad</Form.Label><Form.Select name="especialidad" value={formData.especialidad} onChange={handleInputChange}><option>General</option><option>Electricidad</option><option>Gasfitería</option><option>Electrónica</option><option>Computación</option></Form.Select></Col>
                            <Col md={12} className="mt-3"><Form.Check type="switch" label="Disponible para asignar" checked={formData.disponible} onChange={(e) => setFormData({...formData, disponible: e.target.checked})} /></Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveTecnico} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                </Modal.Footer>
            </Modal>
        )}

        {/* MODAL AGENDAR (VISIBLE PARA ADMIN Y CLIENTE) */}
        <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered size="lg">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>📅 Agendar con {bookingData.tecnicoNombre}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Form>
                    <Row className="g-3">
                        {isAdmin && (
                            <Col md={12}>
                                <Form.Label className="fw-bold text-danger">Asignar al Cliente (Admin)</Form.Label>
                                <Form.Select 
                                    value={bookingData.clienteId} 
                                    onChange={(e) => setBookingData({...bookingData, clienteId: e.target.value})}
                                    className="border-danger"
                                >
                                    <option value="">-- Selecciona un Cliente --</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.email})</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        )}

                        <Col md={12}>
                            <Form.Label className="fw-bold">Problema a solucionar</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                placeholder="Describe el problema..."
                                value={bookingData.descripcion}
                                onChange={(e) => setBookingData({...bookingData, descripcion: e.target.value})}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="fw-bold">Fecha y Hora</Form.Label>
                            <Form.Control 
                                type="datetime-local" 
                                value={bookingData.fechaInicio}
                                onChange={(e) => setBookingData({...bookingData, fechaInicio: e.target.value})}
                            />
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowBookingModal(false)} disabled={saving}>Cancelar</Button>
                <Button variant="success" onClick={handleBookingSubmit} disabled={saving}>
                    {saving ? "Procesando..." : "Confirmar Cita"}
                </Button>
            </Modal.Footer>
        </Modal>

      </div>
    </section>
  );
}