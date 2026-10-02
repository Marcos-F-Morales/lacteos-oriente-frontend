// src/views/Alertas.jsx — Responsive móvil
import { useEffect, useState } from "react";
import { AlertTriangle, Thermometer, FlaskConical, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { getAlertas, resolverAlerta } from "../utils/api";
import { fmtFechaHora } from "../utils/constants";

const isMob = () => window.innerWidth <= 768;

export default function Alertas() {
  const [alertas,  setAlertas]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [demo,     setDemo]     = useState(false);
  const [horas,    setHoras]    = useState(24);
  const [mobile,   setMobile]   = useState(isMob());

  useEffect(() => {
    const handler = () => setMobile(isMob());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const cargar = async (h = horas) => {
    setCargando(true);
    try {
      const { data } = await getAlertas(h);
      setAlertas(data.alertas || []); setDemo(false);
    } catch { setAlertas([]); setDemo(true); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(horas); }, [horas]);

  const resolver = async (id) => {
    try {
      await resolverAlerta(id);
      setAlertas(a => a.filter(al => al.id !== id));
      toast.success("Alerta resuelta");
    } catch { toast.error("No se pudo resolver"); }
  };

  const colorTipo = { TEMP_ALTA:"#e74c3c", PH_BAJO:"#f59e0b", PH_ALTO:"#f59e0b", DENSIDAD:"#a855f7" };
  const iconTipo  = { TEMP_ALTA:Thermometer, PH_BAJO:FlaskConical, PH_ALTO:FlaskConical };
  const labelTipo = { TEMP_ALTA:"Temperatura Alta", PH_BAJO:"pH Bajo", PH_ALTO:"pH Alto", DENSIDAD:"Densidad Fuera Rango" };
  const pad = mobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:pad, display:"flex", flexDirection:"column", gap:16, paddingBottom: mobile?80:pad }} className="fade-up">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: mobile?26:38, fontWeight:800, letterSpacing:"-0.02em" }}>Alertas.</h1>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <select value={horas} onChange={e => setHoras(Number(e.target.value))}
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:8, color:"#fff", padding:"7px 10px", fontSize:12, cursor:"pointer" }}>
            <option value={6}>6 horas</option>
            <option value={24}>24 horas</option>
            <option value={72}>3 días</option>
            <option value={168}>1 semana</option>
          </select>
          <button onClick={() => cargar(horas)} disabled={cargando}
            style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"7px 12px", fontSize:12, color:"rgba(255,255,255,0.70)", cursor:"pointer" }}>
            <RefreshCw size={12} style={{ animation: cargando?"spin 1s linear infinite":"none" }}/>
            {!mobile && "Actualizar"}
          </button>
          {alertas.length > 0 && (
            <span style={{ background:"rgba(231,76,60,0.15)", border:"1px solid rgba(231,76,60,0.35)", borderRadius:999, padding:"5px 12px", fontSize:12, fontWeight:700, color:"#e74c3c", display:"flex", alignItems:"center", gap:5 }}>
              <AlertTriangle size={12}/> {alertas.length}
            </span>
          )}
        </div>
      </div>

      {cargando ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"64px 0" }}>
          <span className="spinner" style={{ width:32, height:32 }}/>
        </div>
      ) : alertas.length === 0 ? (
        <div className="navy-card" style={{ padding:"48px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:12, color:"#2ecc71" }}>
          <CheckCircle size={44}/>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>Sin alertas activas</p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", textAlign:"center" }}>
            {demo ? "No se pudo conectar al backend." : "Todos los parámetros están en rango."}
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {alertas.map((a) => {
            const color = colorTipo[a.tipo] || "#e74c3c";
            const Icon  = iconTipo[a.tipo]  || AlertTriangle;
            return (
              <div key={a.id} className="navy-card" style={{ padding: mobile?"14px":"20px", borderLeft:`3px solid ${color}` }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={16} color={color}/>
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <p style={{ fontWeight:700, fontSize:13 }}>
                        {labelTipo[a.tipo] || a.tipo}
                        {a.numero_lote && <span style={{ color:"#6a9fd8", marginLeft:8, fontWeight:400, fontSize:12 }}>#{a.numero_lote}</span>}
                      </p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.50)", marginTop:2 }}>
                        {a.origen || "—"} · Valor: <strong style={{ color }}>{a.valor}</strong> / Lím: {a.limite}
                      </p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.30)", marginTop:3 }}>
                        {a.creada_en ? fmtFechaHora(a.creada_en) : "—"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => resolver(a.id)}
                    style={{ fontSize:11, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"4px 10px", color:"rgba(255,255,255,0.60)", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
                    Resolver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}