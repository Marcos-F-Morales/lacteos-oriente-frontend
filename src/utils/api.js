// src/utils/api.js
// Centraliza TODAS las llamadas al backend.
// Si el backend no está corriendo, las vistas caen en modo demo automáticamente.

import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

// ── Interceptor: muestra errores claros en consola ────────────
api.interceptors.response.use(
  res => res,
  err => {
    console.warn(`[API] ${err.config?.url} → ${err.response?.data?.detail || err.message}`);
    return Promise.reject(err);
  }
);

// ── Helpers de sesión ─────────────────────────────────────────

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
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  return token;
};

// ── Autenticación ─────────────────────────────────────────────

export const postLogin  = (creds) => api.post("/auth/login", creds);
export const getMe      = ()      => api.get("/auth/me");

// ── IoT ───────────────────────────────────────────────────────

export const getUltimaMedicion = ()           => api.get("/iot/ultima");
export const getHistorialIoT   = (horas = 6) => api.get(`/iot/historial?horas=${horas}&limit=200`);

// ── Lotes ─────────────────────────────────────────────────────

export const crearLote = (datos)  => api.post("/lotes", datos);
export const getLotes  = (params) => api.get("/lotes", { params });
export const getLote   = (id)     => api.get(`/lotes/${id}`);

// ── Inventario ────────────────────────────────────────────────

export const getInventario = () => api.get("/inventario");

// ── Trazabilidad ──────────────────────────────────────────────

export const getTrazabilidad = (params) => api.get("/trazabilidad", { params });

// ── Alertas ───────────────────────────────────────────────────

export const getAlertas    = (horas = 24) => api.get(`/alertas?horas=${horas}&resuelta=false`);
export const resolverAlerta = (id)        => api.patch(`/alertas/${id}/resolver`);

/**
 * Envía una alerta inmediata por Telegram cuando el análisis
 * sale NO APTA, sin necesidad de guardar el lote primero.
 * @param {{ finca, operador, litros, motivo }} datos
 */
export const enviarAlertaTelegram = (datos) =>
  api.post("/alertas/telegram", datos);

// ── Umbrales ──────────────────────────────────────────────────

export const getUmbrales       = ()      => api.get("/umbrales");
export const actualizarUmbrales = (datos) => api.put("/umbrales", datos);

// ── Proveedores ───────────────────────────────────────────────

export const getProveedores = () => api.get("/proveedores");

// ── Administración — Usuarios ─────────────────────────────────

export const getUsuarios   = ()          => api.get("/usuarios");
export const postUsuario   = (datos)     => api.post("/usuarios", datos);
export const putUsuario    = (id, datos) => api.put(`/usuarios/${id}`, datos);
export const deleteUsuario = (id)        => api.delete(`/usuarios/${id}`);

// ── Administración — Roles ────────────────────────────────────

export const getRoles   = ()                      => api.get("/roles");
export const postRol    = (nombre, descripcion)   => api.post(`/roles?nombre=${encodeURIComponent(nombre)}&descripcion=${encodeURIComponent(descripcion || "")}`);
export const deleteRol  = (id)                    => api.delete(`/roles/${id}`);

export default api;