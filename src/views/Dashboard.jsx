// src/views/Dashboard.jsx — Responsive móvil
import { useEffect, useState, useCallback } from "react";
import { Thermometer, FlaskConical, Milk, AlertTriangle, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { getHistorialIoT, getUltimaMedicion, getInventario, getAlertas, getLotes } from "../utils/api";

const isMobile = () => window.innerWidth <= 768;

function MetricCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background:"rgba(22,48,89,0.65)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ background:`${color}22`, borderRadius:10, padding:8, display:"flex", flexShrink:0 }}>
        <Icon size={20} color={color}/>
      </div>
      <div style={{ overflow:"hidden" }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.50)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:isMobile() ? 20 : 26, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1 }}>{value ?? "—"}</div>
        {sub && <div style={{ fontSize:10, color, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1e36", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      <p style={{ color:"rgba(255,255,255,0.50)", marginBottom:4 }}>{label}</p>
      <p style={{ fontWeight:700 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

function GraficaVacia({ mensaje }) {
  return (
    <div style={{ height:140, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:"rgba(255,255,255,0.25)" }}>
      <p style={{ fontSize:12, textAlign:"center" }}>{mensaje}</p>
      <p style={{ fontSize:11, textAlign:"center" }}>Datos disponibles cuando el ESP32 esté conectado</p>
    </div>
  );
}

export default function Dashboard() {
  const [tempData,       setTempData]       = useState([]);
  const [phData,         setPhData]         = useState([]);
  const [ultimaMed,      setUltimaMed]      = useState(null);
  const [litros,         setLitros]         = useState(null);
  const [numAlertas,     setNumAlertas]     = useState(0);
  const [lotesRecientes, setLotesRecientes] = useState([]);
  const [cargando,       setCargando]       = useState(false);
  const [modoDemo,       setModoDemo]       = useState(false);
  const [ultimaActu,     setUltimaActu]     = useState(null);
  const [mobile,         setMobile]         = useState(isMobile());

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    let ok = false;
    try {
      const { data } = await getUltimaMedicion();
      if (data?.temperatura !== undefined) { setUltimaMed(data); ok = true; }
    } catch {}
    try {
      const { data } = await getHistorialIoT(24);
      if (data.mediciones?.length > 0) {
        setTempData(data.mediciones.map(m => ({ h: new Date(m.leida_en).toLocaleTimeString("es-GT",{hour:"2-digit",minute:"2-digit"}), temp: parseFloat(m.temperatura) })));
        setPhData(data.mediciones.map(m => ({ h: new Date(m.leida_en).toLocaleTimeString("es-GT",{hour:"2-digit",minute:"2-digit"}), ph: parseFloat(m.ph) })));
        ok = true;
      }
    } catch {}
    try {
      const { data } = await getInventario();
      if (data?.resumen?.total_litros != null) {
        setLitros(parseFloat(data.resumen.total_litros).toLocaleString("es-GT",{maximumFractionDigits:0}) + " L");
        ok = true;
      }
    } catch {}
    try {
      const { data } = await getAlertas(24);
      setNumAlertas(data.total ?? 0); ok = true;
    } catch {}
    try {
      const { data } = await getLotes({ limit:5 });
      if (data.lotes?.length > 0) { setLotesRecientes(data.lotes); ok = true; }
    } catch {}
    setModoDemo(!ok);
    setUltimaActu(new Date().toLocaleTimeString("es-GT"));
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); const id = setInterval(cargar, 15000); return () => clearInterval(id); }, [cargar]);

  const temp = ultimaMed?.temperatura ?? null;
  const ph   = ultimaMed?.ph ?? null;
  const fmtFecha = str => str ? new Date(str).toLocaleDateString("es-GT") : "—";
  const fmtHora  = str => str ? new Date(str).toLocaleTimeString("es-GT",{hour:"2-digit",minute:"2-digit"}) : "—";

  const pad = mobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:pad, display:"flex", flexDirection:"column", gap:16, paddingBottom: mobile ? 80 : pad }} className="fade-up">

      {/* Barra de estado */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", display:"inline-block", background: modoDemo?"#f59e0b":"#2ecc71", boxShadow: modoDemo?"none":"0 0 6px #2ecc71" }}/>
          <span style={{ color: modoDemo?"#f59e0b":"#6a9fd8" }}>
            {modoDemo ? "Modo demo" : `Actualizado: ${ultimaActu}`}
          </span>
        </div>
        <button onClick={cargar} disabled={cargando}
          style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"5px 10px", fontSize:11, color:"rgba(255,255,255,0.70)", cursor:"pointer" }}>
          <RefreshCw size={12} style={{ animation: cargando?"spin 1s linear infinite":"none" }}/>
          Actualizar
        </button>
      </div>

      {/* Métricas — 2 columnas en móvil, 4 en desktop */}
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap:10 }}>
        <MetricCard label="Temperatura" icon={Thermometer} color="#6a9fd8"
          value={temp !== null ? `${temp}°C` : "—"}
          sub={temp !== null ? (temp > 8 ? "⚠ Sobre límite" : "En rango") : "Sin sensor"}/>
        <MetricCard label="pH" icon={FlaskConical} color="#a8c8ec"
          value={ph !== null ? ph : "—"}
          sub={ph !== null ? ((ph<6.5||ph>6.8)?"⚠ Fuera rango":"En rango") : "Sin sensor"}/>
        <MetricCard label="Inventario" icon={Milk} color="#6a9fd8" value={litros ?? "— L"}/>
        <MetricCard label="Alertas" icon={AlertTriangle} color={numAlertas>0?"#e74c3c":"#2ecc71"}
          value={numAlertas} sub={numAlertas>0?"últimas 24h":"Todo en orden"}/>
      </div>

      {/* Gráficas — 1 columna en móvil, 2 en desktop */}
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap:12 }}>
        <div className="navy-card" style={{ padding:"16px" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, marginBottom:12 }}>Temperatura</p>
          {tempData.length === 0 ? <GraficaVacia mensaje="Sin historial de temperatura"/> : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={tempData} margin={{ top:5, right:5, left:-24, bottom:0 }}>
                <defs><linearGradient id="gt" x1="0" y1="0" x2="0" y2="1"><stop offset="15%" stopColor="#6a9fd8" stopOpacity={0.45}/><stop offset="95%" stopColor="#6a9fd8" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="h" tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }}/>
                <Tooltip content={<ChartTip unit="°C"/>}/>
                <ReferenceLine y={8} stroke="#e74c3c" strokeDasharray="4 4" label={{ value:"Lím 8°C", fill:"#e74c3c", fontSize:9 }}/>
                <Area type="monotone" dataKey="temp" stroke="#6a9fd8" strokeWidth={2} fill="url(#gt)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="navy-card" style={{ padding:"16px" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, marginBottom:12 }}>Nivel de pH</p>
          {phData.length === 0 ? <GraficaVacia mensaje="Sin historial de pH"/> : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={phData} margin={{ top:5, right:5, left:-24, bottom:0 }}>
                <defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="15%" stopColor="#a8c8ec" stopOpacity={0.45}/><stop offset="95%" stopColor="#a8c8ec" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="h" tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }} domain={[6.0,7.5]}/>
                <Tooltip content={<ChartTip unit=""/>}/>
                <ReferenceLine y={6.8} stroke="#f59e0b" strokeDasharray="4 4"/>
                <ReferenceLine y={6.5} stroke="#f59e0b" strokeDasharray="4 4"/>
                <Area type="monotone" dataKey="ph" stroke="#a8c8ec" strokeWidth={2} fill="url(#gp)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Registros recientes */}
      <div className="navy-card" style={{ padding:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15 }}>Registros Recientes</p>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{lotesRecientes.length} registros</span>
        </div>
        {lotesRecientes.length === 0 ? (
          <div style={{ padding:"24px", textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:12 }}>
            Sin registros. Crea el primer análisis.
          </div>
        ) : mobile ? (
          // Vista de tarjetas en móvil
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {lotesRecientes.map((l, i) => {
              const phVal = l.ph_manual ?? l.ph_sensor ?? l.ph ?? "—";
              return (
                <div key={i} style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"12px", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{l.origen || l.finca || "—"}</span>
                    <span className={l.apta ? "badge-apta" : "badge-noapta"} style={{ marginLeft:8, flexShrink:0 }}>{l.apta ? "APTA" : "NO APTA"}</span>
                  </div>
                  <div style={{ display:"flex", gap:16, fontSize:11, color:"rgba(255,255,255,0.50)" }}>
                    <span>{fmtFecha(l.creado_en || l.fecha_recepcion)}</span>
                    <span>{parseFloat(l.litros||0).toLocaleString()} L</span>
                    <span>pH {phVal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 0.8fr 1.2fr 0.8fr 0.8fr 0.9fr", padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              {["Fecha","Hora","Finca","Litros","pH","Estado"].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</span>
              ))}
            </div>
            {lotesRecientes.map((l, i) => {
              const phVal = l.ph_manual ?? l.ph_sensor ?? l.ph ?? "—";
              return (
                <div key={i} className="trow" style={{ gridTemplateColumns:"1fr 0.8fr 1.2fr 0.8fr 0.8fr 0.9fr" }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.60)" }}>{fmtFecha(l.creado_en||l.fecha_recepcion)}</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.60)" }}>{fmtHora(l.creado_en)}</span>
                  <span style={{ fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.origen||l.finca||"—"}</span>
                  <span style={{ fontSize:12 }}>{parseFloat(l.litros||0).toLocaleString()}</span>
                  <span style={{ fontSize:12 }}>{phVal}</span>
                  <span><span className={l.apta?"badge-apta":"badge-noapta"}>{l.apta?"APTA":"NO APTA"}</span></span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}