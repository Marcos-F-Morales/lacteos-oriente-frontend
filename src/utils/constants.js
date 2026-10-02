export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const RANGOS = {
  temperatura: { min:2, max:8 },
  ph:          { min:6.5, max:6.8 },
  densidad:    { min:1.028, max:1.034 },
};
export const clasificar = (temp, ph, densidad) => {
  const errores = [];
  if (temp < RANGOS.temperatura.min || temp > RANGOS.temperatura.max)
    errores.push(`Temperatura: ${temp}°C (rango ${RANGOS.temperatura.min}–${RANGOS.temperatura.max}°C)`);
  if (ph < RANGOS.ph.min || ph > RANGOS.ph.max)
    errores.push(`pH: ${ph} (rango ${RANGOS.ph.min}–${RANGOS.ph.max})`);
  if (densidad && (densidad < RANGOS.densidad.min || densidad > RANGOS.densidad.max))
    errores.push(`Densidad: ${densidad}`);
  return { apta: errores.length === 0, errores };
};
export const fmtFechaHora = (d) => new Date(d).toLocaleString("es-GT",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});
export const LOTES_DEMO = [
  { id:"#0047", finca:"Finca El Roble",        operador:"Carlos Pérez",  litros:1200, temp:4.5,  ph:6.70, densidad:1.030, obs:"Todo en orden",   fecha:"2025-04-05 08:15", apta:true  },
  { id:"#0046", finca:"Hacienda La Esperanza", operador:"Ana López",     litros:950,  temp:11.2, ph:6.40, densidad:1.026, obs:"Temperatura alta", fecha:"2025-04-04 14:30", apta:false },
  { id:"#0045", finca:"Granja San Miguel",     operador:"Luis Torres",   litros:1100, temp:6.1,  ph:6.60, densidad:1.031, obs:"Normal",           fecha:"2025-04-04 09:00", apta:true  },
  { id:"#0044", finca:"Finca Las Flores",      operador:"Marta Ruiz",    litros:800,  temp:9.5,  ph:7.10, densidad:1.024, obs:"pH elevado",       fecha:"2025-04-03 16:20", apta:false },
  { id:"#0043", finca:"Estancia El Bosque",    operador:"Jorge Méndez",  litros:1300, temp:5.8,  ph:6.65, densidad:1.032, obs:"Sin novedad",      fecha:"2025-04-03 07:45", apta:true  },
  { id:"#0042", finca:"Villa Santa Marta",     operador:"Laura Gómez",   litros:750,  temp:7.2,  ph:6.72, densidad:1.029, obs:"Calidad óptima",  fecha:"2025-04-02 11:10", apta:true  },
];
export const FINCAS_BAR = [
  { name:"Finca El Roble",     litros:3200 },
  { name:"Hacienda San José",  litros:2900 },
  { name:"Granja Los Pinos",   litros:1800 },
  { name:"Lechería La Cumbre", litros:2100 },
  { name:"Rancho El Sol",      litros:980  },
];
export const SEMANAS_DEMO = [
  { sem:"Semana 12", litros:"3,500 L", rec:24, aprobado:"96%" },
  { sem:"Semana 11", litros:"4,100 L", rec:28, aprobado:"94%" },
  { sem:"Semana 10", litros:"3,750 L", rec:26, aprobado:"92%" },
  { sem:"Semana 09", litros:"4,200 L", rec:30, aprobado:"95%" },
];
export const TEMP_HIST = Array.from({length:24},(_,i)=>({ h:`${String(i).padStart(2,"0")}:00`, temp:+(3+Math.sin(i/3)*3+Math.random()*1.5).toFixed(1) }));
export const PH_HIST   = Array.from({length:24},(_,i)=>({ h:`${String(i).padStart(2,"0")}:00`, ph: +(6.6+Math.sin(i/4)*0.1+Math.random()*0.06).toFixed(2) }));
