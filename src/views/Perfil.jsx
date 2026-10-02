// src/views/Perfil.jsx — Responsive móvil
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Shield, LogOut } from "lucide-react";
import { LogoSeal } from "../components/Layout";

const isMob = () => window.innerWidth <= 768;

export default function Perfil({ usuario, onLogout }) {
  const navigate = useNavigate();
  const mobile   = isMob();

  const cerrarSesion = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  const rolColor = usuario?.rol === "administrador" ? "#6a9fd8" : "#2ecc71";
  const rolBg    = usuario?.rol === "administrador" ? "rgba(36,86,164,0.30)" : "rgba(26,154,82,0.25)";

  const Campo = ({ label, valor, icon: Icon }) => (
    <div>
      <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.40)", marginBottom:6 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <Icon size={14} color="rgba(255,255,255,0.30)" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
        <div style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:8, padding:"11px 14px 11px 38px", fontSize:13, color: valor?"#fff":"rgba(255,255,255,0.30)", fontFamily:"Inter,sans-serif" }}>
          {valor || "No registrado"}
        </div>
      </div>
    </div>
  );

  const pad = mobile ? "16px" : "36px 48px";

  return (
    <div style={{ display:"flex", minHeight:"calc(100vh - 58px)" }} className="fade-up">
      <div style={{ flex:1, padding:pad, display:"flex", flexDirection:"column", gap:20, overflowY:"auto", paddingBottom: mobile?90:pad }}>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: mobile?26:36, fontWeight:800, letterSpacing:"-0.02em" }}>
          Mi Perfil.
        </h1>

        {/* Avatar */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width: mobile?54:68, height: mobile?54:68, borderRadius:"50%", flexShrink:0,
            background: usuario?.rol==="administrador" ? "linear-gradient(135deg,#1d4080,#2456a4)" : "linear-gradient(135deg,#1a5c36,#2ecc71)",
            border:"2px solid rgba(255,255,255,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize: mobile?18:22, color:"#fff" }}>
            {usuario?.initials || "?"}
          </div>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize: mobile?16:20, fontWeight:800 }}>{usuario?.nombre || "Usuario"}</p>
            <span style={{ background:rolBg, border:`1px solid ${rolColor}`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:600, color:rolColor, display:"inline-block", marginTop:3 }}>
              {usuario?.rol || "operador"}
            </span>
            {!mobile && (
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.40)", marginTop:4 }}>{usuario?.email || ""} · Guatemala</p>
            )}
          </div>
        </div>

        {/* Datos */}
        <div className="navy-card" style={{ padding: mobile?"16px":"22px" }}>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Información Personal</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Campo label="Nombre completo"    valor={usuario?.nombre}   icon={User}   />
            <Campo label="Usuario"            valor={usuario?.usuario}  icon={User}   />
            <Campo label="Correo electrónico" valor={usuario?.email}    icon={Mail}   />
            <Campo label="Teléfono"           valor={usuario?.telefono} icon={Phone}  />
            <Campo label="Ciudad"             valor={usuario?.ciudad}   icon={MapPin} />
          </div>
          <div style={{ marginTop:14, background:"rgba(36,86,164,0.15)", border:"1px solid rgba(106,159,216,0.25)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.50)", display:"flex", alignItems:"flex-start", gap:8 }}>
            <Shield size={13} color="#6a9fd8" style={{ flexShrink:0, marginTop:1 }}/>
            <span>{usuario?.rol==="administrador"
              ? "Edita tus datos desde Administración → editar tu usuario."
              : "Para actualizar tus datos, contacta al administrador."
            }</span>
          </div>
        </div>

        {/* Cerrar sesión */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:16 }}>
          <p style={{ fontSize:13, fontWeight:700, color:"#e74c3c", display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <LogOut size={14}/> Cerrar Sesión
          </p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:12 }}>Salir del sistema</p>
          <button className="btn-danger-outline" onClick={cerrarSesion} style={{ width: mobile?"100%":"auto" }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Foto — solo desktop */}
      {!mobile && (
        <div style={{ width:"38%", position:"relative", overflow:"hidden", flexShrink:0 }}>
          <div className="bg-farm-photo" style={{ position:"absolute", inset:0 }}/>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,#0a1628 0%,rgba(10,22,40,0.10) 100%)" }}/>
          <div style={{ position:"absolute", top:40, right:40, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <LogoSeal size="lg"/>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:800, color:"#fff", textShadow:"0 2px 12px rgba(0,0,0,0.8)", marginTop:8 }}>Lácteos de Oriente</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.70)", letterSpacing:"0.06em", textShadow:"0 2px 8px rgba(0,0,0,0.8)" }}>Lo fresco mejor</p>
          </div>
        </div>
      )}
    </div>
  );
}