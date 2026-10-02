// src/views/Administracion.jsx
// Vista completa de administración — solo visible para rol 'administrador'
import { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit, Shield, Users, RefreshCw, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import {
  getUsuarios, postUsuario, putUsuario, deleteUsuario,
  getRoles, postRol, deleteRol
} from "../utils/api";

export default function Administracion({ usuario }) {
  const [tab,      setTab]      = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [form,     setForm]     = useState({
    nombre:"", usuario:"", email:"", password:"",
    rol_id:"", activo:true, telefono:"", ciudad:"",
    telegram_chat_id:""
  });
  const [rolForm, setRolForm] = useState({ nombre:"", descripcion:"" });

  const cargar = async () => {
    setCargando(true);
    try {
      const [u, r] = await Promise.all([getUsuarios(), getRoles()]);
      setUsuarios(u.data.usuarios || []);
      setRoles(r.data.roles || []);
    } catch {
      toast.error("Error cargando datos. Verifica que el backend esté corriendo.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const abrirCrear = () => {
    setEditando(null);
    setShowPass(false);
    setForm({
      nombre:"", usuario:"", email:"", password:"",
      rol_id: roles[0]?.id || "",
      activo: true, telefono:"", ciudad:"", telegram_chat_id:""
    });
    setShowForm(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setShowPass(false);
    setForm({
      nombre:           u.nombre            || "",
      usuario:          u.usuario           || "",
      email:            u.email             || "",
      password:         "",
      rol_id:           u.rol_id            || "",
      activo:           u.activo,
      telefono:         u.telefono          || "",
      ciudad:           u.ciudad            || "",
      telegram_chat_id: u.telegram_chat_id  || "",
    });
    setShowForm(true);
  };

  const guardarUsuario = async () => {
    if (!form.nombre || !form.email || !form.rol_id) {
      toast.error("Nombre, correo y rol son requeridos.");
      return;
    }
    if (!editando && !form.usuario) {
      toast.error("El nombre de usuario es requerido.");
      return;
    }
    if (!editando && !form.password) {
      toast.error("La contraseña es requerida para usuarios nuevos.");
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      if (editando) {
        const cambios = {
          nombre:           form.nombre,
          email:            form.email,
          rol_id:           parseInt(form.rol_id),
          activo:           form.activo === true || form.activo === "true",
          telefono:         form.telefono         || null,
          ciudad:           form.ciudad           || null,
          telegram_chat_id: form.telegram_chat_id || null,
        };
        if (form.password) cambios.password = form.password;
        await putUsuario(editando.id, cambios);
        toast.success("Usuario actualizado correctamente.");
      } else {
        await postUsuario({
          nombre:           form.nombre,
          usuario:          form.usuario.toLowerCase().trim(),
          email:            form.email,
          password:         form.password,
          rol_id:           parseInt(form.rol_id),
          activo:           true,
          telefono:         form.telefono         || null,
          ciudad:           form.ciudad           || null,
          telegram_chat_id: form.telegram_chat_id || null,
        });
        toast.success(`Usuario '${form.usuario}' creado correctamente.`);
      }
      setShowForm(false);
      setEditando(null);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al guardar el usuario.");
    }
  };

  const eliminarUsuario = async (u) => {
    if (u.usuario === "admin") {
      toast.error("No se puede eliminar el usuario administrador principal.");
      return;
    }
    if (!window.confirm(`¿Eliminar al usuario '${u.usuario}'?\nEsta acción no se puede deshacer.`)) return;
    try {
      await deleteUsuario(u.id);
      toast.success(`Usuario '${u.usuario}' eliminado.`);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al eliminar el usuario.");
    }
  };

  const guardarRol = async () => {
    if (!rolForm.nombre.trim()) { toast.error("Ingrese el nombre del rol."); return; }
    try {
      await postRol(rolForm.nombre.trim(), rolForm.descripcion.trim());
      toast.success(`Rol '${rolForm.nombre}' creado correctamente.`);
      setRolForm({ nombre:"", descripcion:"" });
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al crear el rol.");
    }
  };

  const eliminarRol = async (r) => {
    if (r.nombre === "administrador" || r.nombre === "operador") {
      toast.error("No se pueden eliminar los roles base del sistema.");
      return;
    }
    if (!window.confirm(`¿Eliminar el rol '${r.nombre}'?`)) return;
    try {
      await deleteRol(r.id);
      toast.success(`Rol '${r.nombre}' eliminado.`);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.detail || "No se puede eliminar: tiene usuarios asignados.");
    }
  };

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.08)",
    border:"1px solid rgba(255,255,255,0.18)", borderRadius:8,
    padding:"10px 14px", fontSize:13, color:"#fff",
    fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box"
  };
  const labelStyle = {
    display:"block", fontSize:11, color:"rgba(255,255,255,0.50)",
    marginBottom:6, fontWeight:600, letterSpacing:"0.04em"
  };

  return (
    <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:24 }} className="fade-up">

      {/* Título */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:800, letterSpacing:"-0.02em" }}>
          Administración.
        </h1>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(36,86,164,0.20)", border:"1px solid rgba(106,159,216,0.35)", borderRadius:10, padding:"8px 18px", fontSize:13, color:"#6a9fd8" }}>
          <Shield size={15}/>
          Panel de Administrador · {usuario?.nombre || "Admin"}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,0.10)" }}>
        {[
          { id:"usuarios", label:"Usuarios", icon:Users  },
          { id:"roles",    label:"Roles",    icon:Shield },
        ].map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 26px", border:"none", background:"none", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"Inter,sans-serif", color: tab===id ? "#6a9fd8" : "rgba(255,255,255,0.45)", borderBottom: tab===id ? "3px solid #6a9fd8" : "3px solid transparent", transition:"all 0.2s" }}>
            <Icon size={16}/> {label}
          </button>
        ))}
      </div>

      {/* ══ TAB: USUARIOS ══════════════════════════════════════ */}
      {tab === "usuarios" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={abrirCrear} className="btn-navy"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:9, fontSize:13 }}>
              <UserPlus size={16}/> Nuevo Usuario
            </button>
          </div>

          {/* Formulario */}
          {showForm && (
            <div className="navy-card" style={{ padding:24 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, marginBottom:20 }}>
                {editando ? `Editar usuario: ${editando.usuario}` : "Crear Nuevo Usuario"}
              </h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                {/* Nombre */}
                <div>
                  <label style={labelStyle}>Nombre completo *</label>
                  <input style={inputStyle} placeholder="Carlos Méndez"
                    value={form.nombre} onChange={setF("nombre")}/>
                </div>

                {/* Usuario */}
                <div>
                  <label style={labelStyle}>
                    Nombre de usuario *
                    {editando && <span style={{ color:"#f59e0b", marginLeft:6 }}>(no editable)</span>}
                  </label>
                  <input style={{ ...inputStyle, opacity: editando ? 0.5 : 1, cursor: editando ? "not-allowed" : "text" }}
                    placeholder="carlos.mendez" value={form.usuario} onChange={setF("usuario")} readOnly={!!editando}/>
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Correo electrónico *</label>
                  <input style={inputStyle} type="email" placeholder="carlos@lacteosdeoriente.gt"
                    value={form.email} onChange={setF("email")}/>
                </div>

                {/* Contraseña */}
                <div>
                  <label style={labelStyle}>
                    {editando ? "Nueva contraseña (vacío = no cambiar)" : "Contraseña * (mín. 6 caracteres)"}
                  </label>
                  <div style={{ position:"relative" }}>
                    <input style={{ ...inputStyle, paddingRight:42 }}
                      type={showPass ? "text" : "password"} placeholder="••••••••"
                      value={form.password} onChange={setF("password")}/>
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.40)", padding:0 }}>
                      {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input style={inputStyle} placeholder="+502 0000-0000"
                    value={form.telefono} onChange={setF("telefono")}/>
                </div>

                {/* Ciudad */}
                <div>
                  <label style={labelStyle}>Ciudad</label>
                  <input style={inputStyle} placeholder="Zacapa, Guatemala"
                    value={form.ciudad} onChange={setF("ciudad")}/>
                </div>

                {/* Rol */}
                <div>
                  <label style={labelStyle}>Rol *</label>
                  <select style={{ ...inputStyle, cursor:"pointer", appearance:"none", WebkitAppearance:"none" }}
                    value={form.rol_id} onChange={setF("rol_id")}>
                    <option value="" style={{ background:"#0d1e36", color:"#fff" }}>— Seleccionar rol —</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id} style={{ background:"#0d1e36", color:"#fff" }}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado (solo editar) */}
                {editando && (
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select style={{ ...inputStyle, cursor:"pointer", appearance:"none", WebkitAppearance:"none" }}
                      value={String(form.activo)}
                      onChange={e => setForm(p => ({ ...p, activo: e.target.value === "true" }))}>
                      <option value="true"  style={{ background:"#0d1e36", color:"#fff" }}>Activo</option>
                      <option value="false" style={{ background:"#0d1e36", color:"#fff" }}>Inactivo</option>
                    </select>
                  </div>
                )}

                {/* Chat ID Telegram — ocupa toda la fila */}
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={labelStyle}>
                    Chat ID de Telegram
                    <span style={{ color:"rgba(255,255,255,0.30)", fontWeight:400, marginLeft:8 }}>
                      (opcional — para recibir alertas)
                    </span>
                  </label>
                  <input style={inputStyle}
                    placeholder="Ej: 2134587708"
                    value={form.telegram_chat_id} onChange={setF("telegram_chat_id")}/>
                  <p style={{ fontSize:11, color:"#6a9fd8", marginTop:6 }}>
                    💬 En Telegram busca <strong>@lacteosOrienteBot</strong>, escribe <strong>/start</strong> y el bot te enviará tu código automáticamente.
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display:"flex", gap:12, marginTop:20 }}>
                <button className="btn-navy" style={{ padding:"10px 24px", borderRadius:9, fontSize:13 }} onClick={guardarUsuario}>
                  {editando ? "Guardar Cambios" : "Crear Usuario"}
                </button>
                <button className="btn-outline-white" style={{ padding:"10px 20px" }}
                  onClick={() => { setShowForm(false); setEditando(null); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabla de usuarios */}
          <div className="navy-card" style={{ overflow:"hidden" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17 }}>
                Usuarios del sistema
                <span style={{ fontSize:13, fontWeight:400, color:"rgba(255,255,255,0.40)", marginLeft:10 }}>
                  {usuarios.length} registrado{usuarios.length !== 1 ? "s" : ""}
                </span>
              </p>
              <button onClick={cargar}
                style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"6px 12px", fontSize:12, color:"rgba(255,255,255,0.60)", cursor:"pointer" }}>
                <RefreshCw size={13}/> Actualizar
              </button>
            </div>

            {/* Cabecera */}
            <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1.2fr 1.8fr 1fr 0.8fr 0.8fr 0.6fr", padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              {["Nombre","Usuario","Email","Teléfono","Rol","Estado",""].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
              ))}
            </div>

            {/* Filas */}
            {cargando ? (
              <div style={{ display:"flex", justifyContent:"center", padding:"32px" }}>
                <span className="spinner" style={{ width:24, height:24 }}/>
              </div>
            ) : usuarios.length === 0 ? (
              <div style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.30)", fontSize:13 }}>
                Sin usuarios registrados
              </div>
            ) : (
              usuarios.map((u, i) => (
                <div key={u.id} className="trow"
                  style={{ gridTemplateColumns:"1.4fr 1.2fr 1.8fr 1fr 0.8fr 0.8fr 0.6fr", background: i%2===0?"rgba(255,255,255,0.02)":"transparent" }}>

                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
                      background: u.rol==="administrador" ? "linear-gradient(135deg,#1d4080,#2456a4)" : "linear-gradient(135deg,#1a5c36,#2ecc71)",
                      border:"1.5px solid rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff" }}>
                      {u.nombre.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{u.nombre}</div>
                      {u.ciudad && <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{u.ciudad}</div>}
                    </div>
                  </div>

                  <span style={{ fontSize:13, color:"#6a9fd8" }}>@{u.usuario}</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>{u.telefono || "—"}</span>

                  <span>
                    <span style={{ background: u.rol==="administrador"?"rgba(36,86,164,0.40)":"rgba(26,154,82,0.25)", border:`1px solid ${u.rol==="administrador"?"#6a9fd8":"#2ecc71"}`, borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:700, color: u.rol==="administrador"?"#6a9fd8":"#2ecc71" }}>
                      {u.rol}
                    </span>
                  </span>

                  <span>
                    <span style={{ background: u.activo?"rgba(26,154,82,0.20)":"rgba(192,57,43,0.20)", borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:700, color: u.activo?"#2ecc71":"#e74c3c" }}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </span>

                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button onClick={() => abrirEditar(u)} title="Editar"
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#6a9fd8", padding:4 }}>
                      <Edit size={15}/>
                    </button>
                    <button onClick={() => eliminarUsuario(u)} title="Eliminar"
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#e74c3c", padding:4 }}>
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: ROLES ════════════════════════════════════════ */}
      {tab === "roles" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <div className="navy-card" style={{ padding:24 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, marginBottom:16 }}>Crear Nuevo Rol</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr auto", gap:12, alignItems:"end" }}>
              <div>
                <label style={labelStyle}>Nombre del rol *</label>
                <input style={inputStyle} placeholder="supervisor"
                  value={rolForm.nombre} onChange={e=>setRolForm(p=>({...p,nombre:e.target.value}))}/>
              </div>
              <div>
                <label style={labelStyle}>Descripción</label>
                <input style={inputStyle} placeholder="Descripción del rol..."
                  value={rolForm.descripcion} onChange={e=>setRolForm(p=>({...p,descripcion:e.target.value}))}/>
              </div>
              <button className="btn-navy" style={{ padding:"10px 20px", borderRadius:9, fontSize:13, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:8 }} onClick={guardarRol}>
                <UserPlus size={15}/> Crear Rol
              </button>
            </div>
          </div>

          <div className="navy-card" style={{ overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17 }}>
                Roles del sistema
                <span style={{ fontSize:13, fontWeight:400, color:"rgba(255,255,255,0.40)", marginLeft:10 }}>
                  {roles.length} rol{roles.length !== 1 ? "es" : ""}
                </span>
              </p>
              <button onClick={cargar}
                style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"6px 12px", fontSize:12, color:"rgba(255,255,255,0.60)", cursor:"pointer" }}>
                <RefreshCw size={13}/> Actualizar
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 3fr 1fr 0.5fr", padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              {["Nombre","Descripción","Estado",""].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
              ))}
            </div>

            {roles.map((r, i) => {
              const esSistema = r.nombre === "administrador" || r.nombre === "operador";
              return (
                <div key={r.id} className="trow"
                  style={{ gridTemplateColumns:"1fr 3fr 1fr 0.5fr", background: i%2===0?"rgba(255,255,255,0.02)":"transparent" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Shield size={14} color={r.nombre==="administrador"?"#6a9fd8":"#2ecc71"}/>
                    <span style={{ fontSize:13, fontWeight:700, color: r.nombre==="administrador"?"#6a9fd8":"#2ecc71" }}>{r.nombre}</span>
                  </div>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>{r.descripcion || "—"}</span>
                  <span>
                    {esSistema ? (
                      <span style={{ background:"rgba(245,158,11,0.20)", borderRadius:999, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#f59e0b" }}>Sistema</span>
                    ) : (
                      <span style={{ background:"rgba(26,154,82,0.20)", borderRadius:999, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#2ecc71" }}>Activo</span>
                    )}
                  </span>
                  <button onClick={() => eliminarRol(r)} disabled={esSistema} title={esSistema?"No se puede eliminar":"Eliminar rol"}
                    style={{ background:"none", border:"none", cursor: esSistema?"not-allowed":"pointer", color: esSistema?"rgba(255,255,255,0.15)":"#e74c3c", padding:4 }}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ background:"rgba(36,86,164,0.15)", border:"1px solid rgba(106,159,216,0.25)", borderRadius:10, padding:"12px 16px", fontSize:12, color:"rgba(255,255,255,0.55)", display:"flex", alignItems:"center", gap:8 }}>
            <Shield size={14} color="#6a9fd8"/>
            Los roles marcados como <strong style={{ color:"#f59e0b", margin:"0 4px" }}>Sistema</strong> no se pueden eliminar.
          </div>
        </div>
      )}
    </div>
  );
}