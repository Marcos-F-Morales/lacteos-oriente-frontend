// src/views/Inventario.jsx — Responsive móvil
import { useEffect, useState } from "react";
import { getInventario } from "../utils/api";
import { SEMANAS_DEMO } from "../utils/constants";

const isMob = () => window.innerWidth <= 768;

export default function Inventario() {
  const [data,     setData]     = useState(null);
  const [cargando, setCargando] = useState(true);
  const [demo,     setDemo]     = useState(false);
  const [mobile,   setMobile]   = useState(isMob());

  useEffect(() => {
    const handler = () => setMobile(isMob());
    window.addEventListener("resize", handler);
    getInventario()
      .then(({ data: d }) => { setData(d); setDemo(false); })
      .catch(() => setDemo(true))
      .finally(() => setCargando(false));
    return () => window.removeEventListener("resize", handler);
  }, []);

  const fincas = data?.por_finca?.length > 0 ? data.por_finca : [
    { origen:"Finca El Roble", total_litros:3200 },
    { origen:"Hacienda San José", total_litros:2900 },
    { origen:"Granja Los Pinos", total_litros:1800 },
  ];
  const maxL    = Math.max(...fincas.map(f => parseFloat(f.total_litros)||0));
  const resumen = data?.resumen;
  const pad     = mobile ? "16px" : "28px 32px";

  const stats = [
    { label:"Total", value: resumen?.total_litros!=null ? `${parseFloat(resumen.total_litros).toLocaleString("es-GT",{maximumFractionDigits:0})} L` : "—", sub: resumen?.litros_hoy!=null ? `+${parseFloat(resumen.litros_hoy).toFixed(0)} L hoy` : "+0 L hoy", color:"#6a9fd8" },
    { label:"Hoy",   value: resumen?.recepciones_hoy ?? "—", sub:"recepciones", color:"#a8c8ec" },
    { label:"Prom.", value: resumen?.promedio_litros!=null ? `${parseFloat(resumen.promedio_litros).toFixed(0)} L` : "—", sub:"por recep.", color:"#6a9fd8" },
  ];

  if (cargando) return (
    <div style={{ padding:pad, display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
      <span className="spinner" style={{ width:32, height:32 }}/>
    </div>
  );

  return (
    <div style={{ padding:pad, display:"flex", flexDirection:"column", gap:16, paddingBottom: mobile ? 80 : pad }} className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:8 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: mobile?26:38, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1 }}>Inventario.</h1>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.40)", letterSpacing:"0.06em", marginTop:4 }}>Lo fresco mejor</p>
        </div>
        {demo && <span style={{ fontSize:11, color:"#f59e0b", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.30)", borderRadius:8, padding:"5px 10px" }}>⚠ Demo</span>}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {stats.map(({ label, value, sub, color }) => (
          <div key={label} className="navy-card" style={{ padding: mobile?"14px":"22px 26px" }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginBottom:6, fontWeight:600 }}>{label}</p>
            <p style={{ fontSize: mobile?22:34, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1 }}>{value}</p>
            <p style={{ fontSize:11, color, marginTop:4 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Barras */}
      <div className="navy-card" style={{ padding: mobile?"14px":"24px" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize: mobile?15:17, marginBottom:16 }}>Litros por finca</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {fincas.map(f => {
            const litros = parseFloat(f.total_litros)||0;
            const pct    = maxL > 0 ? (litros/maxL)*100 : 0;
            return (
              <div key={f.origen}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginRight:8 }}>{f.origen}</span>
                  <span style={{ fontSize:12, fontWeight:700, flexShrink:0 }}>{litros.toLocaleString()}L</span>
                </div>
                <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:4, height:8, overflow:"hidden" }}>
                  <div style={{ background:"linear-gradient(90deg,#1d4080,#6a9fd8)", height:"100%", width:`${pct}%`, borderRadius:4, transition:"width 0.8s ease" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla semanal */}
      <div className="navy-card" style={{ padding: mobile?"14px":"24px" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize: mobile?15:17, marginBottom:12 }}>Resumen Semanal</p>
        {mobile ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {(data?.semana?.length > 0 ? data.semana : SEMANAS_DEMO).map((s, i) => {
              const aprobado = s.aprobado ?? (s.aptas && s.recepciones ? `${Math.round((s.aptas/s.recepciones)*100)}%` : "—");
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"rgba(255,255,255,0.03)", borderRadius:8 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600 }}>{s.dia || s.sem}</p>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{s.recepciones ?? s.rec} recepciones · {parseFloat(s.litros||0).toLocaleString()} L</p>
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color:"#2ecc71" }}>{aprobado}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr 1fr", padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              {["Semana","Litros","Recepciones","Aprobado %"].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</span>
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
          </>
        )}
      </div>
    </div>
  );
}