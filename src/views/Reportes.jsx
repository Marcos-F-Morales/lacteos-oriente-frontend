// src/views/Reportes.jsx
import { useState, useCallback } from "react";
import { FileText, Download, Filter, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getReporteLotes, getReporteInventario, getReporteAlertas } from "../utils/api";

const PERIODOS = [
  { value: "dia",    label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes",    label: "Este mes" },
  { value: "todo",   label: "Todo el historial" },
];

const TIPOS = [
  { value: "lotes",      label: "Lotes clasificados" },
  { value: "inventario", label: "Inventario por finca" },
  { value: "alertas",    label: "Alertas" },
];

const fmtFecha = (str) =>
  str ? new Date(str).toLocaleDateString("es-GT") : "—";
const fmtHora = (str) =>
  str ? new Date(str).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtNum = (n, dec = 0) =>
  n != null ? parseFloat(n).toLocaleString("es-GT", { maximumFractionDigits: dec }) : "—";

// ── Generadores PDF ────────────────────────────────────────────────────
function addHeader(doc, titulo, periodo, finca) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(13, 30, 54);
  doc.rect(0, 0, w, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text("Lácteos de Oriente", 14, 13);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, 14, 22);
  doc.setFontSize(9);
  doc.setTextColor(160, 190, 220);
  const pLabel = PERIODOS.find(p => p.value === periodo)?.label ?? periodo;
  let sub = `Período: ${pLabel}`;
  if (finca) sub += `  |  Finca: ${finca}`;
  sub += `  |  ${new Date().toLocaleString("es-GT")}`;
  doc.text(sub, w - 14, 22, { align: "right" });
  doc.setTextColor(0, 0, 0);
  return 36;
}

function pdfLotes(data, periodo, finca) {
  const doc = new jsPDF({ orientation: "landscape" });
  const y0  = addHeader(doc, "Reporte de Lotes Clasificados", periodo, finca);

  // Resumen
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Resumen", 14, y0);
  autoTable(doc, {
    startY: y0 + 3,
    body: [
      ["Total lotes",      data.total_lotes],
      ["Total litros",     fmtNum(data.total_litros, 1) + " L"],
      ["Lotes APTOS",      `${data.aptas}  (${data.total_lotes ? Math.round(data.aptas / data.total_lotes * 100) : 0}%)`],
      ["Lotes RECHAZADOS", `${data.no_aptas}  (${data.total_lotes ? Math.round(data.no_aptas / data.total_lotes * 100) : 0}%)`],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 52 } },
  });

  const y1 = doc.lastAutoTable.finalY + 7;
  doc.setFont("helvetica", "bold"); doc.text("Detalle de lotes", 14, y1);
  autoTable(doc, {
    startY: y1 + 3,
    head: [["Lote", "Fecha", "Hora", "Finca", "Litros", "pH", "Temp °C", "Estado", "Motivo"]],
    body: data.lotes.map(l => [
      l.numero_lote ?? "—",
      fmtFecha(l.creado_en),
      fmtHora(l.creado_en),
      l.finca ?? l.origen ?? "—",
      fmtNum(l.litros, 1),
      fmtNum(l.ph_manual ?? l.ph_sensor, 2),
      fmtNum(l.temperatura_sensor, 1),
      l.apta ? "APTA" : "NO APTA",
      l.motivo_rechazo ?? "",
    ]),
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [13, 30, 54], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 246, 255] },
    didParseCell(d) {
      if (d.column.index === 7 && d.section === "body") {
        d.cell.styles.textColor = d.cell.raw === "APTA" ? [39, 174, 96] : [231, 76, 60];
        d.cell.styles.fontStyle = "bold";
      }
    },
  });
  doc.save(`lotes_${periodo}_${Date.now()}.pdf`);
}

function pdfInventario(data, periodo) {
  const doc = new jsPDF();
  const y0  = addHeader(doc, "Reporte de Inventario por Finca", periodo, null);
  const g   = data.resumen_global ?? {};

  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Resumen global", 14, y0);
  autoTable(doc, {
    startY: y0 + 3,
    body: [
      ["Total lotes",       g.total_lotes ?? 0],
      ["Total litros",      fmtNum(g.total_litros, 1) + " L"],
      ["Litros aptos",      fmtNum(g.litros_aptos, 1) + " L"],
      ["Litros rechazados", fmtNum(g.litros_rechazados, 1) + " L"],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
  });

  const y1 = doc.lastAutoTable.finalY + 7;
  doc.setFont("helvetica", "bold"); doc.text("Desglose por finca", 14, y1);
  autoTable(doc, {
    startY: y1 + 3,
    head: [["Finca", "Lotes", "Litros totales", "Litros aptos", "Litros rechazados", "pH prom.", "Temp. prom."]],
    body: data.por_finca.map(r => [
      r.finca,
      r.total_lotes,
      fmtNum(r.total_litros, 1) + " L",
      fmtNum(r.litros_aptos, 1) + " L",
      fmtNum(r.litros_rechazados, 1) + " L",
      fmtNum(r.ph_promedio, 2),
      fmtNum(r.temp_promedio, 1) + " °C",
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [13, 30, 54], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 246, 255] },
  });
  doc.save(`inventario_${periodo}_${Date.now()}.pdf`);
}

function pdfAlertas(data, periodo) {
  const doc = new jsPDF({ orientation: "landscape" });
  const y0  = addHeader(doc, "Reporte de Alertas", periodo, null);

  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Resumen", 14, y0);
  autoTable(doc, {
    startY: y0 + 3,
    body: [
      ["Total alertas", data.total],
      ["Resueltas",     data.resueltas],
      ["Pendientes",    data.pendientes],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
  });

  const y1 = doc.lastAutoTable.finalY + 7;
  doc.setFont("helvetica", "bold"); doc.text("Detalle", 14, y1);
  autoTable(doc, {
    startY: y1 + 3,
    head: [["Fecha", "Hora", "Lote", "Tipo", "Mensaje", "Estado"]],
    body: data.alertas.map(a => [
      fmtFecha(a.creado_en),
      fmtHora(a.creado_en),
      a.numero_lote ?? "—",
      a.tipo ?? "—",
      a.mensaje ?? "—",
      a.resuelta ? "Resuelta" : "Pendiente",
    ]),
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [13, 30, 54], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 246, 255] },
    didParseCell(d) {
      if (d.column.index === 5 && d.section === "body") {
        d.cell.styles.textColor = d.cell.raw === "Resuelta" ? [39, 174, 96] : [231, 76, 60];
        d.cell.styles.fontStyle = "bold";
      }
    },
  });
  doc.save(`alertas_${periodo}_${Date.now()}.pdf`);
}

// ── Sub-componentes UI ─────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "rgba(22,48,89,0.65)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

const TH = ({ children }) => (
  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)", fontSize: 10, color: "rgba(255,255,255,0.40)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{children}</th>
);
const TD = ({ children, style }) => (
  <td style={{ padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", ...style }}>{children}</td>
);

function TablaLotes({ lotes }) {
  if (!lotes?.length) return <Empty />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr><TH>Lote</TH><TH>Fecha</TH><TH>Finca</TH><TH>Litros</TH><TH>pH</TH><TH>Temp °C</TH><TH>Estado</TH></tr></thead>
        <tbody>
          {lotes.map((l, i) => (
            <tr key={i}>
              <TD>{l.numero_lote ?? "—"}</TD>
              <TD style={{ color: "rgba(255,255,255,0.55)" }}>{fmtFecha(l.creado_en)}</TD>
              <TD style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.finca ?? l.origen ?? "—"}</TD>
              <TD>{fmtNum(l.litros, 1)} L</TD>
              <TD>{fmtNum(l.ph_manual ?? l.ph_sensor, 2)}</TD>
              <TD>{fmtNum(l.temperatura_sensor, 1)}</TD>
              <TD>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: l.apta ? "#2ecc71" : "#e74c3c" }}>
                  {l.apta ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {l.apta ? "APTA" : "NO APTA"}
                </span>
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaInventario({ filas }) {
  if (!filas?.length) return <Empty />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr><TH>Finca</TH><TH>Lotes</TH><TH>Litros totales</TH><TH>Litros aptos</TH><TH>Litros rechazados</TH><TH>pH prom.</TH><TH>Temp. prom.</TH></tr></thead>
        <tbody>
          {filas.map((r, i) => (
            <tr key={i}>
              <TD style={{ fontWeight: 600 }}>{r.finca}</TD>
              <TD>{r.total_lotes}</TD>
              <TD>{fmtNum(r.total_litros, 1)} L</TD>
              <TD style={{ color: "#2ecc71" }}>{fmtNum(r.litros_aptos, 1)} L</TD>
              <TD style={{ color: "#e74c3c" }}>{fmtNum(r.litros_rechazados, 1)} L</TD>
              <TD>{fmtNum(r.ph_promedio, 2)}</TD>
              <TD>{fmtNum(r.temp_promedio, 1)} °C</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaAlertas({ alertas }) {
  if (!alertas?.length) return <Empty />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr><TH>Fecha</TH><TH>Hora</TH><TH>Lote</TH><TH>Tipo</TH><TH>Mensaje</TH><TH>Estado</TH></tr></thead>
        <tbody>
          {alertas.map((a, i) => (
            <tr key={i}>
              <TD style={{ color: "rgba(255,255,255,0.55)" }}>{fmtFecha(a.creado_en)}</TD>
              <TD style={{ color: "rgba(255,255,255,0.55)" }}>{fmtHora(a.creado_en)}</TD>
              <TD>{a.numero_lote ?? "—"}</TD>
              <TD>{a.tipo ?? "—"}</TD>
              <TD style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.mensaje ?? "—"}</TD>
              <TD>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.resuelta ? "#2ecc71" : "#f59e0b" }}>
                  {a.resuelta ? "✓ Resuelta" : "⚠ Pendiente"}
                </span>
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, textAlign: "center", padding: "28px 0" }}>Sin registros para este período.</p>;
}

// ── Componente principal ───────────────────────────────────────────────
export default function Reportes() {
  const [periodo,   setPeriodo]   = useState("mes");
  const [tipoRep,   setTipoRep]   = useState("lotes");
  const [finca,     setFinca]     = useState("");
  const [datos,     setDatos]     = useState(null);
  const [cargando,  setCargando]  = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error,     setError]     = useState(null);

  const mobile = window.innerWidth <= 768;

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setDatos(null);
    try {
      let res;
      if (tipoRep === "lotes")      res = await getReporteLotes(periodo, finca || null);
      if (tipoRep === "inventario") res = await getReporteInventario(periodo);
      if (tipoRep === "alertas")    res = await getReporteAlertas(periodo);
      setDatos(res.data);
    } catch {
      setError("No se pudieron cargar los datos. Verifica la conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  }, [periodo, tipoRep, finca]);

  const descargar = async () => {
    if (!datos) return;
    setGenerando(true);
    await new Promise(r => setTimeout(r, 80));
    try {
      if (tipoRep === "lotes")      pdfLotes(datos, periodo, finca || null);
      if (tipoRep === "inventario") pdfInventario(datos, periodo);
      if (tipoRep === "alertas")    pdfAlertas(datos, periodo);
    } finally {
      setGenerando(false);
    }
  };

  const tipoLabel   = TIPOS.find(t => t.value === tipoRep)?.label ?? tipoRep;
  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label ?? periodo;
  const pad = mobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding: pad, display: "flex", flexDirection: "column", gap: 16, paddingBottom: mobile ? 80 : pad }} className="fade-up">

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "rgba(106,159,216,0.15)", borderRadius: 10, padding: 10 }}>
          <FileText size={22} color="#6a9fd8" />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, margin: 0 }}>Reportes</h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>Genera y descarga reportes en PDF</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="navy-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Filter size={14} color="#6a9fd8" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Filtros</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : tipoRep === "lotes" ? "1fr 1fr 1fr auto" : "1fr 1fr auto", gap: 12, alignItems: "end" }}>

          {/* Tipo */}
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", display: "block", marginBottom: 5 }}>Tipo de reporte</label>
            <select value={tipoRep} onChange={e => { setTipoRep(e.target.value); setDatos(null); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13 }}>
              {TIPOS.map(t => <option key={t.value} value={t.value} style={{ background: "#0d1e36" }}>{t.label}</option>)}
            </select>
          </div>

          {/* Período */}
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", display: "block", marginBottom: 5 }}>Período</label>
            <select value={periodo} onChange={e => { setPeriodo(e.target.value); setDatos(null); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13 }}>
              {PERIODOS.map(p => <option key={p.value} value={p.value} style={{ background: "#0d1e36" }}>{p.label}</option>)}
            </select>
          </div>

          {/* Finca — solo en lotes */}
          {tipoRep === "lotes" && (
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", display: "block", marginBottom: 5 }}>Finca (opcional)</label>
              <input value={finca} onChange={e => setFinca(e.target.value)}
                placeholder="Ej: Lácteos de Oriente"
                style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          )}

          {/* Botón */}
          <button onClick={consultar} disabled={cargando}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#2563eb", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: cargando ? "wait" : "pointer", opacity: cargando ? 0.7 : 1, whiteSpace: "nowrap" }}>
            <RefreshCw size={13} style={{ animation: cargando ? "spin 1s linear infinite" : "none" }} />
            {cargando ? "Cargando..." : "Consultar"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.35)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#e74c3c" }}>
          {error}
        </div>
      )}

      {/* Resultados */}
      {datos && !cargando && (
        <>
          {/* Tarjetas resumen */}
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
            {tipoRep === "lotes" && (<>
              <StatCard label="Total lotes"      value={datos.total_lotes}                         color="#6a9fd8" />
              <StatCard label="Total litros"     value={fmtNum(datos.total_litros, 1) + " L"}      color="#6a9fd8" />
              <StatCard label="Lotes aptos"      value={datos.aptas}                               color="#2ecc71" />
              <StatCard label="Lotes rechazados" value={datos.no_aptas}                            color="#e74c3c" />
            </>)}
            {tipoRep === "inventario" && (<>
              <StatCard label="Total lotes"       value={datos.resumen_global?.total_lotes ?? 0}                   color="#6a9fd8" />
              <StatCard label="Total litros"      value={fmtNum(datos.resumen_global?.total_litros, 1) + " L"}    color="#6a9fd8" />
              <StatCard label="Litros aptos"      value={fmtNum(datos.resumen_global?.litros_aptos, 1) + " L"}    color="#2ecc71" />
              <StatCard label="Litros rechazados" value={fmtNum(datos.resumen_global?.litros_rechazados, 1) + " L"} color="#e74c3c" />
            </>)}
            {tipoRep === "alertas" && (<>
              <StatCard label="Total alertas" value={datos.total}      color="#6a9fd8" />
              <StatCard label="Resueltas"     value={datos.resueltas}  color="#2ecc71" />
              <StatCard label="Pendientes"    value={datos.pendientes} color="#e74c3c" />
            </>)}
          </div>

          {/* Tabla preview */}
          <div className="navy-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, margin: 0 }}>
                {tipoLabel} · {periodoLabel}
              </p>
              <button onClick={descargar} disabled={generando}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.85)", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: generando ? "wait" : "pointer" }}>
                <Download size={14} />
                {generando ? "Generando..." : "Descargar PDF"}
              </button>
            </div>

            {tipoRep === "lotes"      && <TablaLotes      lotes={datos.lotes} />}
            {tipoRep === "inventario" && <TablaInventario  filas={datos.por_finca} />}
            {tipoRep === "alertas"    && <TablaAlertas     alertas={datos.alertas} />}
          </div>
        </>
      )}

      {/* Estado inicial */}
      {!datos && !cargando && !error && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "rgba(255,255,255,0.28)" }}>
          <FileText size={42} style={{ margin: "0 auto 14px", display: "block", opacity: 0.25 }} />
          <p style={{ fontSize: 13 }}>Selecciona los filtros y presiona <strong style={{ color: "rgba(255,255,255,0.55)" }}>Consultar</strong> para generar el reporte.</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}