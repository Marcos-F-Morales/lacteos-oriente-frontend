import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, Clock, RefreshCw, X } from "lucide-react";
import { api } from "../utils/api";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

export default function Alertas() {
  const isMobile = useIsMobile();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("24h");

  const cargarAlertas = async () => {
    setLoading(true);
    try {
      const data = await api.get("/alertas");
      setAlertas(data || []);
    } catch {
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarAlertas(); }, []);

  const resolver = async (id) => {
    try {
      await api.put(`/alertas/${id}/resolver`);
      cargarAlertas();
    } catch {}
  };

  const tipoColor = (tipo) => {
    if (tipo === "NO APTA")       return { bg: "rgba(231,76,60,0.15)",  border: "rgba(231,76,60,0.40)",  text: "#e74c3c" };
    if (tipo === "fuera_de_rango") return { bg: "rgba(243,156,18,0.15)", border: "rgba(243,156,18,0.40)", text: "#f39c12" };
    return                                { bg: "rgba(106,159,216,0.15)", border: "rgba(106,159,216,0.40)", text: "#6a9fd8" };
  };

  return (
    <div style={{ padding: isMobile ? "18px 14px 80px" : "28px 32px", display:"flex", flexDirection:"column", gap:22 }} className="fade-up">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 28 : 38, fontWeight:800, letterSpacing:"-0.02em" }}>
            Alertas.
          </h1>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.40)", letterSpacing:"0.04em" }}>LÁCTEOS DE ORIENTE</p>
        </div>

        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {/* ── SELECT DE PERIODO ARREGLADO ── */}
          <div style={{ position:"relative" }}>
            <select
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              style={{
                background:        "#0d1e36",
                border:            "1px solid rgba(255,255,255,0.18)",
                borderRadius:      8,
                color:             "#fff",
                padding:           "7px 32px 7px 12px",
                fontSize:          12,
                cursor:            "pointer",
                fontFamily:        "Inter,sans-serif",
                appearance:        "none",
                WebkitAppearance:  "none",
                MozAppearance:     "none",
                outline:           "none",
              }}
            >
              <option value="6h"  style={{ background:"#0d1e36", color:"#fff" }}>6 horas</option>
              <option value="24h" style={{ background:"#0d1e36", color:"#fff" }}>24 horas</option>
              <option value="7d"  style={{ background:"#0d1e36", color:"#fff" }}>7 días</option>
              <option value="30d" style={{ background:"#0d1e36", color:"#fff" }}>30 días</option>
            </select>
            {/* Icono chevron decorativo */}
            <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.50)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <button onClick={cargarAlertas}
            style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:8, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <RefreshCw size={13} color="rgba(255,255,255,0.60)"/>
            {!isMobile && <span style={{ fontSize:12, color:"rgba(255,255,255,0.60)" }}>Actualizar</span>}
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"rgba(255,255,255,0.40)", fontSize:13 }}>Cargando alertas...</div>
      ) : alertas.length === 0 ? (
        <div className="navy-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding: isMobile ? 40 : 80, gap:14 }}>
          <CheckCircle size={48} color="#2ecc71" strokeWidth={1.5}/>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#2ecc71" }}>Sin alertas activas</p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.40)", textAlign:"center" }}>Todos los parámetros están en rango.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {alertas.map((a, i) => {
            const c = tipoColor(a.tipo);
            return (
              <div key={i} className="navy-card" style={{
                padding: isMobile ? "14px 16px" : "16px 22px",
                display:"flex",
                alignItems: isMobile ? "flex-start" : "center",
                gap:14,
                flexDirection: isMobile ? "column" : "row",
                borderLeft:`3px solid ${c.border}`,
                background: c.bg,
              }}>
                <AlertTriangle size={18} color={c.text} style={{ flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, fontSize:14, color:c.text }}>{a.tipo === "NO APTA" ? "Leche NO APTA detectada" : a.mensaje || a.tipo}</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:3 }}>
                    <span style={{ marginRight:10 }}>📍 {a.finca || "—"}</span>
                    <span><Clock size={10} style={{ verticalAlign:"middle" }}/> {a.fecha ? new Date(a.fecha).toLocaleString("es-GT") : "—"}</span>
                  </p>
                </div>
                {!a.resuelta && (
                  <button onClick={() => resolver(a.id)}
                    style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:12, color:"#fff", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
                    <X size={12}/> Resolver
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}