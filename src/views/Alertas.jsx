// src/views/Alertas.jsx — Responsive móvil
import { useEffect, useState } from "react";
import { AlertTriangle, Thermometer, FlaskConical, CheckCircle, RefreshCw, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { getAlertas, resolverAlerta } from "../utils/api";
import { fmtFechaHora } from "../utils/constants";

const isMob = () => window.innerWidth <= 768;
const POR_PAGINA = 7;

export default function Alertas() {
  const [alertas,  setAlertas]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [demo,     setDemo]     = useState(false);
  const [horas,    setHoras]    = useState(24);
  const [mobile,   setMobile]   = useState(isMob());
  const [pagina,   setPagina]   = useState(0);

  useEffect(() => {
    const handler = () => setMobile(isMob());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const cargar = async (h = horas) => {
    setCargando(true);
    setPagina(0);
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
      toast.dismiss();
      toast.success("Alerta resuelta", { id: "resolver" });
    } catch {
      toast.dismiss();
      toast.error("No se pudo resolver", { id: "resolver" });
    }
  };

  const colorTipo = { TEMP_ALTA:"#e74c3c", PH_BAJO:"#f59e0b", PH_ALTO:"#f59e0b", DENSIDAD:"#a855f7" };
  const iconTipo  = { TEMP_ALTA:Thermometer, PH_BAJO:FlaskConical, PH_ALTO:FlaskConical };
  const labelTipo = { TEMP_ALTA:"Temperatura Alta", PH_BAJO:"pH Bajo", PH_ALTO:"pH Alto", DENSIDAD:"Densidad Fuera Rango" };
  const pad = mobile ? "16px" : "28px 32px";

  const totalPags = Math.ceil(alertas.length / POR_PAGINA);
  const paginadas = alertas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  return (
    <div style={{ padding:pad, display:"flex", flexDirection:"column", gap:20, paddingBottom: mobile?80:pad }} className="fade-up">

      {/* ── Encabezado ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: mobile?26:38, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1 }}>
            Alertas.
          </h1>
          {!cargando && (
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.40)", marginTop:4 }}>
              {alertas.length > 0
                ? `${alertas.length} alerta${alertas.length > 1 ? "s" : ""} activa${alertas.length > 1 ? "s" : ""}`
                : "Sin alertas activas"}
            </p>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
            <Clock size={12} color="rgba(255,255,255,0.38)" style={{ position:"absolute", left:10, pointerEvents:"none", zIndex:1 }}/>
            <select value={horas} onChange={e => setHoras(Number(e.target.value))}
              style={{ background:"#0d1e36", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"7px 30px 7px 28px", fontSize:12, cursor:"pointer", outline:"none", appearance:"none", WebkitAppearance:"none", MozAppearance:"none", minWidth:130 }}>
              <option value={6}   style={{ background:"#0d1e36" }}>6 horas</option>
              <option value={24}  style={{ background:"#0d1e36" }}>24 horas</option>
              <option value={72}  style={{ background:"#0d1e36" }}>3 días</option>
              <option value={168} style={{ background:"#0d1e36" }}>1 semana</option>
            </select>
            <svg width="9" height="5" viewBox="0 0 9 5" style={{ position:"absolute", right:10, pointerEvents:"none" }}>
              <path d="M1 1l3.5 3L8 1" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          <button onClick={() => cargar(horas)} disabled={cargando}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"7px 13px", fontSize:12, color:"rgba(255,255,255,0.65)", cursor:"pointer" }}>
            <RefreshCw size={12} style={{ animation: cargando ? "spin 1s linear infinite" : "none" }}/>
            {!mobile && "Actualizar"}
          </button>

          {alertas.length > 0 && (
            <span style={{ background:"rgba(231,76,60,0.15)", border:"1px solid rgba(231,76,60,0.35)", borderRadius:999, padding:"5px 12px", fontSize:12, fontWeight:700, color:"#e74c3c", display:"flex", alignItems:"center", gap:5 }}>
              <AlertTriangle size={12}/> {alertas.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Contenido ── */}
      {cargando ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"64px 0" }}>
          <span className="spinner" style={{ width:32, height:32 }}/>
        </div>

      ) : alertas.length === 0 ? (
        <div className="navy-card" style={{ padding:"56px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(46,204,113,0.10)", border:"1px solid rgba(46,204,113,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CheckCircle size={26} color="#2ecc71"/>
          </div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>Sin alertas activas</p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.40)", textAlign:"center", maxWidth:280 }}>
            {demo ? "No se pudo conectar al backend." : "Todos los parámetros están dentro del rango aceptable."}
          </p>
        </div>

      ) : (
        <div className="navy-card" style={{ overflow:"hidden" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {paginadas.map((a) => {
              const color = colorTipo[a.tipo] || "#e74c3c";
              const Icon  = iconTipo[a.tipo]  || AlertTriangle;
              return (
                <div key={a.id}
                  style={{ padding: mobile ? "14px 16px" : "18px 22px", borderLeft:`3px solid ${color}`, borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>

                  <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, overflow:"hidden" }}>
                    <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:`${color}18`, border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon size={17} color={color}/>
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700, fontSize:13 }}>{labelTipo[a.tipo] || a.tipo}</span>
                        {a.numero_lote && (
                          <span style={{ background:"rgba(106,159,216,0.12)", border:"1px solid rgba(106,159,216,0.25)", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600, color:"#6a9fd8" }}>
                            #{a.numero_lote}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:12, color:"rgba(255,255,255,0.50)", marginTop:3 }}>
                        {a.origen || "—"} · Valor:&nbsp;
                        <strong style={{ color }}>{a.valor}</strong>
                        <span style={{ color:"rgba(255,255,255,0.35)" }}> / Lím: {a.limite}</span>
                      </p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                        {a.creada_en ? fmtFechaHora(a.creada_en) : "—"}
                      </p>
                    </div>
                  </div>

                  <button onClick={() => resolver(a.id)}
                    style={{ flexShrink:0, fontSize:11, fontWeight:600, background:"rgba(46,204,113,0.08)", border:"1px solid rgba(46,204,113,0.28)", borderRadius:7, padding:"6px 13px", color:"#2ecc71", cursor:"pointer", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", transition:"background 0.18s" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(46,204,113,0.18)"}
                    onMouseLeave={e => e.currentTarget.style.background="rgba(46,204,113,0.08)"}>
                    <CheckCircle size={12}/> Resolver
                  </button>
                </div>
              );
            })}
          </div>

          {totalPags > 1 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
              <button onClick={() => setPagina(p => Math.max(0, p-1))} disabled={pagina===0}
                style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, padding:"5px 12px", fontSize:12, color: pagina===0?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.70)", cursor: pagina===0?"default":"pointer" }}>
                <ChevronLeft size={13}/> Anterior
              </button>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.40)" }}>
                Página {pagina+1} de {totalPags} · {alertas.length} alertas
              </span>
              <button onClick={() => setPagina(p => Math.min(totalPags-1, p+1))} disabled={pagina===totalPags-1}
                style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, padding:"5px 12px", fontSize:12, color: pagina===totalPags-1?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.70)", cursor: pagina===totalPags-1?"default":"pointer" }}>
                Siguiente <ChevronRight size={13}/>
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}