// src/views/Configuracion.jsx — Responsive móvil
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import { getUmbrales, actualizarUmbrales } from "../utils/api";
import { RANGOS } from "../utils/constants";

const isMob = () => window.innerWidth <= 768;

export default function Configuracion() {
  const [rangos,    setRangos]   = useState({ temp_min:RANGOS.temperatura.min, temp_max:RANGOS.temperatura.max, ph_min:RANGOS.ph.min, ph_max:RANGOS.ph.max, densidad_min:RANGOS.densidad.min, densidad_max:RANGOS.densidad.max });
  const [cargando,  setCargando] = useState(true);
  const [guardando, setGuardando]= useState(false);
  const mobile = isMob();

  useEffect(() => {
    getUmbrales()
      .then(({ data }) => setRangos({ temp_min:parseFloat(data.temp_min), temp_max:parseFloat(data.temp_max), ph_min:parseFloat(data.ph_min), ph_max:parseFloat(data.ph_max), densidad_min:parseFloat(data.densidad_min), densidad_max:parseFloat(data.densidad_max) }))
      .catch(() => toast("Usando rangos locales", { icon:"⚠" }))
      .finally(() => setCargando(false));
  }, []);

  const set = k => e => setRangos(p => ({ ...p, [k]: parseFloat(e.target.value) }));

  const guardar = async () => {
    setGuardando(true);
    try { await actualizarUmbrales({ ...rangos, actualizado_por:"Operador" }); toast.success("Umbrales actualizados."); }
    catch { toast.error("No se pudieron guardar los umbrales."); }
    finally { setGuardando(false); }
  };

  const grupos = [
    { label:"Temperatura (°C)", items:[ { label:"Mínima", key:"temp_min", step:0.5 }, { label:"Máxima", key:"temp_max", step:0.5 } ] },
    { label:"pH",               items:[ { label:"Mínimo", key:"ph_min",   step:0.05 }, { label:"Máximo", key:"ph_max",   step:0.05 } ] },
    { label:"Densidad (g/cm³)", items:[ { label:"Mínima", key:"densidad_min", step:0.001 }, { label:"Máxima", key:"densidad_max", step:0.001 } ] },
  ];

  const pad = mobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:pad, paddingBottom: mobile?90:pad, maxWidth: mobile?"100%":580 }} className="fade-up">
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: mobile?26:36, fontWeight:800, letterSpacing:"-0.02em", marginBottom:20 }}>
        Configuración.
      </h1>
      <div className="navy-card" style={{ padding: mobile?"16px":"26px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <Settings size={16} color="#6a9fd8"/>
          <p style={{ fontWeight:700, fontSize:14 }}>Umbrales de Clasificación</p>
        </div>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:20 }}>
          Se aplican de inmediato sin reiniciar el sistema.
        </p>
        {cargando ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"24px 0" }}>
            <span className="spinner" style={{ width:24, height:24 }}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {grupos.map(({ label, items }) => (
              <div key={label}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6a9fd8", marginBottom:10 }}>{label}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {items.map(({ label:l, key, step }) => (
                    <div key={key}>
                      <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.40)", marginBottom:6 }}>{l}</label>
                      <input className="input-navy" type="number" step={step}
                        value={rangos[key]} onChange={set(key)}
                        style={{ textAlign:"right", fontFamily:"monospace", fontSize: mobile?16:14 }}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn-navy"
          style={{ width:"100%", padding:"13px", fontSize:14, borderRadius:10, marginTop:20, opacity: guardando?0.7:1 }}
          onClick={guardar} disabled={guardando || cargando}>
          {guardando ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}