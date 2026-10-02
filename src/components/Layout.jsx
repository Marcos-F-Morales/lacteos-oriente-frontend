import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, Package, GitBranch,
  Bell, Settings, LogOut, User, ShieldCheck
} from "lucide-react";
import logoImg from "../assets/logo.png";

// ─── Logo como imagen real ────────────────────────────────────
export function LogoImg({ size = "md" }) {
  const d = size === "sm" ? 48 : size === "lg" ? 100 : 68;
  return (
    <img
      src={logoImg}
      alt="Lácteos de Oriente"
      style={{
        width: d, height: d,
        objectFit: "contain",
        borderRadius: "50%",
        flexShrink: 0,
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))"
      }}
    />
  );
}

// ─── Logo banner horizontal para sidebar ─────────────────────
export function LogoBanner() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <LogoImg size="sm"/>
      <div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:14, lineHeight:1.2, color:"#fff" }}>
          Lácteos de Oriente
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", letterSpacing:"0.08em" }}>
          LO FRESCO MEJOR
        </div>
      </div>
    </div>
  );
}

// ─── Logo grande para Login y Perfil ─────────────────────────
export function LogoSeal({ size = "md" }) {
  return <LogoImg size={size}/>;
}

// ─── Navegación base (todos los usuarios) ────────────────────
const NAV_BASE = [
  { path:"/dashboard",     label:"Dashboard",     icon:LayoutDashboard },
  { path:"/analisis",      label:"Análisis",      icon:Activity        },
  { path:"/inventario",    label:"Inventario",    icon:Package         },
  { path:"/trazabilidad",  label:"Trazabilidad",  icon:GitBranch       },
  { path:"/alertas",       label:"Alertas",       icon:Bell            },
  { path:"/configuracion", label:"Configuración", icon:Settings        },
];

// ─── Sidebar ──────────────────────────────────────────────────
export function Sidebar({ usuario, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Agrega la pestaña de Administración solo si el usuario es admin
  const NAV = [
    ...NAV_BASE,
    ...(usuario?.rol === "administrador"
      ? [{ path:"/administracion", label:"Administración", icon:ShieldCheck }]
      : [])
  ];

  return (
    <aside style={{
      width:228,
      background:"rgba(10,22,40,0.97)",
      borderRight:"1px solid rgba(255,255,255,0.09)",
      display:"flex", flexDirection:"column",
      height:"100vh", flexShrink:0, position:"sticky", top:0
    }}>

      {/* Logo */}
      <div style={{ padding:"18px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <LogoBanner/>
      </div>

      {/* Navegación */}
      <nav style={{ flex:1, padding:10, display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
        {NAV.map(({ path, label, icon:Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`nav-item ${location.pathname === path ? "active" : ""}`}
          >
            <Icon size={16}/>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Usuario en la parte inferior */}
      <button
        onClick={() => navigate("/perfil")}
        style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"14px 16px",
          borderTop:"1px solid rgba(255,255,255,0.08)",
          background:"none", border:"none", cursor:"pointer",
          transition:"background 0.2s", width:"100%", textAlign:"left"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Avatar con iniciales reales */}
        <div style={{
          width:34, height:34, borderRadius:"50%", flexShrink:0,
          background: usuario?.rol === "administrador"
            ? "linear-gradient(135deg,#1d4080,#2456a4)"
            : "linear-gradient(135deg,#1a5c36,#2ecc71)",
          border:"1.5px solid rgba(255,255,255,0.35)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:800, color:"#fff"
        }}>
          {usuario?.initials || "?"}
        </div>
        <div style={{ overflow:"hidden" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {usuario?.nombre || "Usuario"}
          </div>
          <div style={{ fontSize:11, color: usuario?.rol === "administrador" ? "#6a9fd8" : "rgba(255,255,255,0.40)" }}>
            {usuario?.rol || "operador"}
          </div>
        </div>
      </button>
    </aside>
  );
}

// ─── TopBar ───────────────────────────────────────────────────
export function TopBar({ sensorOk = true, numAlertas = 2, usuario, onLogout }) {
  const navigate      = useNavigate();
  const [menu, setMenu] = useState(false);

  const cerrarSesion = () => {
    setMenu(false);
    if (onLogout) onLogout();
    navigate("/");
  };

  return (
    <header style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      gap:20, padding:"13px 28px",
      background:"rgba(10,22,40,0.85)", backdropFilter:"blur(14px)",
      borderBottom:"1px solid rgba(255,255,255,0.08)",
      position:"sticky", top:0, zIndex:50
    }}>

      {/* Logo + nombre en topbar */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <img src={logoImg} alt="Logo"
          style={{ width:32, height:32, objectFit:"contain", borderRadius:"50%", opacity:0.9 }}/>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.85)" }}>
          Lácteos de Oriente
        </span>
      </div>

      {/* Derecha: sensor + campana + avatar */}
      <div style={{ display:"flex", alignItems:"center", gap:20 }}>

        {/* Estado del sensor ESP32 */}
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:600, color: sensorOk ? "#6a9fd8" : "#e74c3c" }}>
          <span style={{
            width:8, height:8, borderRadius:"50%", display:"inline-block",
            background: sensorOk ? "#6a9fd8" : "#e74c3c",
            boxShadow: sensorOk ? "0 0 6px #6a9fd8" : "none"
          }}/>
          {sensorOk ? "Sensor conectado" : "Sensor desconectado"}
        </div>

        {/* Campana de alertas */}
        <button onClick={() => navigate("/alertas")}
          style={{ background:"none", border:"none", cursor:"pointer", position:"relative", color:"rgba(255,255,255,0.55)" }}>
          <Bell size={19}/>
          {numAlertas > 0 && (
            <span style={{
              position:"absolute", top:-6, right:-6,
              background:"#e74c3c", borderRadius:"50%",
              width:16, height:16, fontSize:10, fontWeight:700, color:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              {numAlertas}
            </span>
          )}
        </button>

        {/* Avatar + dropdown */}
        <div style={{ position:"relative" }}>
          <button onClick={() => setMenu(!menu)}
            style={{
              width:32, height:32, borderRadius:"50%",
              background: usuario?.rol === "administrador"
                ? "linear-gradient(135deg,#1d4080,#2456a4)"
                : "linear-gradient(135deg,#1a5c36,#2ecc71)",
              border:"1.5px solid rgba(255,255,255,0.35)",
              cursor:"pointer", fontWeight:800, fontSize:12, color:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
            {usuario?.initials || "?"}
          </button>

          {menu && (
            <div className="navy-card" style={{
              position:"absolute", right:0, top:40,
              borderRadius:12, padding:8, minWidth:190, zIndex:100,
              boxShadow:"0 20px 60px rgba(0,0,0,0.6)"
            }}>
              {/* Info del usuario */}
              <div style={{ padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>
                  {usuario?.nombre || "Usuario"}
                </div>
                <div style={{ fontSize:11, color: usuario?.rol === "administrador" ? "#6a9fd8" : "#2ecc71" }}>
                  {usuario?.rol || "operador"}
                </div>
                {usuario?.email && (
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.30)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {usuario.email}
                  </div>
                )}
              </div>

              {/* Opciones del menú */}
              {[
                { label:"Ver Perfil",    icon:User,    go:"/perfil"        },
                { label:"Configuración", icon:Settings,go:"/configuracion" },
                // Mostrar Administración solo si es admin
                ...(usuario?.rol === "administrador"
                  ? [{ label:"Administración", icon:ShieldCheck, go:"/administracion" }]
                  : [])
              ].map(({ label, icon:Icon, go }) => (
                <button key={label}
                  onClick={() => { navigate(go); setMenu(false); }}
                  style={{
                    display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding:"10px 12px", borderRadius:8, fontSize:13,
                    color:"rgba(255,255,255,0.75)", background:"none",
                    border:"none", cursor:"pointer",
                    fontFamily:"Inter,sans-serif", textAlign:"left"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Icon size={14}/> {label}
                </button>
              ))}

              {/* Cerrar sesión */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:4, paddingTop:4 }}>
                <button onClick={cerrarSesion}
                  style={{
                    display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding:"10px 12px", borderRadius:8, fontSize:13, color:"#e74c3c",
                    background:"none", border:"none", cursor:"pointer",
                    fontFamily:"Inter,sans-serif", textAlign:"left"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(231,76,60,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <LogOut size={14}/> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}