// src/App.js
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Sidebar, TopBar, MobileNav } from "./components/Layout";
import Login          from "./views/Login";
import Dashboard      from "./views/Dashboard";
import Analisis       from "./views/Analisis";
import Inventario     from "./views/Inventario";
import Trazabilidad   from "./views/Trazabilidad";
import Alertas        from "./views/Alertas";
import Perfil         from "./views/Perfil";
import Configuracion  from "./views/Configuracion";
import Administracion from "./views/Administracion";

function AppLayout({ usuario, handleLogout }) {
  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <Sidebar usuario={usuario} onLogout={handleLogout}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <TopBar sensorOk={true} numAlertas={2} usuario={usuario} onLogout={handleLogout}/>
        <main style={{ flex:1, overflowY:"auto" }}>
          <Outlet/>
        </main>
        {/* Barra inferior para móvil */}
        <MobileNav usuario={usuario} onLogout={handleLogout}/>
      </div>
    </div>
  );
}

function ProtectedRoute({ autenticado }) {
  return autenticado ? <Outlet/> : <Navigate to="/" replace/>;
}

function AdminRoute({ usuario }) {
  if (!usuario) return <Navigate to="/dashboard" replace/>;
  if (usuario.rol !== "administrador") return <Navigate to="/dashboard" replace/>;
  return <Outlet/>;
}

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario,     setUsuario]     = useState(null);
  const [cargando,    setCargando]    = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const uData = localStorage.getItem("usuario");
    if (token && uData) {
      try {
        const u = JSON.parse(uData);
        import("./utils/api").then(({ default: api }) => {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        });
        setUsuario(u);
        setAutenticado(true);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }
    }
    setCargando(false);
  }, []);

  const handleLogin = (u, token) => {
    localStorage.setItem("token",   token);
    localStorage.setItem("usuario", JSON.stringify(u));
    import("./utils/api").then(({ default: api }) => {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    });
    setUsuario(u);
    setAutenticado(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    import("./utils/api").then(({ default: api }) => {
      delete api.defaults.headers.common["Authorization"];
    });
    setUsuario(null);
    setAutenticado(false);
  };

  if (cargando) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a1628" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <span className="spinner" style={{ width:36, height:36 }}/>
          <p style={{ color:"rgba(255,255,255,0.40)", fontSize:13, fontFamily:"Inter,sans-serif" }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right"
        toastOptions={{
          style: { background:"#0d1e36", color:"#fff", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13 },
          success: { iconTheme: { primary:"#2ecc71", secondary:"#fff" } },
          error:   { iconTheme: { primary:"#e74c3c", secondary:"#fff" } },
        }}/>

      <Routes>
        <Route path="/"
          element={autenticado ? <Navigate to="/dashboard" replace/> : <Login onLogin={handleLogin}/>}/>

        <Route element={<ProtectedRoute autenticado={autenticado}/>}>
          <Route element={<AppLayout usuario={usuario} handleLogout={handleLogout}/>}>
            <Route path="/dashboard"     element={<Dashboard/>}/>
            <Route path="/analisis"      element={<Analisis usuario={usuario}/>}/>
            <Route path="/inventario"    element={<Inventario/>}/>
            <Route path="/trazabilidad"  element={<Trazabilidad/>}/>
            <Route path="/alertas"       element={<Alertas/>}/>
            <Route path="/perfil"        element={<Perfil usuario={usuario} onLogout={handleLogout}/>}/>
            <Route path="/configuracion" element={<Configuracion/>}/>
            <Route element={<AdminRoute usuario={usuario}/>}>
              <Route path="/administracion" element={<Administracion usuario={usuario}/>}/>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}