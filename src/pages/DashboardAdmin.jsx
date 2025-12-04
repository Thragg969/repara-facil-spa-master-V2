import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../api/api";
// Importamos los servicios para técnicos
import { createTecnico, deleteTecnico } from "../api/tecnicosService"; 
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export default function DashboardAdmin() {
  const { username } = useAuth();
  
  // 1. Estado para ESTADÍSTICAS (Lo que ya tenías)
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalTecnicos: 0,
    totalServicios: 0,
    totalGarantias: 0
  });

  // 2. Estado para la TABLA DE TÉCNICOS (Lo nuevo)
  const [tecnicosLista, setTecnicosLista] = useState([]);
  
  // Estados generales y de UI
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado del Formulario
  const initialFormState = {
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    especialidad: "General",
    foto: "https://via.placeholder.com/150",
    disponible: true
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  // --- FUNCIÓN MAESTRA: Carga Estadísticas + Lista de Técnicos ---
  const cargarDatosGenerales = async () => {
    try {
      setLoading(true);
      
      // Hacemos todas las peticiones en paralelo para que sea rápido
      const [clientesResp, tecnicosResp, serviciosResp, garantiasResp] = await Promise.all([
        api.get("/clientes"),
        api.get("/tecnicos"), // Aquí obtenemos la lista completa
        api.get("/servicios"),
        api.get("/garantias")
      ]);

      // 1. Actualizamos Estadísticas
      setStats({
        totalClientes: clientesResp.data.length,
        totalTecnicos: tecnicosResp.data.length, // Se actualiza solo
        totalServicios: serviciosResp.data.length,
        totalGarantias: garantiasResp.data.length
      });

      // 2. Actualizamos la Tabla de Técnicos
      setTecnicosLista(tecnicosResp.data);

    } catch (error) {
      console.error("Error cargando el dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- CREAR TÉCNICO ---
  const handleSave = async () => {
    if (!formData.nombre || !formData.email || !formData.especialidad) {
      alert("Por favor completa los campos obligatorios (*)");
      return;
    }

    setSaving(true);
    try {
      await createTecnico(formData); // Guardamos en BD
      
      // RECARGA AUTOMÁTICA: Actualiza tabla y contadores
      await cargarDatosGenerales(); 
      
      setShowModal(false);
      setFormData(initialFormState);
      alert("¡Técnico creado exitosamente!");
    } catch (error) {
      console.error("Error creando técnico:", error);
      alert("Error al crear. Verifica si el email ya existe.");
    } finally {
      setSaving(false);
    }
  };

  // --- ELIMINAR TÉCNICO ---
  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este técnico?")) {
      try {
        await deleteTecnico(id);
        await cargarDatosGenerales(); // Recarga tabla y contadores
      } catch (error) {
        console.error("Error eliminando:", error);
        alert("No se pudo eliminar el técnico.");
      }
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height: "80vh"}}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );

  return (
    <div className="container mt-5 mb-5">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold">🛠️ Panel de Administrador</h1>
          <p className="text-muted mb-0">Bienvenido, <strong>{username}</strong></p>
        </div>
        {/* Botón Principal de Acción */}
        <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-plus-fill me-2"></i>Nuevo Técnico
        </Button>
      </div>

      {/* --- SECCIÓN 1: TARJETAS DE ESTADÍSTICAS (Lo que ya tenías) --- */}
      <div className="row mb-5">
        <div className="col-md-3">
          <div className="card text-white bg-primary mb-3 shadow-sm h-100">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="card-title">Clientes</h5>
              <h2 className="display-4 fw-bold">{stats.totalClientes}</h2>
              <Link to="/clientes" className="text-white text-decoration-none small stretched-link">Ver detalles &rarr;</Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success mb-3 shadow-sm h-100">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="card-title">Técnicos</h5>
              <h2 className="display-4 fw-bold">{stats.totalTecnicos}</h2>
              <div className="small">Gestión activa</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning mb-3 shadow-sm h-100">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="card-title">Servicios</h5>
              <h2 className="display-4 fw-bold">{stats.totalServicios}</h2>
              <Link to="/servicios" className="text-white text-decoration-none small stretched-link">Ver detalles &rarr;</Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info mb-3 shadow-sm h-100">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="card-title">Garantías</h5>
              <h2 className="display-4 fw-bold">{stats.totalGarantias}</h2>
              <Link to="/garantias" className="text-white text-decoration-none small stretched-link">Ver detalles &rarr;</Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: TABLA DE GESTIÓN DE TÉCNICOS (Lo nuevo) --- */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="mb-0 fw-bold text-dark">👨‍🔧 Lista de Técnicos</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Perfil</th>
                <th>Especialidad</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tecnicosLista.length > 0 ? (
                tecnicosLista.map((tech) => (
                  <tr key={tech.id}>
                    <td className="fw-bold">#{tech.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <img 
                          src={tech.foto || "https://via.placeholder.com/40"} 
                          alt="Avatar" 
                          className="rounded-circle me-3 border"
                          style={{ width: "40px", height: "40px", objectFit: "cover" }}
                        />
                        <div>
                          <div className="fw-bold">{tech.nombre} {tech.apellido}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge bg-info text-dark">{tech.especialidad}</span></td>
                    <td>
                      <div className="small fw-semibold">{tech.email}</div>
                      <div className="small text-muted">{tech.telefono}</div>
                    </td>
                    <td>
                      {tech.disponible ? (
                        <span className="badge bg-success">Disponible</span>
                      ) : (
                        <span className="badge bg-secondary">Ocupado</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(tech.id)}
                        title="Eliminar técnico"
                      >
                        <i className="bi bi-trash"></i> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="text-muted mb-3">No hay técnicos registrados aún.</div>
                    <Button variant="outline-primary" size="sm" onClick={() => setShowModal(true)}>
                      Crear el primero
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL (POPUP) DE REGISTRO --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Técnico</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" name="nombre" 
                  value={formData.nombre} onChange={handleInputChange} 
                />
              </Col>
              <Col md={6}>
                <Form.Label>Apellido</Form.Label>
                <Form.Control 
                  type="text" name="apellido" 
                  value={formData.apellido} onChange={handleInputChange} 
                />
              </Col>
              <Col md={12}>
                <Form.Label>Email (Usuario de acceso) <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="email" name="email" placeholder="ejemplo@reparafacil.com"
                  value={formData.email} onChange={handleInputChange} 
                />
              </Col>
              <Col md={6}>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control 
                  type="text" name="telefono" 
                  value={formData.telefono} onChange={handleInputChange} 
                />
              </Col>
              <Col md={6}>
                <Form.Label>Especialidad <span className="text-danger">*</span></Form.Label>
                <Form.Select name="especialidad" value={formData.especialidad} onChange={handleInputChange}>
                  <option value="General">General</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Gasfitería">Gasfitería</option>
                  <option value="Electrónica">Electrónica</option>
                  <option value="Computación">Computación</option>
                  <option value="Refrigeración">Refrigeración</option>
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label>URL de Foto (Opcional)</Form.Label>
                <Form.Control 
                  type="text" name="foto" placeholder="https://..."
                  value={formData.foto} onChange={handleInputChange} 
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Crear Técnico"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}