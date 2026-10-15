// src/views/Alertas.jsx
import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, Clock, Filter, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

const PERIODOS = [
  { value: "24h",  label: "Últimas 24 horas" },
  { value: "7d",   label: "Últimos 7 días"   },
  { value: "30d",  label: "Últimos 30 días"  },
  { value: "todo", label: "Todo"              },
];

const ALERTAS_DEMO = [
  { id: 1, tipo: "temperatura", mensaje: "Temperatura fuera de rango: 9.2°C (máx. 8°C)", fecha: new Date(Date.now() - 3600000).toISOString(), lote: "LOT-2024-041", finca: "Finca El Roble", resuelta: false },
  { id: 2, tipo: "ph",          mensaje: "pH fuera de rango: 7.1 (máx. 6.9)",            fecha: new Date(Date.now() - 7200000).toISOString(), lote: "LOT-2024-040", finca: "Lácteos Santa Cruz", resuelta: false },
  { id: 3, tipo: "densidad",    mensaje: "Densidad baja: 1.028 g/cm³ (mín. 1.029)",      fecha: new Date(Date.now() - 86400000).toISOString(), lote: "LOT-2024-039", finca: "Finca Los Pinos", resuelta: true  },
];

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
}

const COLOR = { temperatura: "#e74c3c", ph: "#f39c12", densidad: "#9b59b6", default: "#6a9fd8" };

export default function Alertas() {
  const [alertas,   setAlertas]   = useState([]);
  const [periodo,   setPeriodo]   = useState("24h");
  const [cargando,  setCargando]  = useState(false);
  const [modoDemo,  setModoDemo]  = useState(false);
  const [filtro,    setFiltro]    = useState("todas"); // todas | pendientes | resueltas

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await API.get("/alertas", { params: { periodo } });
      setAlertas(Array.isArray(data) ? data : data.alertas || []);
      setModoDemo(false);
    } catch {
      setAlertas(ALERTAS_DEMO);
      setModoDemo(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [periodo]);

  const resolver = async (id) => {
    try {
      await API.put(`/alertas/${id}/resolver`);
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, resuelta: true } : a));
      toast.success("Alerta marcada como resuelta.");
    } catch {
      // modo demo: actualizar localmente
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, resuelta: true } : a));
      toast.success("Resuelta (modo demo).");
    }
  };

  const visibles = alertas.filter(a => {
    if (filtro === "pendientes") return !a.resuelta;
    if (filtro === "resueltas")  return  a.resuelta;
    return true;
  });

  const pendientes = alertas.filter(a => !a.resuelta).length;

  return (
    <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:22 }} className="fade-up">

      {/* Encabezado */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:800, letterSpacing:"-0.02em" }}>
            Alertas.
          </h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:4 }}>
            {pendientes > 0 ? `${pendientes} alerta${pendientes > 1 ? "s" : ""} pendiente${pendientes > 1 ? "s" : ""}` : "Sin alertas pendientes"}
          </p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:14, fontWeight:700, color:"#fff" }}>Lácteos de Oriente®</p>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.40)", letterSpacing:"0.06em" }}>GUATEMALA</p>
        </div>
      </div>

      {/* Modo demo */}
      {modoDemo && (
        <div style={{ background:"rgba(29,64,128,0.4)", border:"1px solid #6a9fd8", borderRadius:10, padding:"8px 16px", fontSize:12, color:"#a8c8ec", display:"flex", alignItems:"center", gap:8 }}>
          🔌 Sin conexión al backend — mostrando alertas de demostración.
        </div>
      )}

      {/* Controles */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>

        {/* Selector de período — ESTILO OSCURO */}
        <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
          <Clock size={13} color="rgba(255,255,255,0.40)"
            style={{ position:"absolute", left:12, pointerEvents:"none" }}/>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            style={{
              background:      "#0d1e36",
              color:           "#fff",
              border:          "1px solid rgba(255,255,255,0.15)",
              borderRadius:    9,
              padding:         "9px 36px 9px 32px",
              fontSize:        13,
              cursor:          "pointer",
              outline:         "none",
              appearance:      "none",
              WebkitAppearance:"none",
              MozAppearance:   "none",
              minWidth:        180,
            }}
          >
            {PERIODOS.map(p => (
              <option key={p.value} value={p.value} style={{ background:"#0d1e36", color:"#fff" }}>
                {p.label}
              </option>
            ))}
          </select>
          {/* Flecha decorativa */}
          <svg width="10" height="6" viewBox="0 0 10 6" style={{ position:"absolute", right:12, pointerEvents:"none" }}>
            <path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Filtro estado */}
        <div style={{ display:"flex", gap:6 }}>
          {[["todas","Todas"],["pendientes","Pendientes"],["resueltas","Resueltas"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              style={{
                padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                border: filtro === v ? "1px solid #6a9fd8" : "1px solid rgba(255,255,255,0.12)",
                background: filtro === v ? "rgba(106,159,216,0.15)" : "transparent",
                color: filtro === v ? "#6a9fd8" : "rgba(255,255,255,0.55)",
                transition:"all 0.18s",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Refrescar */}
        <button
          onClick={cargar}
          disabled={cargando}
          style={{
            marginLeft:"auto", display:"flex", alignItems:"center", gap:7,
            padding:"9px 16px", borderRadius:9, fontSize:13, cursor:"pointer",
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
            color:"rgba(255,255,255,0.70)",
          }}
        >
          <RefreshCw size={13} style={{ animation: cargando ? "spin 1s linear infinite" : "none" }}/>
          Actualizar
        </button>
      </div>

      {/* Lista de alertas */}
      <div className="navy-card" style={{ overflow:"hidden" }}>
        {/* Cabecera tabla */}
        <div style={{ display:"grid", gridTemplateColumns:"0.4fr 1.4fr 1fr 0.9fr 1fr 0.7fr", padding:"11px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          {["Tipo","Mensaje","Lote","Finca","Fecha","Estado"].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
          ))}
        </div>

        {cargando ? (
          <div style={{ padding:"48px", textAlign:"center", color:"rgba(255,255,255,0.35)", fontSize:13 }}>
            <div className="spinner" style={{ width:22, height:22, margin:"0 auto 12px" }}/>
            Cargando alertas...
          </div>
        ) : visibles.length === 0 ? (
          <div style={{ padding:"48px", textAlign:"center", color:"rgba(255,255,255,0.30)", fontSize:13 }}>
            <Bell size={28} color="rgba(255,255,255,0.15)" style={{ display:"block", margin:"0 auto 12px" }}/>
            Sin alertas para mostrar
          </div>
        ) : visibles.map((a) => {
          const color = COLOR[a.tipo] || COLOR.default;
          return (
            <div
              key={a.id}
              style={{
                display:"grid", gridTemplateColumns:"0.4fr 1.4fr 1fr 0.9fr 1fr 0.7fr",
                padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)",
                alignItems:"center", opacity: a.resuelta ? 0.55 : 1,
                transition:"opacity 0.2s",
              }}
            >
              {/* Tipo */}
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0,
                  boxShadow: a.resuelta ? "none" : `0 0 6px ${color}` }}/>
                <span style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.04em" }}>
                  {a.tipo}
                </span>
              </div>

              {/* Mensaje */}
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.80)", paddingRight:12,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {a.mensaje}
              </span>

              {/* Lote */}
              <span style={{ fontSize:12, fontWeight:700, color:"#6a9fd8" }}>{a.lote || "—"}</span>

              {/* Finca */}
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {a.finca || "—"}
              </span>

              {/* Fecha */}
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.40)" }}>{fmtFecha(a.fecha)}</span>

              {/* Acción */}
              <div>
                {a.resuelta ? (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11,
                    color:"#27ae60", fontWeight:700 }}>
                    <CheckCircle size={13}/> Resuelta
                  </span>
                ) : (
                  <button
                    onClick={() => resolver(a.id)}
                    style={{
                      padding:"6px 12px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer",
                      background:"rgba(39,174,96,0.12)", border:"1px solid rgba(39,174,96,0.35)",
                      color:"#27ae60", display:"inline-flex", alignItems:"center", gap:5,
                      transition:"all 0.18s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(39,174,96,0.22)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(39,174,96,0.12)"}
                  >
                    <CheckCircle size={12}/> Resolver
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      {alertas.length > 0 && (
        <div style={{ display:"flex", gap:14 }}>
          {[
            { label:"Total",      value: alertas.length,                         color:"#6a9fd8" },
            { label:"Pendientes", value: alertas.filter(a=>!a.resuelta).length,  color:"#e74c3c" },
            { label:"Resueltas",  value: alertas.filter(a=> a.resuelta).length,  color:"#27ae60" },
          ].map(({ label, value, color }) => (
            <div key={label} className="navy-card" style={{ padding:"14px 22px", flex:1, display:"flex", gap:14, alignItems:"center" }}>
              <span style={{ fontSize:28, fontWeight:800, color }}>{value}</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}