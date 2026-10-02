// src/views/Inventario.jsx
import { useEffect, useState } from "react";
import { getInventario } from "../utils/api";
import { SEMANAS_DEMO } from "../utils/constants";

export default function Inventario() {
  const [data,     setData]     = useState(null);
  const [cargando, setCargando] = useState(true);
  const [demo,     setDemo]     = useState(false);

  useEffect(() => {
    getInventario()
      .then(({ data: d }) => { setData(d); setDemo(false); })
      .catch(() => setDemo(true))
      .finally(() => setCargando(false));
  }, []);

  const fincas = data?.por_finca?.length > 0
    ? data.por_finca
    : [
        { origen:"Finca El Roble",     total_litros:3200 },
        { origen:"Hacienda San José",  total_litros:2900 },
        { origen:"Granja Los Pinos",   total_litros:1800 },
        { origen:"Lechería La Cumbre", total_litros:2100 },
        { origen:"Rancho El Sol",      total_litros:980  },
      ];

  const maxL    = Math.max(...fincas.map(f => parseFloat(f.total_litros) || 0));
  const resumen = data?.resumen;

  const stats = [
    { label:"Total Acumulado", value: resumen?.total_litros != null ? `${parseFloat(resumen.total_litros).toLocaleString("es-GT",{maximumFractionDigits:0})} L` : "—", sub:resumen?.litros_hoy != null ? `+${parseFloat(resumen.litros_hoy).toFixed(0)} L hoy` : "+0 L hoy", color:"#6a9fd8" },
    { label:"Recepciones Hoy", value: resumen?.recepciones_hoy ?? "—", sub:"registros hoy", color:"#a8c8ec" },
    { label:"Promedio",        value: resumen?.promedio_litros != null ? `${parseFloat(resumen.promedio_litros).toFixed(0)} L` : "—", sub:"por recepción", color:"#6a9fd8" },
  ];

  if (cargando) {
    return (
      <div style={{ padding:"28px 32px", display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
        <span className="spinner" style={{ width:32, height:32 }}/>
      </div>
    );
  }

  return (
    <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:22 }} className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1 }}>Inventario.</h1>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.40)", letterSpacing:"0.06em", marginTop:4 }}>Lo fresco mejor</p>
        </div>
        {demo && <span style={{ fontSize:11, color:"#f59e0b", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.30)", borderRadius:8, padding:"6px 12px" }}>⚠ Datos de demostración</span>}
      </div>

      {/* Stats del backend */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {stats.map(({ label, value, sub, color }) => (
          <div key={label} className="navy-card" style={{ padding:"22px 26px" }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:8, fontWeight:600 }}>{label}</p>
            <p style={{ fontSize:36, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1 }}>{value}</p>
            <p style={{ fontSize:12, color, marginTop:6 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Barras horizontales por finca */}
      <div className="navy-card" style={{ padding:"24px" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, marginBottom:20 }}>Litros recibidos por finca</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {fincas.map(f => {
            const litros = parseFloat(f.total_litros) || 0;
            const pct    = maxL > 0 ? (litros / maxL) * 100 : 0;
            return (
              <div key={f.origen} style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)", width:175, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.origen}</span>
                <div style={{ flex:1, background:"rgba(255,255,255,0.07)", borderRadius:6, height:30, overflow:"hidden" }}>
                  <div style={{ background:"linear-gradient(90deg,#1d4080,#6a9fd8)", height:"100%", width:`${pct}%`, borderRadius:6, display:"flex", alignItems:"center", paddingLeft:12, transition:"width 0.8s ease" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#fff", whiteSpace:"nowrap" }}>{litros.toLocaleString()}L</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla semanal */}
      <div className="navy-card" style={{ padding:"24px" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, marginBottom:16 }}>Resumen Semanal</p>
        <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr 1fr", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          {["Semana","Litros","Recepciones","Aprobado %"].map(h => (
            <span key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</span>
          ))}
        </div>
        {(data?.semana?.length > 0 ? data.semana : SEMANAS_DEMO).map((s, i) => {
          const aprobado = s.aprobado ?? (s.aptas && s.recepciones ? `${Math.round((s.aptas/s.recepciones)*100)}%` : "—");
          return (
            <div key={i} className="trow" style={{ gridTemplateColumns:"1.2fr 1fr 1fr 1fr" }}>
              <span style={{ fontSize:13, fontWeight:600 }}>{s.dia || s.sem}</span>
              <span style={{ fontSize:13 }}>{parseFloat(s.litros||0).toLocaleString()} L</span>
              <span style={{ fontSize:13 }}>{s.recepciones ?? s.rec}</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#2ecc71" }}>{aprobado}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}