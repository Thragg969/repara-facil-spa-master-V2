import React, { useEffect, useState } from "react";
import { getClientes, createCliente, updateCliente, deleteCliente } from "../api/clientesService";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Estados del Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  // Formulario específico para CLIENTES
  const initialFormState = {
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "" 
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = () => {
    setLoading(true);
    getClientes()
      .then((data) => setClientes(data))
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
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

  const handleOpenEdit = (cliente) => {
    setEditId(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    // Validación básica
    if (!formData.nombre || !formData.email || !formData.direccion) {
      alert("Completa los campos obligatorios (*)");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await updateCliente(editId, formData);
        alert("¡Cliente actualizado!");
      } else {
        await createCliente(formData);
        alert("¡Cliente registrado!");
      }
      cargarClientes();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error al guardar. Verifica el email.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este cliente? Se borrarán sus datos.")) {
      try {
        await deleteCliente(id);
        cargarClientes();
      } catch (error) {
        alert("No se pudo eliminar.");
      }
    }
  };

  if (loading) return <div className="text-center py-5">Cargando clientes...</div>;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        
        {/* --- HEADER --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-0">Gestión de Clientes</h2>
            <p className="text-muted small mb-0">Administra la base de datos de usuarios</p>
          </div>

          <div className="d-flex gap-2">
            {/* Toggle Vista */}
            <div className="btn-group shadow-sm" role="group">
              <button 
                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-white bg-white text-dark border'}`}
                onClick={() => setViewMode('grid')}
                title="Cuadrícula"
              >
                <i className="bi bi-grid-fill"></i>
              </button>
              <button 
                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-white bg-white text-dark border'}`}
                onClick={() => setViewMode('list')}
                title="Lista"
              >
                <i className="bi bi-list-ul"></i>
              </button>
            </div>

            {/* Botón Crear */}
            <Button variant="success" className="shadow-sm" onClick={handleOpenCreate}>
              <i className="bi bi-person-plus-fill me-2"></i> Nuevo Cliente
            </Button>
          </div>
        </div>

        {clientes.length === 0 ? (
          <div className="alert alert-info text-center py-4 shadow-sm">
            <h4>No hay clientes registrados</h4>
            <p>Registra al primero usando el botón "Nuevo Cliente".</p>
          </div>
        ) : (
          <>
            {/* --- VISTA GRID (3 por fila) --- */}
            {viewMode === 'grid' && (
              <div className="row g-4">
                {clientes.map((c) => (
                  <div key={c.id} className="col-md-6 col-lg-4 d-flex align-items-stretch">
                    <div className="card w-100 shadow-sm border-0 h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
                            {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                          </div>
                          <div>
                            <h5 className="card-title fw-bold mb-0">{c.nombre} {c.apellido}</h5>
                            <small className="text-muted">ID: #{c.id}</small>
                          </div>
                        </div>
                        
                        <div className="small text-secondary space-y-2">
                          <p className="mb-1"><i className="bi bi-envelope me-2"></i>{c.email}</p>
                          <p className="mb-1"><i className="bi bi-telephone me-2"></i>{c.telefono}</p>
                          <p className="mb-0"><i className="bi bi-geo-alt me-2"></i>{c.direccion}</p>
                        </div>
                      </div>

                      <div className="card-footer bg-white border-top-0 d-flex justify-content-between p-3 pt-0">
                        <Button variant="outline-primary" size="sm" className="flex-grow-1 me-1" onClick={() => handleOpenEdit(c)}>
                          <i className="bi bi-pencil-square me-1"></i> Editar
                        </Button>
                        <Button variant="outline-danger" size="sm" className="flex-grow-1 ms-1" onClick={() => handleDelete(c.id)}>
                          <i className="bi bi-trash me-1"></i> Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- VISTA LISTA (Tabla) --- */}
            {viewMode === 'list' && (
              <div className="card shadow border-0 overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-secondary small text-uppercase">
                      <tr>
                        <th className="ps-4 py-3">Cliente</th>
                        <th>Contacto</th>
                        <th>Dirección</th>
                        <th className="text-end pe-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {clientes.map((c) => (
                        <tr key={c.id}>
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center me-3 border" style={{width: '40px', height: '40px', fontWeight: 'bold'}}>
                                {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                              </div>
                              <div>
                                <div className="fw-bold text-dark">{c.nombre} {c.apellido}</div>
                                <div className="text-muted small">#{c.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column small">
                              <span className="text-dark fw-medium">{c.email}</span>
                              <span className="text-muted">{c.telefono}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-secondary small"><i className="bi bi-geo-alt me-1"></i>{c.direccion}</span>
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-flex justify-content-end gap-2">
                              <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(c)}>
                                <i className="bi bi-pencil-square me-1"></i> Editar
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(c.id)}>
                                <i className="bi bi-trash me-1"></i> Eliminar
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

        {/* --- MODAL DE CLIENTES --- */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg">
          <Modal.Header closeButton className="bg-light">
            <Modal.Title className="fw-bold">
              {editId ? "✏️ Editar Cliente" : "🆕 Registrar Cliente"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="fw-semibold">Nombre <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-semibold">Apellido</Form.Label>
                  <Form.Control type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} />
                </Col>
                <Col md={12}>
                  <Form.Label className="fw-semibold">Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-semibold">Teléfono</Form.Label>
                  <Form.Control type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-semibold">Dirección <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} />
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </section>
  );
}