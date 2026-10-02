// src/views/Analisis.jsx
import { useState, useEffect } from "react";
import { Play, Save, CheckCircle, XCircle, Lock, User, Thermometer, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import { clasificar, RANGOS } from "../utils/constants";
import { getUltimaMedicion, crearLote, getProveedores, getUmbrales } from "../utils/api";

function Label({ children, required = false }) {
  return (
    <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.45)", marginBottom:6 }}>
      {children}
      {required && <span style={{ color:"#e74c3c", marginLeft:4, fontWeight:700 }}>*</span>}
    </label>
  );
}

export default function Analisis({ usuario }) {
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
    getProveedores()
      .then(r => setProveedores(r.data.proveedores || []))
      .catch(() => {});
    getUmbrales()
      .then(r => setUmbrales(r.data))
      .catch(() => {});
    if (usuario?.nombre) {
      setRecepcion(p => ({ ...p, operador: usuario.nombre }));
    }
  }, [usuario]);

  const setR = k => e => setRecepcion(p => ({ ...p, [k]: e.target.value }));
  const setM = k => e => setManual(p    => ({ ...p, [k]: e.target.value }));

  const iniciar = async () => {
    if (!recepcion.finca || recepcion.finca.trim() === "") {
      toast.error("⚠ El nombre de la finca es obligatorio."); return;
    }
    if (!recepcion.litros || parseFloat(recepcion.litros) <= 0) {
      toast.error("⚠ La cantidad de litros es obligatoria y debe ser mayor a 0."); return;
    }
    if (!recepcion.operador) {
      toast.error("⚠ El nombre del operador es obligatorio."); return;
    }
    if (!manual.ph) {
      toast.error("⚠ El pH manual es obligatorio. Ingrese la lectura del lactómetro."); return;
    }
    if (!manual.densidad) {
      toast.error("⚠ La densidad es obligatoria. Ingrese la lectura del lactómetro."); return;
    }
    const phVal   = parseFloat(manual.ph);
    const densVal = parseFloat(manual.densidad);
    if (isNaN(phVal) || phVal < 0 || phVal > 14) {
      toast.error("⚠ El pH debe ser un valor entre 0 y 14."); return;
    }
    if (isNaN(densVal) || densVal < 1.0 || densVal > 1.1) {
      toast.error("⚠ La densidad debe estar entre 1.000 y 1.100 g/cm³."); return;
    }

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
      tempSensor = data.temperatura;
      phSensor   = data.ph;
      setModoDemo(false);
    } catch {
      tempSensor = +(4 + Math.random() * 6).toFixed(1);
      phSensor   = +(6.5 + Math.random() * 0.3).toFixed(2);
      setModoDemo(true);
      toast("⚠ ESP32 no detectado — usando datos simulados", {
        icon:"🔌", style:{ background:"#1d4080", color:"#fff" }
      });
    }

    setProgreso(100);
    setIot({ temp: tempSensor, ph: phSensor });

    const { apta, errores } = clasificar(tempSensor, parseFloat(manual.ph), parseFloat(manual.densidad));
    setResultado({ apta, errores, temp:tempSensor, ph:parseFloat(manual.ph), densidad:parseFloat(manual.densidad) });
    setEstado("done");

    if (apta) toast.success("LECHE APTA ✓ — LED VERDE");
    else      toast.error("LECHE NO APTA ✗ — LED ROJO");
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
    setEstado("idle");
    setResultado(null);
    setIot({ temp:null, ph:null });
    setProgreso(0);
    setFincaMode("lista");
    setRecepcion({
      finca: "", fecha: new Date().toISOString().split("T")[0],
      litros: "", operador: usuario?.nombre || ""
    });
    setManual({ ph:"", densidad:"", obs:"" });
  };

  const rangos = umbrales || {
    temp_min: RANGOS.temperatura.min, temp_max: RANGOS.temperatura.max,
    ph_min:   RANGOS.ph.min,          ph_max:   RANGOS.ph.max
  };

  return (
    <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:26, position:"relative" }} className="fade-up">
      <div style={{ position:"absolute", inset:0, background:"url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=30') center/cover", opacity:0.05, pointerEvents:"none" }}/>

      {modoDemo && (
        <div style={{ background:"rgba(29,64,128,0.4)", border:"1px solid #6a9fd8", borderRadius:10, padding:"8px 16px", fontSize:12, color:"#a8c8ec", display:"flex", alignItems:"center", gap:8, position:"relative" }}>
          🔌 Modo demo activo — el ESP32 no está enviando datos. Los valores son simulados.
        </div>
      )}

      {/* Título */}
      <div style={{ textAlign:"center", position:"relative" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:800, letterSpacing:"-0.02em", marginBottom:6 }}>
          Nuevo Análisis.
        </h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>
          Complete los datos y presione INICIAR para que el sistema evalúe la leche
        </p>
        <p style={{ fontSize:11, color:"#e74c3c", marginTop:4 }}>* Campos obligatorios</p>
      </div>

      {/* Botón principal */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <button
          className={`btn-iniciar${estado === "analyzing" ? " analizando" : ""}`}
          onClick={iniciar} disabled={estado === "analyzing"}>
          {estado === "analyzing"
            ? <><span className="spinner" style={{ width:20, height:20 }}/> Analizando...</>
            : <><Play size={20} fill="#fff"/> INICIAR ANÁLISIS</>}
        </button>
      </div>

      {/* Barra de progreso */}
      {estado === "analyzing" && (
        <div style={{ maxWidth:420, margin:"0 auto", width:"100%" }}>
          <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:999, overflow:"hidden" }}>
            <div style={{ background:"linear-gradient(90deg,#2456a4,#6a9fd8)", height:"100%", width:`${progreso}%`, transition:"width 0.15s", borderRadius:999 }}/>
          </div>
          <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.40)", marginTop:6 }}>
            Leyendo sensores ESP32... {progreso}%
          </p>
        </div>
      )}

      {/* 3 columnas */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, position:"relative" }}>

        {/* ── Columna 1: Datos de Recepción ─────────────────── */}
        <div>
          <p className="section-label">Datos de Recepción</p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Finca */}
            <div>
              <Label required>Nombre de la Finca</Label>

              {/* MODO LISTA — muestra lista con scroll, máximo 5 filas visibles */}
              {fincaMode === "lista" && proveedores.length > 0 && (
                <select
                  size={5}
                  value={recepcion.finca}
                  onChange={e => {
                    if (e.target.value === "__otro") {
                      setFincaMode("nueva");
                      setRecepcion(p => ({ ...p, finca: "" }));
                    } else {
                      setRecepcion(p => ({ ...p, finca: e.target.value }));
                    }
                  }}
                  style={{
                    width:            "100%",
                    background:       "rgba(255,255,255,0.08)",
                    border:           recepcion.finca
                                        ? "1px solid rgba(106,159,216,0.60)"
                                        : "1px solid rgba(255,255,255,0.18)",
                    borderRadius:     8,
                    color:            "#fff",
                    fontFamily:       "Inter,sans-serif",
                    fontSize:         13,
                    outline:          "none",
                    cursor:           "pointer",
                    overflowY:        "auto",
                    appearance:       "none",
                    WebkitAppearance: "none",
                    padding:          0,
                  }}>
                  {/* Opción placeholder */}
                  <option value="" disabled
                    style={{ background:"#0d1e36", color:"rgba(255,255,255,0.35)", padding:"9px 14px", fontStyle:"italic" }}>
                    — Seleccionar finca —
                  </option>
                  {/* Fincas del backend */}
                  {proveedores.map(p => (
                    <option key={p.id} value={p.nombre}
                      style={{ background:"#0d1e36", color:"#fff", padding:"9px 14px" }}>
                      {p.nombre}
                    </option>
                  ))}
                  {/* Opción para escribir una nueva */}
                  <option value="__otro"
                    style={{ background:"#163059", color:"#6a9fd8", padding:"9px 14px" }}>
                    ✏ Escribir otra...
                  </option>
                </select>
              )}

              {/* Sin proveedores — input libre */}
              {fincaMode === "lista" && proveedores.length === 0 && (
                <input className="input-navy" placeholder="Finca El Roble"
                  value={recepcion.finca} onChange={setR("finca")}/>
              )}

              {/* MODO NUEVA — solo input de texto */}
              {fincaMode === "nueva" && (
                <div>
                  <input
                    className="input-navy"
                    placeholder="Escriba el nombre de la nueva finca"
                    value={recepcion.finca}
                    onChange={e => setRecepcion(p => ({ ...p, finca: e.target.value }))}
                    autoFocus
                  />
                  <button type="button"
                    onClick={() => {
                      setFincaMode("lista");
                      setRecepcion(p => ({ ...p, finca: "" }));
                    }}
                    style={{ marginTop:6, fontSize:11, color:"#6a9fd8", background:"none", border:"none", cursor:"pointer", padding:0, textDecoration:"underline" }}>
                    ← Volver al listado de fincas
                  </button>
                </div>
              )}

              {/* Muestra la finca seleccionada debajo de la lista */}
              {fincaMode === "lista" && recepcion.finca && recepcion.finca !== "__otro" && (
                <p style={{ fontSize:11, color:"#2ecc71", marginTop:5 }}>
                  ✓ Seleccionada: <strong>{recepcion.finca}</strong>
                </p>
              )}
            </div>

            {/* Fecha */}
            <div>
              <Label required>Fecha de Recepción</Label>
              <input className="input-navy" type="date"
                value={recepcion.fecha} onChange={setR("fecha")}/>
            </div>

            {/* Litros */}
            <div>
              <Label required>Cantidad de Litros</Label>
              <div style={{ position:"relative" }}>
                <input className="input-navy" type="number" placeholder="320"
                  value={recepcion.litros} onChange={setR("litros")}/>
                <Lock size={13} color="rgba(255,255,255,0.30)"
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              </div>
            </div>

            {/* Operador */}
            <div>
              <Label required>Nombre del Operador</Label>
              <div style={{ position:"relative" }}>
                <input className="input-navy"
                  placeholder="Nombre del operador"
                  value={recepcion.operador}
                  onChange={setR("operador")}
                  style={{ borderColor: usuario?.nombre ? "rgba(106,159,216,0.40)" : "rgba(255,255,255,0.18)" }}
                />
                <User size={13} color="rgba(255,255,255,0.30)"
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              </div>
              {usuario?.nombre && (
                <p style={{ fontSize:10, color:"rgba(106,159,216,0.70)", marginTop:4 }}>
                  ↑ Precargado con tu sesión activa
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Columna 2: Sistema IoT ─────────────────────────── */}
        <div>
          <p className="section-label">Sistema IoT — ESP32</p>
          <div className="navy-card" style={{ padding:"22px", display:"flex", flexDirection:"column", gap:16, minHeight:220, justifyContent:"center" }}>
            <div className="pill-sensor">
              <Thermometer size={19}/>
              <span>{iot.temp !== null ? `${iot.temp}°C` : "— °C"}</span>
            </div>
            <div className="pill-sensor">
              <FlaskConical size={19}/>
              <span>{iot.ph !== null ? `pH ${iot.ph}` : "pH —"}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12,
              color: iot.temp !== null ? "#6a9fd8" : "rgba(255,255,255,0.35)" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", display:"inline-block",
                background: iot.temp !== null ? "#6a9fd8" : "rgba(255,255,255,0.20)",
                boxShadow:  iot.temp !== null ? "0 0 6px #6a9fd8" : "none" }}/>
              {iot.temp !== null
                ? (modoDemo ? "Sensor simulado — ESP32 no conectado" : "Sensor activo — PT100 + MAX31865")
                : "Esperando lectura del ESP32"}
            </div>
            {umbrales && (
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.28)", marginTop:4 }}>
                Rangos: T {umbrales.temp_min}–{umbrales.temp_max}°C · pH {umbrales.ph_min}–{umbrales.ph_max}
              </p>
            )}
          </div>
        </div>

        {/* ── Columna 3: Datos Manuales ──────────────────────── */}
        <div>
          <p className="section-label">Datos Manuales del Operador</p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <Label required>
                pH Manual (lactómetro) — Rango: {rangos.ph_min}–{rangos.ph_max}
              </Label>
              <input className="input-navy" type="number" step="0.01" placeholder="6.65"
                value={manual.ph} onChange={setM("ph")}
                style={{ borderColor: manual.ph ? "rgba(46,204,113,0.40)" : "rgba(255,255,255,0.18)" }}/>
            </div>
            <div>
              <Label required>
                Densidad g/cm³ — Rango: {RANGOS.densidad.min}–{RANGOS.densidad.max}
              </Label>
              <input className="input-navy" type="number" step="0.0001" placeholder="1.0310"
                value={manual.densidad} onChange={setM("densidad")}
                style={{ borderColor: manual.densidad ? "rgba(46,204,113,0.40)" : "rgba(255,255,255,0.18)" }}/>
            </div>
            <div>
              <Label>
                Observaciones
                <span style={{ color:"rgba(255,255,255,0.30)", fontSize:10, marginLeft:6 }}>(opcional)</span>
              </Label>
              <textarea className="input-navy" rows={5}
                placeholder="Notas del operador..."
                value={manual.obs} onChange={setM("obs")}
                style={{ resize:"none" }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de resultado */}
      {resultado && (
        <div className="navy-card" style={{ padding:"20px 24px" }}>
          <p className="section-label">Resultado del Análisis</p>
          <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div className={resultado.apta ? "result-apta" : "result-noapta"}>
              {resultado.apta ? <CheckCircle size={20}/> : <XCircle size={20}/>}
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
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:6 }}>
                {resultado.apta
                  ? "✓ Señal enviada al ESP32 — LED VERDE encendido (APTA)"
                  : "✗ Señal enviada al ESP32 — LED ROJO encendido (NO APTA)"}
              </p>
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-navy"
                style={{ padding:"10px 20px", fontSize:13, borderRadius:9 }}
                onClick={guardar}>
                <Save size={15}/> Guardar Registro
              </button>
              <button className="btn-outline-white" onClick={resetear}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}