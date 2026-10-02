// src/views/Configuracion.jsx
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import { getUmbrales, actualizarUmbrales } from "../utils/api";
import { RANGOS } from "../utils/constants";

export default function Configuracion() {
  const [rangos,   setRangos]   = useState({
    temp_min: RANGOS.temperatura.min, temp_max: RANGOS.temperatura.max,
    ph_min:   RANGOS.ph.min,          ph_max:   RANGOS.ph.max,
    densidad_min: RANGOS.densidad.min, densidad_max: RANGOS.densidad.max,
  });
  const [cargando, setCargando] = useState(true);
  const [guardando,setGuardando]= useState(false);

  // Carga los umbrales actuales del backend al abrir la vista
  useEffect(() => {
    getUmbrales()
      .then(({ data }) => {
        setRangos({
          temp_min:     parseFloat(data.temp_min),
          temp_max:     parseFloat(data.temp_max),
          ph_min:       parseFloat(data.ph_min),
          ph_max:       parseFloat(data.ph_max),
          densidad_min: parseFloat(data.densidad_min),
          densidad_max: parseFloat(data.densidad_max),
        });
      })
      .catch(() => toast("Usando rangos locales — backend no disponible", { icon:"⚠" }))
      .finally(() => setCargando(false));
  }, []);

  const set = k => e => setRangos(p => ({ ...p, [k]: parseFloat(e.target.value) }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarUmbrales({ ...rangos, actualizado_por:"Operador" });
      toast.success("Umbrales actualizados. El sistema los aplica de inmediato.");
    } catch {
      toast.error("No se pudieron guardar los umbrales. Verifica la conexión.");
    } finally {
      setGuardando(false);
    }
  };

  const grupos = [
    { label:"Temperatura (°C)", items:[
      { label:"Mínima", key:"temp_min", step:0.5 },
      { label:"Máxima", key:"temp_max", step:0.5 }
    ]},
    { label:"pH", items:[
      { label:"Mínimo", key:"ph_min", step:0.05 },
      { label:"Máximo", key:"ph_max", step:0.05 }
    ]},
    { label:"Densidad (g/cm³)", items:[
      { label:"Mínima", key:"densidad_min", step:0.001 },
      { label:"Máxima", key:"densidad_max", step:0.001 }
    ]},
  ];

  return (
    <div style={{ padding:"28px 32px", maxWidth:580 }} className="fade-up">
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:800, letterSpacing:"-0.02em", marginBottom:24 }}>
        Configuración.
      </h1>
      <div className="navy-card" style={{ padding:"26px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <Settings size={18} color="#6a9fd8"/>
          <p style={{ fontWeight:700, fontSize:15 }}>Umbrales de Clasificación</p>
        </div>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:24 }}>
          Estos valores se guardan en la base de datos y se aplican sin reiniciar el sistema ni el ESP32.
        </p>

        {cargando ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"32px 0" }}>
            <span className="spinner" style={{ width:24, height:24 }}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
            {grupos.map(({ label, items }) => (
              <div key={label}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6a9fd8", marginBottom:12 }}>
                  {label}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {items.map(({ label:l, key, step }) => (
                    <div key={key}>
                      <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.40)", marginBottom:6 }}>{l}</label>
                      <input className="input-navy" type="number" step={step}
                        value={rangos[key]} onChange={set(key)}
                        style={{ textAlign:"right", fontFamily:"monospace" }}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn-navy"
          style={{ width:"100%", padding:"13px", fontSize:14, borderRadius:10, marginTop:24, opacity: guardando ? 0.7 : 1 }}
          onClick={guardar} disabled={guardando || cargando}>
          {guardando ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}