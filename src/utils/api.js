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

/**
 * Guarda el token JWT y lo agrega a todos los requests futuros.
 * Se llama desde App.js después de un login exitoso.
 */
export const setToken = (token) => {
  localStorage.setItem("token", token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

/**
 * Elimina el token JWT y lo quita de los headers.
 * Se llama desde App.js al cerrar sesión.
 */
export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  delete api.defaults.headers.common["Authorization"];
};

/**
 * Carga el token guardado en localStorage al iniciar la app.
 * Se llama desde App.js en el useEffect inicial.
 */
export const loadToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  return token;
};

// ── Autenticación ─────────────────────────────────────────────

/** Verifica usuario y contraseña. Retorna token JWT y datos del usuario. */
export const postLogin = (creds) => api.post("/auth/login", creds);

/** Retorna los datos del usuario actual según el token guardado. */
export const getMe = () => api.get("/auth/me");

// ── IoT ───────────────────────────────────────────────────────

/** Última medición del ESP32. Se llama al presionar INICIAR ANÁLISIS. */
export const getUltimaMedicion = () => api.get("/iot/ultima");

/** Historial de mediciones para las gráficas del Dashboard. */
export const getHistorialIoT = (horas = 6) =>
  api.get(`/iot/historial?horas=${horas}&limit=200`);

// ── Lotes ─────────────────────────────────────────────────────

/** Crea un lote y lo clasifica automáticamente (APTA / NO APTA). */
export const crearLote = (datos) => api.post("/lotes", datos);

/** Lista todos los lotes con filtros opcionales. */
export const getLotes = (params) => api.get("/lotes", { params });

/** Detalle completo de un lote específico. */
export const getLote = (id) => api.get(`/lotes/${id}`);

// ── Inventario ────────────────────────────────────────────────

/** Totales acumulados y desglose por finca. */
export const getInventario = () => api.get("/inventario");

// ── Trazabilidad ──────────────────────────────────────────────

/** Historial agrupado por finca. */
export const getTrazabilidad = (params) => api.get("/trazabilidad", { params });

// ── Alertas ───────────────────────────────────────────────────

/** Alertas activas de temperatura y pH fuera de rango. */
export const getAlertas = (horas = 24) =>
  api.get(`/alertas?horas=${horas}&resuelta=false`);

/** Marca una alerta como resuelta. */
export const resolverAlerta = (id) => api.patch(`/alertas/${id}/resolver`);

// ── Umbrales ──────────────────────────────────────────────────

/** Obtiene los rangos actuales de clasificación. */
export const getUmbrales = () => api.get("/umbrales");

/** Actualiza los rangos de clasificación desde la vista Configuración. */
export const actualizarUmbrales = (datos) => api.put("/umbrales", datos);

// ── Proveedores ───────────────────────────────────────────────

/** Lista de fincas para el dropdown del formulario de Análisis. */
export const getProveedores = () => api.get("/proveedores");

// ── Administración — Usuarios (solo administrador) ────────────

/** Lista todos los usuarios del sistema. */
export const getUsuarios = () => api.get("/usuarios");

/** Crea un nuevo usuario. */
export const postUsuario = (datos) => api.post("/usuarios", datos);

/** Actualiza datos de un usuario existente. */
export const putUsuario = (id, datos) => api.put(`/usuarios/${id}`, datos);

/** Elimina un usuario permanentemente. */
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);

// ── Administración — Roles (solo administrador) ───────────────

/** Lista todos los roles disponibles. */
export const getRoles = () => api.get("/roles");

/** Crea un nuevo rol. */
export const postRol = (nombre, descripcion) =>
  api.post(`/roles?nombre=${encodeURIComponent(nombre)}&descripcion=${encodeURIComponent(descripcion || "")}`);

/** Elimina un rol (solo si no tiene usuarios asignados). */
export const deleteRol = (id) => api.delete(`/roles/${id}`);

export default api;