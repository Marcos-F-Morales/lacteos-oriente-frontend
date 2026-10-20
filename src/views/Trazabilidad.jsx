// src/views/Trazabilidad.jsx — Responsive móvil
import { useState, useEffect, useCallback } from "react";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { getLotes } from "../utils/api";
import { LOTES_DEMO, fmtFechaHora } from "../utils/constants";

const isMob = () => window.innerWidth <= 768;
const POR_PAGINA = 7;

export default function Trazabilidad() {
  const [busqueda,   setBusqueda]   = useState("");
  const [lotes,      setLotes]      = useState([]);
  const [sel,        setSel]        = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [demo,       setDemo]       = useState(false);
  const [mobile,     setMobile]     = useState(isMob());
  const [verDetalle, setVerDetalle] = useState(false);
  const [pagina,     setPagina]     = useState(0);

  useEffect(() => {
    const handler = () => setMobile(isMob());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const cargar = useCallback(async (origen = "") => {
    setCargando(true);
    try {
      const params = { limit:100 };
      if (origen) params.origen = origen;
      const { data } = await getLotes(params);
      if (data.lotes?.length > 0) { setLotes(data.lotes); setSel(data.lotes[0]); setDemo(false); }
      else { setLotes(LOTES_DEMO); setSel(LOTES_DEMO[0]); setDemo(true); }
    } catch { setLotes(LOTES_DEMO); setSel(LOTES_DEMO[0]); setDemo(true); }
    finally { setCargando(false); setPagina(0); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados  = busqueda
    ? lotes.filter(l => (l.origen||l.finca||"").toLowerCase().includes(busqueda.toLowerCase()) || (l.numero_lote||l.id||"").toString().toLowerCase().includes(busqueda.toLowerCase()))
    : lotes;

  const totalPags  = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados  = filtrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const phVal      = l => l.ph_manual ?? l.ph_sensor ?? l.ph ?? "—";
  const pad        = mobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:pad, display:"flex", flexDirection:"column", gap:16, paddingBottom: mobile?80:pad }} className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: mobile?26:38, fontWeight:800, letterSpacing:"-0.02em" }}>Trazabilidad.</h1>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:13, fontWeight:700 }}>Lácteos de Oriente®</p>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.40)", letterSpacing:"0.06em" }}>GUATEMALA</p>
          {demo && <p style={{ fontSize:11, color:"#f59e0b", marginTop:2 }}>⚠ Datos demo</p>}
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{ display:"flex", gap:8 }}>
        <div style={{ position:"relative", flex:1 }}>
          <Search size={13} color="rgba(255,255,255,0.35)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
          <input className="input-navy" placeholder="Buscar finca o lote..."
            value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(0); }}
            onKeyDown={e => e.key==="Enter" && cargar(busqueda)}
            style={{ paddingLeft:36, fontSize: mobile?16:14 }}/>
        </div>
        <button className="btn-navy" style={{ padding:"0 14px", borderRadius:8, fontSize:13, flexShrink:0 }} onClick={() => cargar(busqueda)}>
          Buscar
        </button>
        {busqueda && (
          <button className="btn-outline-white" style={{ padding:"0 10px", flexShrink:0 }} onClick={() => { setBusqueda(""); setPagina(0); cargar(); }}>✕</button>
        )}
      </div>

      {cargando ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"64px 0" }}>
          <span className="spinner" style={{ width:32, height:32 }}/>
        </div>
      ) : mobile ? (
        verDetalle && sel ? (
          /* ── Detalle móvil ── */
          <div className="navy-card" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
              <button onClick={() => setVerDetalle(false)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#6a9fd8", fontSize:13, padding:0 }}>
                ← Volver
              </button>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:20 }}>{sel.numero_lote || sel.id || "—"}</p>
            </div>
            {[{ label:"Finca", value:sel.origen||sel.finca }, { label:"Operador", value:sel.operador }, { label:"Litros", value:`${parseFloat(sel.litros||0).toLocaleString()} L` }].map(({ label, value }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>{label}:</span>
                <span style={{ fontSize:13, fontWeight:500 }}>{value || "—"}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>Temperatura:</span>
              <span style={{ background:"linear-gradient(135deg,#1a3a6e,#2456a4)", borderRadius:999, padding:"3px 12px", fontSize:13, fontWeight:700 }}>{sel.temperatura ?? sel.temp ?? "—"}°C</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>pH:</span>
              <span style={{ background:"linear-gradient(135deg,#163059,#2456a4)", borderRadius:999, padding:"3px 12px", fontSize:13, fontWeight:700 }}>{phVal(sel)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>Densidad:</span>
              <span style={{ fontSize:13, fontWeight:500 }}>{sel.densidad ?? "—"}</span>
            </div>
            {sel.motivo_rechazo && (
              <div style={{ background:"rgba(231,76,60,0.10)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:8, padding:"10px 14px" }}>
                <span style={{ fontSize:12, color:"#fca5a5" }}>⚠ {sel.motivo_rechazo}</span>
              </div>
            )}
            <span className={sel.apta?"badge-apta":"badge-noapta"} style={{ fontSize:14, padding:"8px 20px", alignSelf:"flex-start" }}>
              {sel.apta ? "APTA" : "NO APTA"}
            </span>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>
              {sel.creado_en ? fmtFechaHora(sel.creado_en) : sel.fecha ? fmtFechaHora(sel.fecha) : "—"}
            </p>
          </div>
        ) : (
          /* ── Lista móvil con paginación ── */
          <div className="navy-card" style={{ overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15 }}>Historial de Lotes</p>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.40)" }}>{filtrados.length} reg.</span>
            </div>
            {paginados.map((l, i) => (
              <div key={i} style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", cursor:"pointer" }}
                onClick={() => { setSel(l); setVerDetalle(true); }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#6a9fd8" }}>{l.numero_lote || l.id || "—"}</span>
                  <span className={l.apta?"badge-apta":"badge-noapta"}>{l.apta?"APTA":"NO APTA"}</span>
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>
                  {l.origen || l.finca || "—"} · {parseFloat(l.litros||0).toLocaleString()} L · {l.operador || "—"}
                </div>
              </div>
            ))}
            <Paginacion pagina={pagina} total={totalPags} onChange={setPagina}/>
          </div>
        )
      ) : (
        /* ── Vista desktop: dos columnas de igual altura ── */
        <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16, alignItems:"start" }}>

          {/* Columna izquierda: lista */}
          <div className="navy-card" style={{ overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17 }}>Historial de Lotes</p>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.40)" }}>{filtrados.length} registro{filtrados.length!==1?"s":""}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"0.6fr 1.3fr 1fr 0.7fr 0.9fr 0.3fr", padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              {["Lote","Finca","Operador","Litros","Estado",""].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
              ))}
            </div>
            {paginados.map((l, i) => (
              <div key={i} className={`trow ${sel?.id===l.id||sel?.numero_lote===l.numero_lote?"sel":""}`}
                style={{ gridTemplateColumns:"0.6fr 1.3fr 1fr 0.7fr 0.9fr 0.3fr" }} onClick={() => setSel(l)}>
                <span style={{ fontSize:13, fontWeight:700, color:"#6a9fd8" }}>{l.numero_lote||l.id||"—"}</span>
                <span style={{ fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.origen||l.finca||"—"}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>{l.operador||"—"}</span>
                <span style={{ fontSize:12 }}>{parseFloat(l.litros||0).toLocaleString()}</span>
                <span><span className={l.apta?"badge-apta":"badge-noapta"}>{l.apta?"APTA":"NO APTA"}</span></span>
                <Eye size={13} color="#6a9fd8" style={{ cursor:"pointer" }}/>
              </div>
            ))}
            <Paginacion pagina={pagina} total={totalPags} onChange={setPagina}/>
          </div>

          {/* Columna derecha: detalle con altura fija */}
          {sel ? (
            <div className="navy-card" style={{ padding:"22px", display:"flex", flexDirection:"column", gap:14, height:"100%", minHeight:360, overflowY:"auto" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:22 }}>#{sel.numero_lote||sel.id||"—"}</p>

              {[{ label:"Finca",    value:sel.origen||sel.finca },
                { label:"Operador", value:sel.operador },
                { label:"Litros",   value:`${parseFloat(sel.litros||0).toLocaleString()} L` }
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>{label}:</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{value||"—"}</span>
                </div>
              ))}

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>Temperatura:</span>
                <span style={{ background:"linear-gradient(135deg,#1a3a6e,#2456a4)", borderRadius:999, padding:"4px 16px", fontSize:14, fontWeight:700 }}>
                  {sel.temperatura??sel.temp??"—"}°C
                </span>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>pH:</span>
                <span style={{ background:"linear-gradient(135deg,#163059,#2456a4)", borderRadius:999, padding:"4px 16px", fontSize:14, fontWeight:700 }}>
                  {phVal(sel)}
                </span>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>Densidad:</span>
                <span style={{ fontSize:13, fontWeight:600 }}>{sel.densidad??"—"}</span>
              </div>

              {sel.motivo_rechazo && (
                <div style={{ background:"rgba(231,76,60,0.10)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:8, padding:"10px 14px" }}>
                  <span style={{ fontSize:12, color:"#fca5a5" }}>⚠ {sel.motivo_rechazo}</span>
                </div>
              )}

              <div style={{ marginTop:"auto", display:"flex", flexDirection:"column", gap:8 }}>
                <span className={sel.apta?"badge-apta":"badge-noapta"} style={{ fontSize:15, padding:"8px 24px", alignSelf:"flex-start" }}>
                  {sel.apta?"APTA":"NO APTA"}
                </span>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>
                  {sel.creado_en?fmtFechaHora(sel.creado_en):sel.fecha?fmtFechaHora(sel.fecha):"—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="navy-card" style={{ padding:"22px", display:"flex", alignItems:"center", justifyContent:"center", minHeight:360 }}>
              <p style={{ color:"rgba(255,255,255,0.30)", fontSize:13 }}>Selecciona un lote</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente de paginación ──────────────────────────────────
function Paginacion({ pagina, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
      <button
        onClick={() => onChange(p => Math.max(0, p - 1))}
        disabled={pagina === 0}
        style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, padding:"5px 10px", fontSize:12, color: pagina===0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.70)", cursor: pagina===0 ? "default" : "pointer" }}>
        <ChevronLeft size={13}/> Anterior
      </button>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.40)" }}>
        {pagina + 1} / {total}
      </span>
      <button
        onClick={() => onChange(p => Math.min(total - 1, p + 1))}
        disabled={pagina === total - 1}
        style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, padding:"5px 10px", fontSize:12, color: pagina===total-1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.70)", cursor: pagina===total-1 ? "default" : "pointer" }}>
        Siguiente <ChevronRight size={13}/>
      </button>
    </div>
  );
}