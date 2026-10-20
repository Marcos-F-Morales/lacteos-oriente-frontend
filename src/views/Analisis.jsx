// src/views/Analisis.jsx — con alerta Telegram inmediata + botón guardar siempre visible
import { useState, useEffect, useRef } from "react";
import { Play, Save, CheckCircle, XCircle, Lock, User, Thermometer, FlaskConical, MapPin, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import { clasificar, RANGOS } from "../utils/constants";
import { getUltimaMedicion, crearLote, getProveedores, getUmbrales, enviarAlertaTelegram } from "../utils/api";

function Label({ children, required = false }) {
  return (
    <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.45)", marginBottom:6 }}>
      {children}
      {required && <span style={{ color:"#e74c3c", marginLeft:4, fontWeight:700 }}>*</span>}
    </label>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function FincaDropdown({ proveedores, value, onChange, onNueva, isMobile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const seleccionada = proveedores.find(p => p.nombre === value);

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width:"100%", background: seleccionada?"rgba(36,86,164,0.18)":"rgba(255,255,255,0.06)",
          border: seleccionada?"1px solid rgba(106,159,216,0.55)":"1px solid rgba(255,255,255,0.14)",
          borderRadius:10, padding: isMobile?"13px 40px 13px 14px":"11px 40px 11px 14px",
          fontSize: isMobile?16:14, color: seleccionada?"#fff":"rgba(255,255,255,0.35)",
          fontFamily:"Inter, sans-serif", cursor:"pointer", textAlign:"left",
          display:"flex", alignItems:"center", gap:10, transition:"border-color 0.2s, background 0.2s", position:"relative",
        }}
      >
        <MapPin size={14} color={seleccionada?"#6a9fd8":"rgba(255,255,255,0.25)"} style={{ flexShrink:0 }}/>
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight: seleccionada?600:400 }}>
          {value || "— Seleccionar finca —"}
        </span>
        <ChevronDown size={14} color="rgba(255,255,255,0.40)"
          style={{ position:"absolute", right:12, top:"50%", transform:`translateY(-50%) rotate(${open?"180deg":"0deg"})`, transition:"transform 0.22s ease", flexShrink:0 }}/>
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
          background:"#0b1929", border:"1px solid rgba(255,255,255,0.14)",
          borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,0.65)",
          zIndex:600, overflow:"hidden", maxHeight:240, overflowY:"auto",
        }}>
          <div style={{ padding:"9px 14px", fontSize:11, color:"rgba(255,255,255,0.30)", fontStyle:"italic", letterSpacing:"0.03em", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            Fincas registradas
          </div>
          {proveedores.length === 0 && (
            <div style={{ padding:"16px 14px", fontSize:13, color:"rgba(255,255,255,0.35)", textAlign:"center" }}>Sin fincas disponibles</div>
          )}
          {proveedores.map(p => {
            const isSelected = value === p.nombre;
            return (
              <button key={p.id} type="button"
                onClick={() => { onChange(p.nombre); setOpen(false); }}
                style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"11px 14px", background: isSelected?"rgba(36,86,164,0.28)":"transparent",
                  border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)",
                  cursor:"pointer", fontSize:13, color: isSelected?"#6a9fd8":"#e8edf3",
                  fontFamily:"Inter, sans-serif", textAlign:"left", fontWeight: isSelected?600:400, transition:"background 0.12s",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background="rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background="transparent"; }}
              >
                <MapPin size={13} color={isSelected?"#6a9fd8":"rgba(255,255,255,0.28)"} style={{ flexShrink:0 }}/>
                <span style={{ flex:1 }}>{p.nombre}</span>
                {isSelected && <Check size={13} color="#6a9fd8"/>}
              </button>
            );
          })}
          <button type="button"
            onClick={() => { onNueva(); setOpen(false); }}
            style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"11px 14px", background:"rgba(36,86,164,0.10)", border:"none",
              borderTop:"1px solid rgba(255,255,255,0.10)", cursor:"pointer",
              fontSize:13, color:"#6a9fd8", fontFamily:"Inter, sans-serif", textAlign:"left",
            }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(36,86,164,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(36,86,164,0.10)"; }}
          >
            ✏ Escribir otra finca...
          </button>
        </div>
      )}
      {value && (
        <p style={{ fontSize:11, color:"#2ecc71", marginTop:5, display:"flex", alignItems:"center", gap:4 }}>
          <Check size={11}/> <strong>{value}</strong>
        </p>
      )}
    </div>
  );
}

export default function Analisis({ usuario }) {
  const isMobile    = useIsMobile();
  const [estado,      setEstado]      = useState("idle");
  const [progreso,    setProgreso]    = useState(0);
  const [recepcion,   setRecepcion]   = useState({
    finca: "", fecha: new Date().toISOString().split("T")[0],
    litros: "", operador: usuario?.nombre || ""
  });
  const [fincaMode,   setFincaMode]   = useState("lista");
  const [manual,      setManual]      = useState({ ph:"", densidad:"", obs:"" });
  const [iot,         setIot]         = useState({ temp:null, ph:null });
  const [resultado,   setResultado]   = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [umbrales,    setUmbrales]    = useState(null);
  const [modoDemo,    setModoDemo]    = useState(false);

  useEffect(() => {
    getProveedores().then(r => setProveedores(r.data.proveedores || [])).catch(() => {});
    getUmbrales().then(r => setUmbrales(r.data)).catch(() => {});
    if (usuario?.nombre) setRecepcion(p => ({ ...p, operador: usuario.nombre }));
  }, [usuario]);

  const setR = k => e => setRecepcion(p => ({ ...p, [k]: e.target.value }));
  const setM = k => e => setManual(p    => ({ ...p, [k]: e.target.value }));

  const iniciar = async () => {
    if (!recepcion.finca || recepcion.finca.trim() === "") { toast.error("⚠ El nombre de la finca es obligatorio."); return; }
    if (!recepcion.litros || parseFloat(recepcion.litros) <= 0) { toast.error("⚠ La cantidad de litros debe ser mayor a 0."); return; }
    if (!recepcion.operador) { toast.error("⚠ El nombre del operador es obligatorio."); return; }
    if (!manual.ph) { toast.error("⚠ El pH manual es obligatorio."); return; }
    if (!manual.densidad) { toast.error("⚠ La densidad es obligatoria."); return; }
    const phVal   = parseFloat(manual.ph);
    const densVal = parseFloat(manual.densidad);
    if (isNaN(phVal)   || phVal   < 0   || phVal   > 14)  { toast.error("⚠ El pH debe estar entre 0 y 14."); return; }
    if (isNaN(densVal) || densVal < 1.0 || densVal > 1.1) { toast.error("⚠ La densidad debe estar entre 1.000 y 1.100 g/cm³."); return; }

    setEstado("analyzing");
    setResultado(null);
    setIot({ temp:null, ph:null });
    setProgreso(0);

    for (let i = 0; i <= 80; i += 5) {
      await new Promise(r => setTimeout(r, 60));
      setProgreso(i);
    }

    let tempSensor, phSensor;
    try {
      const { data } = await getUltimaMedicion();
      if (!data || data.datos === null || data.temperatura === undefined) throw new Error();
      tempSensor = data.temperatura; phSensor = data.ph; setModoDemo(false);
    } catch {
      tempSensor = +(4 + Math.random() * 6).toFixed(1);
      phSensor   = +(6.5 + Math.random() * 0.3).toFixed(2);
      setModoDemo(true);
      toast("⚠ ESP32 no detectado — datos simulados", { icon:"🔌", style:{ background:"#1d4080", color:"#fff" } });
    }

    setProgreso(100);
    setIot({ temp: tempSensor, ph: phSensor });

    // ── Usar umbrales del backend si están disponibles ──────────── ← CAMBIO
    const rangosActivos = umbrales ? {
      temperatura: { min: umbrales.temp_min,     max: umbrales.temp_max     },
      ph:          { min: umbrales.ph_min,       max: umbrales.ph_max       },
      densidad:    { min: umbrales.densidad_min, max: umbrales.densidad_max },
    } : null;
    const { apta, errores } = clasificar(tempSensor, parseFloat(manual.ph), parseFloat(manual.densidad), rangosActivos);
    // ────────────────────────────────────────────────────────────────

    setResultado({ apta, errores, temp:tempSensor, ph:parseFloat(manual.ph), densidad:parseFloat(manual.densidad) });
    setEstado("done");

    if (apta) {
      toast.success("LECHE APTA ✓ — LED VERDE");
    } else {
      toast.error("LECHE NO APTA ✗ — LED ROJO");
      try {
        await enviarAlertaTelegram({
          finca:    recepcion.finca,
          operador: recepcion.operador,
          litros:   recepcion.litros,
          motivo:   errores.join(", "),
        });
      } catch {}
    }
  };

  const guardar = async () => {
    try {
      const payload = {
        origen:          recepcion.finca,
        operador:        recepcion.operador,
        litros:          parseFloat(recepcion.litros),
        densidad:        manual.densidad ? parseFloat(manual.densidad) : null,
        ph_manual:       manual.ph       ? parseFloat(manual.ph)       : null,
        temperatura:     resultado?.temp  ?? null,
        ph_sensor:       resultado?.ph    ?? null,
        observaciones:   manual.obs       || null,
        fecha_recepcion: recepcion.fecha  || null,
      };
      if (!modoDemo) {
        const { data } = await crearLote(payload);
        toast.success(`Lote ${data.numero_lote} guardado — ${data.mensaje}`);
      } else {
        toast.success("Guardado en modo demo.");
      }
      resetear();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al guardar el registro.");
    }
  };

  const resetear = () => {
    setEstado("idle"); setResultado(null);
    setIot({ temp:null, ph:null }); setProgreso(0);
    setFincaMode("lista");
    setRecepcion({ finca:"", fecha:new Date().toISOString().split("T")[0], litros:"", operador:usuario?.nombre||"" });
    setManual({ ph:"", densidad:"", obs:"" });
  };

  const rangos = umbrales || { temp_min:RANGOS.temperatura.min, temp_max:RANGOS.temperatura.max, ph_min:RANGOS.ph.min, ph_max:RANGOS.ph.max };
  const pad    = isMobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:pad, display:"flex", flexDirection:"column", gap: isMobile?16:26, position:"relative", paddingBottom: isMobile?90:pad }} className="fade-up">
      <div style={{ position:"absolute", inset:0, background:"url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=30') center/cover", opacity:0.05, pointerEvents:"none" }}/>

      {modoDemo && (
        <div style={{ background:"rgba(29,64,128,0.4)", border:"1px solid #6a9fd8", borderRadius:10, padding:"8px 16px", fontSize:12, color:"#a8c8ec", display:"flex", alignItems:"center", gap:8, position:"relative" }}>
          🔌 Modo demo — ESP32 no conectado. Valores simulados.
        </div>
      )}

      <div style={{ textAlign:"center", position:"relative" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?26:38, fontWeight:800, letterSpacing:"-0.02em", marginBottom:6 }}>
          Nuevo Análisis.
        </h1>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>Complete los datos y presione INICIAR para evaluar la leche</p>
        <p style={{ fontSize:11, color:"#e74c3c", marginTop:4 }}>* Campos obligatorios</p>
      </div>

      <div style={{ display:"flex", justifyContent:"center" }}>
        <button className={`btn-iniciar${estado==="analyzing"?" analizando":""}`}
          onClick={iniciar} disabled={estado==="analyzing"}
          style={ isMobile?{ fontSize:14, padding:"13px 32px" }:{} }>
          {estado==="analyzing"
            ? <><span className="spinner" style={{ width:20, height:20 }}/> Analizando...</>
            : <><Play size={20} fill="#fff"/> INICIAR ANÁLISIS</>}
        </button>
      </div>

      {estado==="analyzing" && (
        <div style={{ maxWidth:420, margin:"0 auto", width:"100%" }}>
          <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:999, overflow:"hidden" }}>
            <div style={{ background:"linear-gradient(90deg,#2456a4,#6a9fd8)", height:"100%", width:`${progreso}%`, transition:"width 0.15s", borderRadius:999 }}/>
          </div>
          <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.40)", marginTop:6 }}>Leyendo sensores... {progreso}%</p>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr 1fr", gap: isMobile?14:20, position:"relative" }}>

        <div>
          <p className="section-label">Datos de Recepción</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <Label required>Nombre de la Finca</Label>
              {fincaMode === "lista" && (
                <FincaDropdown proveedores={proveedores} value={recepcion.finca} isMobile={isMobile}
                  onChange={(nombre) => setRecepcion(p => ({ ...p, finca: nombre }))}
                  onNueva={() => { setFincaMode("nueva"); setRecepcion(p => ({ ...p, finca: "" })); }}/>
              )}
              {fincaMode === "nueva" && (
                <div>
                  <input className="input-navy" placeholder="Nombre de la nueva finca"
                    value={recepcion.finca} onChange={e => setRecepcion(p => ({ ...p, finca: e.target.value }))}
                    autoFocus style={{ fontSize: isMobile?16:14 }}/>
                  <button type="button"
                    onClick={() => { setFincaMode("lista"); setRecepcion(p => ({ ...p, finca: "" })); }}
                    style={{ marginTop:6, fontSize:11, color:"#6a9fd8", background:"none", border:"none", cursor:"pointer", padding:0, textDecoration:"underline" }}>
                    ← Volver al listado
                  </button>
                </div>
              )}
            </div>
            <div>
              <Label required>Fecha de Recepción</Label>
              <input className="input-navy" type="date" value={recepcion.fecha} onChange={setR("fecha")} style={{ fontSize: isMobile?16:14 }}/>
            </div>
            <div>
              <Label required>Cantidad de Litros</Label>
              <div style={{ position:"relative" }}>
                <input className="input-navy" type="number" placeholder="320" value={recepcion.litros} onChange={setR("litros")} style={{ fontSize: isMobile?16:14 }}/>
                <Lock size={13} color="rgba(255,255,255,0.30)" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              </div>
            </div>
            <div>
              <Label required>Nombre del Operador</Label>
              <div style={{ position:"relative" }}>
                <input className="input-navy" placeholder="Operador" value={recepcion.operador} onChange={setR("operador")}
                  style={{ borderColor: usuario?.nombre?"rgba(106,159,216,0.40)":"rgba(255,255,255,0.18)", fontSize: isMobile?16:14 }}/>
                <User size={13} color="rgba(255,255,255,0.30)" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              </div>
              {usuario?.nombre && <p style={{ fontSize:10, color:"rgba(106,159,216,0.70)", marginTop:4 }}>↑ Sesión activa</p>}
            </div>
          </div>
        </div>

        <div>
          <p className="section-label">Sistema IoT — ESP32</p>
          <div className="navy-card" style={{ padding:"18px", display:"flex", flexDirection:"column", gap:14, minHeight: isMobile?140:220, justifyContent:"center" }}>
            <div className="pill-sensor" style={ isMobile?{fontSize:16,padding:"8px 16px"}:{} }>
              <Thermometer size={isMobile?16:19}/>
              <span>{iot.temp!==null?`${iot.temp}°C`:"— °C"}</span>
            </div>
            <div className="pill-sensor" style={ isMobile?{fontSize:16,padding:"8px 16px"}:{} }>
              <FlaskConical size={isMobile?16:19}/>
              <span>{iot.ph!==null?`pH ${iot.ph}`:"pH —"}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color: iot.temp!==null?"#6a9fd8":"rgba(255,255,255,0.35)" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", display:"inline-block", background: iot.temp!==null?"#6a9fd8":"rgba(255,255,255,0.20)", boxShadow: iot.temp!==null?"0 0 6px #6a9fd8":"none" }}/>
              {iot.temp!==null ? (modoDemo?"Simulado":"Sensor activo — PT100") : "Esperando ESP32"}
            </div>
            {umbrales && <p style={{ fontSize:10, color:"rgba(255,255,255,0.28)" }}>T {umbrales.temp_min}–{umbrales.temp_max}°C · pH {umbrales.ph_min}–{umbrales.ph_max}</p>}
          </div>
        </div>

        <div>
          <p className="section-label">Datos Manuales del Operador</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <Label required>pH Manual — Rango: {rangos.ph_min}–{rangos.ph_max}</Label>
              <input className="input-navy" type="number" step="0.01" placeholder="6.65" value={manual.ph} onChange={setM("ph")}
                style={{ borderColor: manual.ph?"rgba(46,204,113,0.40)":"rgba(255,255,255,0.18)", fontSize: isMobile?16:14 }}/>
            </div>
            <div>
              <Label required>Densidad g/cm³ — Rango: {RANGOS.densidad.min}–{RANGOS.densidad.max}</Label>
              <input className="input-navy" type="number" step="0.0001" placeholder="1.0310" value={manual.densidad} onChange={setM("densidad")}
                style={{ borderColor: manual.densidad?"rgba(46,204,113,0.40)":"rgba(255,255,255,0.18)", fontSize: isMobile?16:14 }}/>
            </div>
            <div>
              <Label>Observaciones <span style={{ color:"rgba(255,255,255,0.30)", fontSize:10 }}>(opcional)</span></Label>
              <textarea className="input-navy" rows={isMobile?3:5} placeholder="Notas del operador..."
                value={manual.obs} onChange={setM("obs")} style={{ resize:"none", fontSize: isMobile?16:14 }}/>
            </div>
          </div>
        </div>
      </div>

      {resultado && (
        <div className="navy-card" style={{ padding: isMobile?"16px":"20px 24px" }}>
          <p className="section-label">Resultado del Análisis</p>
          <div style={{ display:"flex", flexDirection: isMobile?"column":"row", alignItems: isMobile?"flex-start":"center", gap:16 }}>
            <div className={resultado.apta?"result-apta":"result-noapta"} style={ isMobile?{fontSize:14,padding:"10px 20px"}:{} }>
              {resultado.apta ? <CheckCircle size={isMobile?16:20}/> : <XCircle size={isMobile?16:20}/>}
              {resultado.apta ? "LECHE APTA ✓" : "LECHE NO APTA ✗"}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.70)" }}>
                <strong style={{ color:"#fff" }}>{recepcion.finca}</strong>
                {" | "}{recepcion.litros} L | {recepcion.operador} | {recepcion.fecha}
              </p>
              {!resultado.apta && resultado.errores.map((e, i) => (
                <p key={i} style={{ fontSize:12, color:"#fca5a5", marginTop:4 }}>⚠ {e}</p>
              ))}
              {!resultado.apta && (
                <p style={{ fontSize:11, color:"#f59e0b", marginTop:6 }}>
                  📱 Notificación enviada al administrador por Telegram
                </p>
              )}
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4 }}>
                {resultado.apta ? "✓ Señal al ESP32 — LED VERDE (APTA)" : "✗ Señal al ESP32 — LED ROJO (NO APTA)"}
              </p>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", width: isMobile?"100%":"auto" }}>
              <button className="btn-navy" style={{ padding:"10px 20px", fontSize:13, borderRadius:9, flex: isMobile?1:"none" }} onClick={guardar}>
                <Save size={15}/> Guardar Registro
              </button>
              <button className="btn-outline-white" style={{ flex: isMobile?1:"none" }} onClick={resetear}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}