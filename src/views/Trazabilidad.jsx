// src/views/Trazabilidad.jsx
import { useState, useEffect, useCallback } from "react";
import { Search, Eye } from "lucide-react";
import { getLotes } from "../utils/api";
import { LOTES_DEMO, fmtFechaHora } from "../utils/constants";

export default function Trazabilidad() {
  const [busqueda, setBusqueda] = useState("");
  const [lotes,    setLotes]    = useState([]);
  const [sel,      setSel]      = useState(null);
  const [cargando, setCargando] = useState(true);
  const [demo,     setDemo]     = useState(false);

  const cargar = useCallback(async (origen = "") => {
    setCargando(true);
    try {
      const params = { limit:100 };
      if (origen) params.origen = origen;
      const { data } = await getLotes(params);
      if (data.lotes?.length > 0) {
        setLotes(data.lotes);
        setSel(data.lotes[0]);
        setDemo(false);
      } else {
        // Sin lotes en el backend aún — muestra demo con aviso
        setLotes(LOTES_DEMO);
        setSel(LOTES_DEMO[0]);
        setDemo(true);
      }
    } catch {
      setLotes(LOTES_DEMO);
      setSel(LOTES_DEMO[0]);
      setDemo(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = busqueda
    ? lotes.filter(l =>
        (l.origen || l.finca || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (l.numero_lote || l.id || "").toString().toLowerCase().includes(busqueda.toLowerCase())
      )
    : lotes;

  const COLS = "0.6fr 1.3fr 1fr 0.7fr 0.9fr 0.3fr";
  const phVal = l => l.ph_manual ?? l.ph_sensor ?? l.ph ?? "—";

  return (
    <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:22 }} className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:800, letterSpacing:"-0.02em" }}>Trazabilidad.</h1>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:14, fontWeight:700 }}>Lácteos de Oriente®</p>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.40)", letterSpacing:"0.06em" }}>GUATEMALA</p>
          {demo && <p style={{ fontSize:11, color:"#f59e0b", marginTop:4 }}>⚠ Mostrando datos demo</p>}
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{ display:"flex", gap:10 }}>
        <div style={{ position:"relative", flex:1 }}>
          <Search size={14} color="rgba(255,255,255,0.35)"
            style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
          <input className="input-navy" placeholder="Buscar finca o número de lote..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === "Enter" && cargar(busqueda)}
            style={{ paddingLeft:38 }}/>
        </div>
        <button className="btn-navy" style={{ padding:"0 20px", borderRadius:8, fontSize:13 }}
          onClick={() => cargar(busqueda)}>Buscar</button>
        {busqueda && (
          <button className="btn-outline-white" onClick={() => { setBusqueda(""); cargar(); }}>Limpiar</button>
        )}
      </div>

      {cargando ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"64px 0" }}>
          <span className="spinner" style={{ width:32, height:32 }}/>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16 }}>

          {/* Tabla */}
          <div className="navy-card" style={{ overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17 }}>Historial de Lotes</p>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.40)" }}>{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:COLS, padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              {["Lote","Finca","Operador","Litros","Estado",""].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
              ))}
            </div>
            {filtrados.map((l, i) => (
              <div key={i} className={`trow ${sel?.id === l.id || sel?.numero_lote === l.numero_lote ? "sel" : ""}`}
                style={{ gridTemplateColumns:COLS }} onClick={() => setSel(l)}>
                <span style={{ fontSize:13, fontWeight:700, color:"#6a9fd8" }}>{l.numero_lote || l.id || "—"}</span>
                <span style={{ fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.origen || l.finca || "—"}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>{l.operador || "—"}</span>
                <span style={{ fontSize:12 }}>{parseFloat(l.litros || 0).toLocaleString()}</span>
                <span><span className={l.apta ? "badge-apta" : "badge-noapta"}>{l.apta ? "APTA" : "NO APTA"}</span></span>
                <Eye size={13} color="#6a9fd8" style={{ cursor:"pointer" }}/>
              </div>
            ))}
          </div>

          {/* Detalle */}
          {sel ? (
            <div className="navy-card" style={{ padding:"22px", display:"flex", flexDirection:"column", gap:14 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:22 }}>{sel.numero_lote || sel.id || "—"}</p>
              {[
                { label:"Finca",    value: sel.origen || sel.finca },
                { label:"Operador", value: sel.operador },
                { label:"Litros",   value: `${parseFloat(sel.litros||0).toLocaleString()} L` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>{label}:</span>
                  <span style={{ fontSize:13, fontWeight:500 }}>{value || "—"}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>Temperatura:</span>
                <span style={{ background:"linear-gradient(135deg,#1a3a6e,#2456a4)", borderRadius:999, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {sel.temperatura ?? sel.temp ?? "—"}°C
                </span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>pH:</span>
                <span style={{ background:"linear-gradient(135deg,#163059,#2456a4)", borderRadius:999, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {phVal(sel)}
                </span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>Densidad:</span>
                <span style={{ fontSize:13, fontWeight:500 }}>{sel.densidad ?? "—"}</span>
              </div>
              {(sel.observaciones || sel.obs) && (
                <div>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)", display:"block", marginBottom:4 }}>Observaciones:</span>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.70)" }}>{sel.observaciones || sel.obs}</span>
                </div>
              )}
              {sel.motivo_rechazo && (
                <div style={{ background:"rgba(231,76,60,0.10)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:8, padding:"10px 14px" }}>
                  <span style={{ fontSize:12, color:"#fca5a5" }}>⚠ {sel.motivo_rechazo}</span>
                </div>
              )}
              <div style={{ marginTop:"auto" }}>
                <span className={sel.apta ? "badge-apta" : "badge-noapta"} style={{ fontSize:15, padding:"8px 24px" }}>
                  {sel.apta ? "APTA" : "NO APTA"}
                </span>
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>
                {sel.creado_en ? fmtFechaHora(sel.creado_en) : sel.fecha ? fmtFechaHora(sel.fecha) : "—"}
              </p>
            </div>
          ) : (
            <div className="navy-card" style={{ padding:"22px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <p style={{ color:"rgba(255,255,255,0.30)", fontSize:13 }}>Selecciona un lote</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}