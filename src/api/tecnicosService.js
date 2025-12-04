import api from "./api";

// Obtener todos los técnicos
export const getTecnicos = async () => {
  const response = await api.get("/tecnicos");
  return response.data;
};

// Obtener un técnico por ID
export const getTecnicoById = async (id) => {
  const response = await api.get(`/tecnicos/${id}`);
  return response.data;
};

// Crear Técnico
export const createTecnico = async (tecnicoData) => {
  const response = await api.post("/tecnicos", tecnicoData);
  return response.data;
};

// Actualizar técnico
export const updateTecnico = async (id, tecnicoData) => {
  const response = await api.put(`/tecnicos/${id}`, tecnicoData);
  return response.data;
};

// --- ESTA ES LA FUNCIÓN QUE TE FALTA ---
export const deleteTecnico = async (id) => {
  await api.delete(`/tecnicos/${id}`);
};