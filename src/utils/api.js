// src/utils/api.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  res => res,
  err => {
    console.warn(`[API] ${err.config?.url} → ${err.response?.data?.detail || err.message}`);
    return Promise.reject(err);
  }
);

export const setToken = (token) => {
  localStorage.setItem("token", token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  delete api.defaults.headers.common["Authorization"];
};

export const loadToken = () => {
  const token = localStorage.getItem("token");
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  return token;
};

export const postLogin  = (creds) => api.post("/auth/login", creds);
export const getMe      = ()      => api.get("/auth/me");

export const getUltimaMedicion = ()           => api.get("/iot/ultima");
export const getHistorialIoT   = (horas = 6) => api.get(`/iot/historial?horas=${horas}&limit=200`);

export const crearLote = (datos)  => api.post("/lotes", datos);
export const getLotes  = (params) => api.get("/lotes", { params });
export const getLote   = (id)     => api.get(`/lotes/${id}`);

export const getInventario = () => api.get("/inventario");

export const getTrazabilidad = (params) => api.get("/trazabilidad", { params });

export const getAlertas     = (horas = 24) => api.get(`/alertas?horas=${horas}&resuelta=false`);
export const resolverAlerta = (id)         => api.patch(`/alertas/${id}/resolver`);
export const enviarAlertaTelegram = (datos) => api.post("/alertas/telegram", datos);

export const getUmbrales        = ()      => api.get("/umbrales");
export const actualizarUmbrales = (datos) => api.put("/umbrales", datos);

export const getProveedores = () => api.get("/proveedores");

export const getUsuarios   = ()          => api.get("/usuarios");
export const postUsuario   = (datos)     => api.post("/usuarios", datos);
export const putUsuario    = (id, datos) => api.put(`/usuarios/${id}`, datos);
export const deleteUsuario = (id)        => api.delete(`/usuarios/${id}`);

export const getRoles  = ()                    => api.get("/roles");
export const postRol   = (nombre, descripcion) => api.post(`/roles?nombre=${encodeURIComponent(nombre)}&descripcion=${encodeURIComponent(descripcion || "")}`);
export const deleteRol = (id)                  => api.delete(`/roles/${id}`);

// ── Reportes ──────────────────────────────────────────────────
export const getFincas = () => api.get("/reportes/fincas");

export const getReporteLotes = (periodo = "mes", finca = null) => {
  const params = new URLSearchParams({ periodo });
  if (finca) params.append("finca", finca);
  return api.get(`/reportes/lotes?${params}`);
};

export const getReporteInventario = (periodo = "mes") =>
  api.get(`/reportes/inventario?periodo=${periodo}`);

export const getReporteAlertas = (periodo = "mes") =>
  api.get(`/reportes/alertas?periodo=${periodo}`);

export default api;