// src/views/Alertas.jsx
import { useEffect, useState } from "react";
import { AlertTriangle, Thermometer, FlaskConical, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { getAlertas, resolverAlerta } from "../utils/api";
import { fmtFechaHora } from "../utils/constants";

export default function Alertas() {
  const [alertas,  setAlertas]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [demo,     setDemo]     = useState(false);
  const [horas,    setHoras]    = useState(24);

  const cargar = async (h = horas) => {
    setCargando(true);
    try {
      const { data } = await getAlertas(h);
      setAlertas(data.alertas || []);
      setDemo(false);
    } catch {
      setAlertas([]);
      setDemo(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(horas); }, [horas]);

  const resolver = async (id) => {
    try {
      await resolverAlerta(id);
      setAlertas(a => a.filter(al => al.id !== id));
      toast.success("Alerta marcada como resuelta");
    } catch {
      toast.error("No se pudo resolver la alerta");
    }
  };

  const colorTipo = { TEMP_ALTA:"#e74c3c", PH_BAJO:"#f59e0b", PH_ALTO:"#f59e0b", DENSIDAD:"#a855f7" };
  const iconTipo  = { TEMP_ALTA:Thermometer, PH_BAJO:FlaskConical, PH_ALTO:FlaskConical };
  const labelTipo = { TEMP_ALTA:"Temperatura Alta", PH_BAJO:"pH Bajo", PH_ALTO:"pH Alto", DENSIDAD:"Densidad Fuera de Rango" };

  return (
    <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:22 }} className="fade-up">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:800, letterSpacing:"-0.02em" }}>Alertas.</h1>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Filtro por período */}
          <select value={horas} onChange={e => setHoras(Number(e.target.value))}
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:8, color:"#fff", padding:"8px 12px", fontSize:13, cursor:"pointer" }}>
            <option value={6}>Últimas 6 h</option>
            <option value={24}>Últimas 24 h</option>
            <option value={72}>Últimos 3 días</option>
            <option value={168}>Última semana</option>
          </select>
          <button onClick={() => cargar(horas)} disabled={cargando}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"8px 14px", fontSize:12, color:"rgba(255,255,255,0.70)", cursor:"pointer" }}>
            <RefreshCw size={13} style={{ animation: cargando ? "spin 1s linear infinite" : "none" }}/>
            Actualizar
          </button>
          {alertas.length > 0 && (
            <span style={{ background:"rgba(231,76,60,0.15)", border:"1px solid rgba(231,76,60,0.35)", borderRadius:999, padding:"6px 16px", fontSize:12, fontWeight:700, color:"#e74c3c", display:"flex", alignItems:"center", gap:6 }}>
              <AlertTriangle size={13}/> {alertas.length} activa{alertas.length !== 1 ? "s" : ""}
            </span>
          )}
          {demo && <span style={{ fontSize:11, color:"#f59e0b" }}>⚠ Sin conexión</span>}
        </div>
      </div>

      {cargando ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"64px 0" }}>
          <span className="spinner" style={{ width:32, height:32 }}/>
        </div>
      ) : alertas.length === 0 ? (
        <div className="navy-card" style={{ padding:"64px", display:"flex", flexDirection:"column", alignItems:"center", gap:12, color:"#2ecc71" }}>
          <CheckCircle size={48}/>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700 }}>Sin alertas activas</p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>
            {demo ? "No se pudo conectar al backend." : "Todos los parámetros están dentro del rango aceptable."}
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {alertas.map((a) => {
            const color = colorTipo[a.tipo] || "#e74c3c";
            const Icon  = iconTipo[a.tipo]  || AlertTriangle;
            return (
              <div key={a.id} className="navy-card" style={{ padding:"20px", borderLeft:`3px solid ${color}` }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={18} color={color}/>
                    </div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:14 }}>
                        {labelTipo[a.tipo] || a.tipo}
                        {a.numero_lote && <span style={{ color:"#6a9fd8", marginLeft:8, fontWeight:400, fontSize:13 }}>Lote {a.numero_lote}</span>}
                      </p>
                      <p style={{ fontSize:12, color:"rgba(255,255,255,0.50)", marginTop:2 }}>
                        {a.origen || "—"} · Valor: <strong style={{ color }}>{a.valor}</strong> / Límite: {a.limite}
                      </p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                      {a.creada_en ? fmtFechaHora(a.creada_en) : "—"}
                    </span>
                    <button onClick={() => resolver(a.id)}
                      style={{ fontSize:11, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"4px 12px", color:"rgba(255,255,255,0.60)", cursor:"pointer" }}>
                      Marcar resuelta
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}