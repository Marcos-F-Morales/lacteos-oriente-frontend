// src/views/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { Thermometer, FlaskConical, Milk, AlertTriangle, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  getHistorialIoT, getUltimaMedicion,
  getInventario, getAlertas, getLotes
} from "../utils/api";

// ── Tarjeta de métrica ────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background:"rgba(22,48,89,0.65)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ background:`${color}22`, borderRadius:10, padding:10, display:"flex" }}>
        <Icon size={22} color={color}/>
      </div>
      <div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.50)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1 }}>{value ?? "—"}</div>
        {sub && <div style={{ fontSize:11, color, marginTop:3 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Tooltip de gráficas ───────────────────────────────────────
function ChartTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1e36", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      <p style={{ color:"rgba(255,255,255,0.50)", marginBottom:4 }}>{label}</p>
      <p style={{ fontWeight:700 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

// ── Mensaje cuando no hay datos en la gráfica ─────────────────
function GraficaVacia({ mensaje }) {
  return (
    <div style={{ height:175, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:"rgba(255,255,255,0.25)" }}>
      <p style={{ fontSize:13 }}>{mensaje}</p>
      <p style={{ fontSize:11 }}>Los datos aparecerán cuando el ESP32 envíe mediciones</p>
    </div>
  );
}

export default function Dashboard() {
  const [tempData,    setTempData]    = useState([]);
  const [phData,      setPhData]      = useState([]);
  const [ultimaMed,   setUltimaMed]   = useState(null);
  const [litros,      setLitros]      = useState(null);
  const [numAlertas,  setNumAlertas]  = useState(0);
  const [lotesRecientes, setLotesRecientes] = useState([]);
  const [cargando,    setCargando]    = useState(false);
  const [modoDemo,    setModoDemo]    = useState(false);
  const [ultimaActu,  setUltimaActu]  = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    let alMenosUnOk = false;

    // 1. Última medición del sensor
    try {
      const { data } = await getUltimaMedicion();
      if (data?.temperatura !== undefined) {
        setUltimaMed(data);
        alMenosUnOk = true;
      }
    } catch { /* silencioso */ }

    // 2. Historial para gráficas — pide 24h para tener más puntos
    try {
      const { data } = await getHistorialIoT(24);
      if (data.mediciones?.length > 0) {
        setTempData(data.mediciones.map(m => ({
          h:    new Date(m.leida_en).toLocaleTimeString("es-GT", { hour:"2-digit", minute:"2-digit" }),
          temp: parseFloat(m.temperatura)
        })));
        setPhData(data.mediciones.map(m => ({
          h:  new Date(m.leida_en).toLocaleTimeString("es-GT", { hour:"2-digit", minute:"2-digit" }),
          ph: parseFloat(m.ph)
        })));
        alMenosUnOk = true;
      }
    } catch { /* silencioso */ }

    // 3. Inventario
    try {
      const { data } = await getInventario();
      if (data?.resumen?.total_litros != null) {
        setLitros(
          parseFloat(data.resumen.total_litros)
            .toLocaleString("es-GT", { maximumFractionDigits:0 }) + " L"
        );
        alMenosUnOk = true;
      }
    } catch { /* silencioso */ }

    // 4. Alertas
    try {
      const { data } = await getAlertas(24);
      setNumAlertas(data.total ?? 0);
      alMenosUnOk = true;
    } catch { /* silencioso */ }

    // 5. ── NUEVO: Lotes reales para la tabla de registros recientes ──
    try {
      const { data } = await getLotes({ limit: 5 });
      if (data.lotes?.length > 0) {
        setLotesRecientes(data.lotes);
        alMenosUnOk = true;
      }
    } catch { /* silencioso */ }

    setModoDemo(!alMenosUnOk);
    setUltimaActu(new Date().toLocaleTimeString("es-GT"));
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 15000);
    return () => clearInterval(id);
  }, [cargar]);

  const temp = ultimaMed?.temperatura ?? null;
  const ph   = ultimaMed?.ph          ?? null;

  // Formatea fecha y hora desde el campo creado_en del lote
  const fmtFecha = (str) => {
    if (!str) return "—";
    const d = new Date(str);
    return d.toLocaleDateString("es-GT");
  };
  const fmtHora = (str) => {
    if (!str) return "—";
    const d = new Date(str);
    return d.toLocaleTimeString("es-GT", { hour:"2-digit", minute:"2-digit" });
  };

  return (
    <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:22 }} className="fade-up">

      {/* ── Barra de estado ──────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", display:"inline-block",
            background: modoDemo ? "#f59e0b" : "#2ecc71",
            boxShadow:  modoDemo ? "none" : "0 0 6px #2ecc71" }}/>
          <span style={{ color: modoDemo ? "#f59e0b" : "#6a9fd8" }}>
            {modoDemo
              ? "Backend no conectado — modo demostración"
              : `Datos en vivo · Actualizado: ${ultimaActu}`}
          </span>
        </div>
        <button onClick={cargar} disabled={cargando}
          style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"6px 14px", fontSize:12, color:"rgba(255,255,255,0.70)", cursor:"pointer" }}>
          <RefreshCw size={13} style={{ animation: cargando ? "spin 1s linear infinite" : "none" }}/>
          Actualizar
        </button>
      </div>

      {/* ── Métricas ─────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <MetricCard label="Temperatura" icon={Thermometer} color="#6a9fd8"
          value={temp !== null ? `${temp}°C` : "—"}
          sub={temp !== null ? (temp > 8 ? "⚠ Sobre el límite" : "Dentro del rango") : "Sin datos del sensor"}/>
        <MetricCard label="pH" icon={FlaskConical} color="#a8c8ec"
          value={ph !== null ? ph : "—"}
          sub={ph !== null ? ((ph < 6.5 || ph > 6.8) ? "⚠ Fuera de rango" : "Dentro del rango") : "Sin datos del sensor"}/>
        <MetricCard label="Inventario" icon={Milk} color="#6a9fd8"
          value={litros ?? "— L"}/>
        <MetricCard label="Alertas" icon={AlertTriangle}
          color={numAlertas > 0 ? "#e74c3c" : "#2ecc71"}
          value={numAlertas}
          sub={numAlertas > 0 ? "últimas 24 horas" : "Todo en orden"}/>
      </div>

      {/* ── Gráficas ─────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        {/* Temperatura */}
        <div className="navy-card" style={{ padding:"22px" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, marginBottom:16 }}>
            Temperatura
          </p>
          {tempData.length === 0 ? (
            <GraficaVacia mensaje="Sin historial de temperatura"/>
          ) : (
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={tempData} margin={{ top:5, right:5, left:-24, bottom:0 }}>
                <defs>
                  <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="15%" stopColor="#6a9fd8" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#6a9fd8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="h" tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }}/>
                <Tooltip content={<ChartTip unit="°C"/>}/>
                <ReferenceLine y={8} stroke="#e74c3c" strokeDasharray="4 4"
                  label={{ value:"Limit 8°C", fill:"#e74c3c", fontSize:10 }}/>
                <Area type="monotone" dataKey="temp" stroke="#6a9fd8" strokeWidth={2} fill="url(#gt)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* pH */}
        <div className="navy-card" style={{ padding:"22px" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, marginBottom:16 }}>
            Nivel de pH
          </p>
          {phData.length === 0 ? (
            <GraficaVacia mensaje="Sin historial de pH"/>
          ) : (
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={phData} margin={{ top:5, right:5, left:-24, bottom:0 }}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="15%" stopColor="#a8c8ec" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#a8c8ec" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="h" tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize:9, fill:"rgba(255,255,255,0.35)" }} domain={[6.0, 7.5]}/>
                <Tooltip content={<ChartTip unit=""/>}/>
                <ReferenceLine y={6.8} stroke="#f59e0b" strokeDasharray="4 4"
                  label={{ value:"Limit 6.8", fill:"#f59e0b", fontSize:10 }}/>
                <ReferenceLine y={6.5} stroke="#f59e0b" strokeDasharray="4 4"/>
                <Area type="monotone" dataKey="ph" stroke="#a8c8ec" strokeWidth={2} fill="url(#gp)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Registros recientes — DATOS REALES del backend ── */}
      <div className="navy-card" style={{ padding:"22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17 }}>
            Registros Recientes
          </p>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>
            {lotesRecientes.length > 0 ? `${lotesRecientes.length} últimos registros` : "Sin registros aún"}
          </span>
        </div>

        {lotesRecientes.length === 0 ? (
          /* Sin lotes registrados aún */
          <div style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:13 }}>
            No hay registros aún. Crea el primer análisis desde la vista Análisis.
          </div>
        ) : (
          <>
            {/* Cabecera */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 0.8fr 1.2fr 0.8fr 0.8fr 0.9fr",
              padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              {["Fecha","Hora","Finca","Litros","pH","Estado"].map(h => (
                <span key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</span>
              ))}
            </div>

            {/* Filas con datos reales */}
            {lotesRecientes.map((l, i) => {
              const phVal = l.ph_manual ?? l.ph_sensor ?? l.ph ?? "—";
              return (
                <div key={i} className="trow"
                  style={{ gridTemplateColumns:"1fr 0.8fr 1.2fr 0.8fr 0.8fr 0.9fr" }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.60)" }}>
                    {fmtFecha(l.creado_en || l.fecha_recepcion)}
                  </span>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.60)" }}>
                    {fmtHora(l.creado_en)}
                  </span>
                  <span style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {l.origen || l.finca || "—"}
                  </span>
                  <span style={{ fontSize:13 }}>
                    {parseFloat(l.litros || 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize:13 }}>
                    {phVal}
                  </span>
                  <span>
                    <span className={l.apta ? "badge-apta" : "badge-noapta"}>
                      {l.apta ? "APTA" : "NO APTA"}
                    </span>
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}