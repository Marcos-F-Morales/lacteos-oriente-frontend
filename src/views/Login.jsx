// src/views/Login.jsx — Desktop original + móvil responsive
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User } from "lucide-react";
import { LogoSeal } from "../components/Layout";
import { postLogin } from "../utils/api";

// Hook correcto para detectar móvil con React
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Login({ onLogin }) {
  const navigate    = useNavigate();
  const isMobile    = useIsMobile();
  const [form,      setForm]     = useState({ usuario:"", password:"" });
  const [showPass,  setShowPass] = useState(false);
  const [cargando,  setCargando] = useState(false);
  const [error,     setError]    = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario || !form.password) { setError("Ingrese usuario y contraseña."); return; }
    setCargando(true);
    setError(null);
    try {
      const { data } = await postLogin({
        usuario:  form.usuario.trim().toLowerCase(),
        password: form.password,
      });
      onLogin({
        id:       data.id,
        nombre:   data.nombre,
        usuario:  data.usuario,
        rol:      data.rol,
        email:    data.email,
        telefono: data.telefono || null,
        ciudad:   data.ciudad   || null,
        initials: data.initials,
      }, data.token);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail;
      if      (msg === "Usuario no encontrado.")                          setError("El usuario no existe. Verifica el nombre de usuario.");
      else if (msg === "Contraseña incorrecta.")                          setError("Contraseña incorrecta. Intenta nuevamente.");
      else if (msg === "Usuario desactivado. Contacta al administrador.") setError("Tu cuenta está desactivada. Contacta al administrador.");
      else                                                                setError("No se pudo conectar al servidor. Verifica tu conexión.");
    } finally { setCargando(false); }
  };

  // ── MÓVIL ────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a1628", position:"relative", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center" }}>
        {/* Fondo foto */}
        <div className="bg-farm-photo" style={{ position:"fixed", inset:0, zIndex:0 }}/>
        <div style={{ position:"fixed", inset:0, background:"rgba(10,22,40,0.82)", zIndex:1 }}/>

        {/* Contenido centrado */}
        <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:400, padding:"40px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>

          {/* Logo */}
          <LogoSeal size="md"/>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:800, color:"#fff", marginTop:10, marginBottom:32, textAlign:"center" }}>
            Lácteos de Oriente
          </p>

          {/* Título */}
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:8, textAlign:"center", width:"100%" }}>
            Bienvenido<br/>de nuevo.
          </h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.50)", marginBottom:28, textAlign:"center" }}>
            ¿No tiene cuenta?{" "}
            <span style={{ color:"#6a9fd8", textDecoration:"underline", cursor:"pointer" }}>
              Contacte al administrador
            </span>
          </p>

          {/* Error */}
          {error && (
            <div style={{ background:"rgba(231,76,60,0.12)", border:"1px solid rgba(231,76,60,0.30)", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#fca5a5", marginBottom:16, display:"flex", alignItems:"center", gap:8, width:"100%" }}>
              ✗ {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14, width:"100%" }}>
            <div>
              <label style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:7 }}>Usuario</label>
              <div style={{ position:"relative" }}>
                <input className="input-navy" value={form.usuario}
                  onChange={e => setForm(p => ({ ...p, usuario:e.target.value }))}
                  placeholder="su.usuario" autoComplete="username"
                  style={{ fontSize:16 }}/>
                <User size={15} color="rgba(255,255,255,0.35)" style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:7 }}>Contraseña</label>
              <div style={{ position:"relative" }}>
                <input className="input-navy" type={showPass?"text":"password"}
                  value={form.password} onChange={e => setForm(p => ({ ...p, password:e.target.value }))}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ fontSize:16 }}/>
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.45)" }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={cargando} className="btn-navy"
              style={{ width:"100%", padding:"14px", fontSize:16, marginTop:4, borderRadius:10 }}>
              {cargando ? <><span className="spinner" style={{ width:18, height:18 }}/> Verificando...</> : "Iniciar Sesión"}
            </button>
          </form>

          <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:32, textAlign:"center" }}>
            v1.0 © 2025 Lácteos de Oriente — Guatemala
          </p>
        </div>
      </div>
    );
  }

  // ── DESKTOP — diseño original exacto ─────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0a1628" }}>

      {/* Izquierda — formulario */}
      <div style={{ width:"50%", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"48px 64px", position:"relative", zIndex:2 }}>

        <LogoSeal size="lg"/>

        <div style={{ maxWidth:400 }} className="fade-up">
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", color:"rgba(255,255,255,0.50)", textTransform:"uppercase", marginBottom:16 }}>
            Sistema de Calidad
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:10 }}>
            Bienvenido<br/>de nuevo.
          </h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.50)", marginBottom:36 }}>
            ¿No tiene cuenta?{" "}
            <span style={{ color:"#6a9fd8", textDecoration:"underline", cursor:"pointer" }}>
              Contacte al administrador
            </span>
          </p>

          {error && (
            <div style={{ background:"rgba(231,76,60,0.12)", border:"1px solid rgba(231,76,60,0.30)", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#fca5a5", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
              ✗ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:8 }}>Usuario</label>
              <div style={{ position:"relative" }}>
                <input className="input-navy" value={form.usuario}
                  onChange={e => setForm(p => ({ ...p, usuario:e.target.value }))}
                  placeholder="su.usuario" autoComplete="username" autoFocus/>
                <User size={15} color="rgba(255,255,255,0.35)"
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:8 }}>Contraseña</label>
              <div style={{ position:"relative" }}>
                <input className="input-navy" type={showPass?"text":"password"}
                  value={form.password} onChange={e => setForm(p => ({ ...p, password:e.target.value }))}
                  placeholder="••••••••" autoComplete="current-password"/>
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.45)" }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={cargando} className="btn-navy"
              style={{ width:"100%", padding:"13px", fontSize:15, marginTop:6 }}>
              {cargando ? <><span className="spinner" style={{ width:18, height:18 }}/> Verificando...</> : "Iniciar Sesión"}
            </button>
          </form>
        </div>

        <p style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>
          v1.0 © 2025 Lácteos de Oriente — Guatemala
        </p>
      </div>

      {/* Derecha — foto de finca */}
      <div style={{ width:"50%", position:"relative", overflow:"hidden" }}>
        <div className="bg-farm-photo" style={{ position:"absolute", inset:0 }}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,#0a1628 0%,rgba(10,22,40,0.25) 100%)" }}/>
      </div>
    </div>
  );
}